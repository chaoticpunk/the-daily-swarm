import { z } from "zod";
import { getAgentConfig, EDITOR_BUDGET, MIN_PITCH_FEE, MIN_PITCH_WORDS } from "@/lib/config";
import { getSourcePackForBeat } from "@/lib/content/pack";
import { AppError } from "@/lib/errors";
import {
  generateStructured,
} from "@/lib/llm/client";
import {
  draftResponseSchema,
  editorNoteResponseSchema,
  factCheckResponseSchema,
  pitchResponseSchema,
  selectionResponseSchema,
} from "@/lib/agents/schemas";
import {
  buildEditorNotePrompt,
  buildFactCheckPrompt,
  buildPitchPrompt,
  buildRevisePrompt,
  buildSelectionPrompt,
  buildWritePrompt,
} from "@/lib/agents/prompts";
import type {
  AgentStepMeta,
  Assignment,
  Beat,
  Draft,
  EditorNoteResult,
  FactCheck,
  FactCheckCheck,
  Pitch,
  SelectionResult,
  SourcePack,
  Story,
} from "@/lib/types";
import {
  countWords,
  makeId,
  nearToFourDecimals,
  normalizeForQuote,
  quoteAppearsIn,
} from "@/lib/utils";

function wordCountInRange(actual: number, target: number): boolean {
  // Models do not count words the same way we do. Allow a little extra room
  // beyond the 10% target so a one- or two-word difference does not fail a draft.
  const tolerance = Math.max(Math.ceil(target * 0.15), 10);
  return actual >= target - tolerance && actual <= target + tolerance;
}

function allowedWordRange(target: number): string {
  const tolerance = Math.max(Math.ceil(target * 0.15), 10);
  return `${target - tolerance}-${target + tolerance}`;
}

function requireSourceIds(
  claims: Array<{ source_id: string; text: string }>,
  pack: SourcePack,
  ctx: z.RefinementCtx,
  field = "claims",
) {
  const valid = new Set(pack.topics.flatMap((topic) => topic.facts.map((fact) => fact.id)));
  const used = new Set<string>();
  claims.forEach((claim, index) => {
    if (!valid.has(claim.source_id)) {
      ctx.addIssue({
        code: "custom",
        message: `${field}[${index}].source_id "${claim.source_id}" is not in today's source pack`,
        path: [field, index, "source_id"],
      });
    }
    const textKey = normalizeForQuote(claim.text);
    if (used.has(textKey)) {
      ctx.addIssue({
        code: "custom",
        message: `${field}[${index}] duplicates an earlier claim`,
        path: [field, index, "text"],
      });
    }
    used.add(textKey);
  });
}

function packSources(pack: SourcePack): Set<string> {
  return new Set(pack.topics.flatMap((topic) => topic.facts.map((fact) => fact.id)));
}

function requireBeatAgent(agentId: string, beat?: Beat) {
  const agent = getAgentConfig(agentId);
  if (!agent || agent.role !== "reporter" || !agent.beat) {
    throw new AppError({
      code: "AGENT_NOT_FOUND",
      message: `No reporter is configured with id "${agentId}".`,
      status: 404,
    });
  }
  if (beat && agent.beat !== beat) {
    throw new AppError({
      code: "BEAT_MISMATCH",
      message: `${agent.name} covers ${agent.beat}, not ${beat}.`,
      status: 400,
    });
  }
  return agent;
}

export async function runPitchStep(agentId: string): Promise<{
  pitch: Pitch;
  meta: AgentStepMeta;
}> {
  const agent = requireBeatAgent(agentId);
  const beat = agent.beat as Beat;
  const pack = getSourcePackForBeat(beat);

  const schema = pitchResponseSchema.superRefine((value, ctx) => {
    if (nearToFourDecimals(value.requested_fee) < MIN_PITCH_FEE) {
      ctx.addIssue({
        code: "custom",
        message: `requested_fee must be at least ${MIN_PITCH_FEE} NEAR`,
        path: ["requested_fee"],
      });
    }
    if (value.requested_fee > agent.budget + 1e-9) {
      ctx.addIssue({
        code: "custom",
        message: `requested_fee must be <= this reporter's budget of ${agent.budget} NEAR`,
        path: ["requested_fee"],
      });
    }
    if (value.word_count < MIN_PITCH_WORDS || value.word_count > agent.maxWords) {
      ctx.addIssue({
        code: "custom",
        message: `word_count must be between ${MIN_PITCH_WORDS} and ${agent.maxWords}`,
        path: ["word_count"],
      });
    }
    requireSourceIds(value.claims, pack, ctx);
    if (value.claims.length < 3) {
      ctx.addIssue({
        code: "custom",
        message: "at least 3 claims are required",
        path: ["claims"],
      });
    }
  });

  const prompt = buildPitchPrompt({
    agentName: agent.name,
    beat,
    budget: agent.budget,
    maxWords: agent.maxWords,
    sourcePack: pack,
  });

  const { data, meta } = await generateStructured({
    step: `pitch:${agentId}`,
    system: prompt.system,
    user: prompt.user,
    schema,
    maxTokens: 1200,
  });

  const pitch: Pitch = {
    id: makeId(`pitch-${agentId}`),
    agentId,
    headline: data.headline,
    angle: data.angle,
    whyNow: data.why_now,
    claims: data.claims.map((claim) => ({
      text: claim.text,
      sourceId: claim.source_id,
    })),
    requestedFee: nearToFourDecimals(data.requested_fee),
    wordCount: Math.round(data.word_count),
  };

  return { pitch, meta };
}

export async function runSelectionStep(pitches: Pitch[]): Promise<{
  result: SelectionResult;
  meta: AgentStepMeta;
}> {
  if (pitches.length !== 3) {
    throw new AppError({
      code: "PITCH_COUNT",
      message: "The editor needs exactly three pitches.",
    });
  }
  const reporterIds = new Set(pitches.map((pitch) => pitch.agentId));
  if (reporterIds.size !== pitches.length) {
    throw new AppError({
      code: "DUPLICATE_REPORTER",
      message: "Each pitch must come from a different reporter.",
    });
  }

  const byId = new Map(pitches.map((pitch) => [pitch.id, pitch]));
  const schema = selectionResponseSchema.superRefine((value, ctx) => {
    const selectedIds = value.selected.map((item) => item.pitch_id);
    const rejectedIds = value.rejected.map((item) => item.pitch_id);
    const allReturned = [...selectedIds, ...rejectedIds];

    if (new Set(selectedIds).size !== selectedIds.length) {
      ctx.addIssue({
        code: "custom",
        message: "selected pitches must be unique",
        path: ["selected"],
      });
    }
    for (const id of allReturned) {
      if (!byId.has(id)) {
        ctx.addIssue({
          code: "custom",
          message: `pitch_id "${id}" does not exist`,
          path: ["selected"],
        });
      }
    }
    const expected = new Set(pitches.map((pitch) => pitch.id));
    const returned = new Set(allReturned);
    if (expected.size !== returned.size || [...expected].some((id) => !returned.has(id))) {
      ctx.addIssue({
        code: "custom",
        message: "selected and rejected must together cover all three pitches exactly once",
        path: ["selected"],
      });
    }

    const selectedReporters = new Set<string>();
    let actualTotal = 0;
    for (const item of value.selected) {
      const pitch = byId.get(item.pitch_id);
      if (!pitch) continue;
      if (pitch.agentId !== item.reporter_id) {
        ctx.addIssue({
          code: "custom",
          message: `reporter_id must be "${pitch.agentId}" for pitch "${pitch.id}"`,
          path: ["selected"],
        });
      }
      if (selectedReporters.has(pitch.agentId)) {
        ctx.addIssue({
          code: "custom",
          message: "two pitches from the same reporter cannot both be selected",
          path: ["selected"],
        });
      }
      selectedReporters.add(pitch.agentId);
      actualTotal += pitch.requestedFee;
    }
    if (actualTotal > EDITOR_BUDGET + 1e-9) {
      ctx.addIssue({
        code: "custom",
        message: `selected fees total ${actualTotal.toFixed(4)} NEAR, over the ${EDITOR_BUDGET} NEAR budget`,
        path: ["selected"],
      });
    }

    const rejectedPitch = value.rejected[0] ? byId.get(value.rejected[0].pitch_id) : undefined;
    const selectedSet = new Set(selectedIds);
    if (rejectedPitch && selectedSet.has(rejectedPitch.id)) {
      ctx.addIssue({
        code: "custom",
        message: "a selected pitch cannot also be rejected",
        path: ["rejected"],
      });
    }
  });

  const prompt = buildSelectionPrompt({ budget: EDITOR_BUDGET, pitches });
  const { data, meta } = await generateStructured({
    step: "selection",
    system: prompt.system,
    user: prompt.user,
    schema,
    maxTokens: 1000,
  });

  const assignments: Assignment[] = data.selected.map((item) => {
    const pitch = byId.get(item.pitch_id);
    if (!pitch) {
      throw new AppError({
        code: "UNKNOWN_PITCH",
        message: `The editor selected an unknown pitch: ${item.pitch_id}`,
      });
    }
    const agent = requireBeatAgent(pitch.agentId);
    return {
      pitchId: pitch.id,
      agentId: pitch.agentId,
      beat: agent.beat as Beat,
      wordCount: pitch.wordCount,
      fee: pitch.requestedFee,
    };
  });

  return {
    result: {
      assignments,
      rejected: data.rejected.map((item) => ({
        pitchId: item.pitch_id,
        reason: item.reason,
      })),
      totalCost: nearToFourDecimals(
        assignments.reduce((total, assignment) => total + assignment.fee, 0),
      ),
      selectionNote: data.editor_note,
    },
    meta,
  };
}

export async function runWriteStep(args: {
  assignment: Assignment;
  pitch: Pitch;
}): Promise<{ draft: Draft; meta: AgentStepMeta }> {
  const { assignment, pitch } = args;
  const agent = requireBeatAgent(assignment.agentId, assignment.beat);
  if (pitch.id !== assignment.pitchId || pitch.agentId !== assignment.agentId) {
    throw new AppError({
      code: "ASSIGNMENT_MISMATCH",
      message: "The assignment does not match the pitch.",
    });
  }
  const pack = getSourcePackForBeat(assignment.beat);
  const validSources = packSources(pack);

  const schema = draftResponseSchema.superRefine((value, ctx) => {
    requireSourceIds(value.claims, pack, ctx);
    const words = countWords(value.body_markdown);
    if (!wordCountInRange(words, assignment.wordCount)) {
      ctx.addIssue({
        code: "custom",
        message: `body_markdown is ${words} words; the assignment allows ${allowedWordRange(
          assignment.wordCount,
        )} words`,
        path: ["body_markdown"],
      });
    }
    for (const claim of value.claims) {
      if (!validSources.has(claim.source_id)) {
        ctx.addIssue({
          code: "custom",
          message: "claim source must be in today's source pack",
          path: ["claims"],
        });
      }
    }
  });

  const prompt = buildWritePrompt({
    agentName: agent.name,
    beat: assignment.beat,
    pitch,
    assignment,
    sourcePack: pack,
  });
  const { data, meta } = await generateStructured({
    step: `write:${assignment.agentId}`,
    system: prompt.system,
    user: prompt.user,
    schema,
    maxTokens: 2200,
  });

  const draft: Draft = {
    assignmentId: assignment.pitchId,
    pitchId: pitch.id,
    agentId: assignment.agentId,
    headline: data.headline,
    dek: data.dek,
    bodyMarkdown: data.body_markdown,
    claims: data.claims.map((claim) => ({
      text: claim.text,
      sourceId: claim.source_id,
    })),
    wordCount: countWords(data.body_markdown),
  };
  return { draft, meta };
}

function normalizeFactCheck(args: {
  raw: z.infer<typeof factCheckResponseSchema>;
  draft: Draft;
}): FactCheck {
  const rawChecks: FactCheckCheck[] = args.raw.checks.map((check) => ({
    claim: check.claim,
    sourceId: check.source_id,
    verdict: check.verdict,
    note: check.note,
  }));

  const checks: FactCheckCheck[] = [];
  const used = new Set<number>();
  for (const claim of args.draft.claims) {
    const normalizedClaim = normalizeForQuote(claim.text);
    let matchIndex = rawChecks.findIndex(
      (check, index) =>
        !used.has(index) && normalizeForQuote(check.claim) === normalizedClaim,
    );
    if (matchIndex === -1) {
      matchIndex = rawChecks.findIndex(
        (check, index) => !used.has(index) && check.sourceId === claim.sourceId,
      );
    }
    if (matchIndex === -1) {
      checks.push({
        claim: claim.text,
        sourceId: claim.sourceId,
        verdict: "needs_context",
        note: "The fact-checker did not review this claim; treated as needing context.",
      });
    } else {
      used.add(matchIndex);
      const match = rawChecks[matchIndex];
      checks.push({
        ...match,
        claim: match.claim || claim.text,
        sourceId: match.sourceId || claim.sourceId,
      });
    }
  }

  const hasUnsupported = checks.some((check) => check.verdict === "unsupported");
  const overall = hasUnsupported || args.raw.overall === "revise" ? "revise" : "pass";
  return { draftId: args.draft.assignmentId, checks, overall };
}

export async function runFactCheckStep(args: {
  draft: Draft;
  beat: Beat;
}): Promise<{ factCheck: FactCheck; meta: AgentStepMeta }> {
  const { draft, beat } = args;
  requireBeatAgent(draft.agentId, beat);
  const pack = getSourcePackForBeat(beat);

  const schema = factCheckResponseSchema.superRefine((value, ctx) => {
    requireSourceIds(
      value.checks.map((check) => ({ text: check.claim, source_id: check.source_id })),
      pack,
      ctx,
      "checks",
    );
  });

  const prompt = buildFactCheckPrompt({ draft, sourcePack: pack });
  const { data, meta } = await generateStructured({
    step: `fact-check:${draft.agentId}`,
    system: prompt.system,
    user: prompt.user,
    schema,
    maxTokens: 1600,
  });

  return { factCheck: normalizeFactCheck({ raw: data, draft }), meta };
}

export async function runReviseStep(args: {
  draft: Draft;
  factCheck: FactCheck;
  beat: Beat;
}): Promise<{ draft: Draft; meta: AgentStepMeta }> {
  const { draft, factCheck, beat } = args;
  const agent = requireBeatAgent(draft.agentId, beat);
  const pack = getSourcePackForBeat(beat);

  const schema = draftResponseSchema.superRefine((value, ctx) => {
    requireSourceIds(value.claims, pack, ctx);
    const words = countWords(value.body_markdown);
    if (!wordCountInRange(words, draft.wordCount)) {
      ctx.addIssue({
        code: "custom",
        message: `body_markdown is ${words} words; keep it within ${allowedWordRange(
          draft.wordCount,
        )} words`,
        path: ["body_markdown"],
      });
    }
  });

  const prompt = buildRevisePrompt({
    agentName: agent.name,
    draft,
    factCheck,
    wordCount: draft.wordCount,
  });
  const { data, meta } = await generateStructured({
    step: `revise:${draft.agentId}`,
    system: prompt.system,
    user: prompt.user,
    schema,
    maxTokens: 2200,
  });

  return {
    draft: {
      assignmentId: draft.assignmentId,
      pitchId: draft.pitchId,
      agentId: draft.agentId,
      headline: data.headline,
      dek: data.dek,
      bodyMarkdown: data.body_markdown,
      claims: data.claims.map((claim) => ({
        text: claim.text,
        sourceId: claim.source_id,
      })),
      wordCount: countWords(data.body_markdown),
    },
    meta,
  };
}

export async function runEditorNoteStep(stories: Story[]): Promise<{
  result: EditorNoteResult;
  meta: AgentStepMeta;
}> {
  if (stories.length !== 2) {
    throw new AppError({
      code: "STORY_COUNT",
      message: "The editor's note needs exactly two stories.",
    });
  }
  const storyIds = new Set(stories.map((story) => story.id));
  const storySummaries = stories.map((story) => {
    const finalDraft = story.revisedDraft ?? story.draft;
    return {
      id: story.id,
      headline: finalDraft.headline,
      dek: finalDraft.dek,
      bodyMarkdown: finalDraft.bodyMarkdown,
    };
  });

  const schema = editorNoteResponseSchema.superRefine((value, ctx) => {
    if (new Set(value.front_page_order).size !== 2) {
      ctx.addIssue({
        code: "custom",
        message: "front_page_order must contain two distinct story ids",
        path: ["front_page_order"],
      });
    }
    for (const [index, id] of value.front_page_order.entries()) {
      if (!storyIds.has(id)) {
        ctx.addIssue({
          code: "custom",
          message: `front_page_order[${index}] is not a story id`,
          path: ["front_page_order", index],
        });
      }
    }
    if (!quoteAppearsIn(value.pull_quote, storySummaries.map((story) => story.bodyMarkdown))) {
      ctx.addIssue({
        code: "custom",
        message: "pull_quote must be an exact excerpt from one of the two stories",
        path: ["pull_quote"],
      });
    }
  });

  const prompt = buildEditorNotePrompt({ stories: storySummaries });
  const { data, meta } = await generateStructured({
    step: "editor-note",
    system: prompt.system,
    user: prompt.user,
    schema,
    maxTokens: 800,
  });

  return {
    result: {
      editorNote: data.editor_note,
      frontPageOrder: data.front_page_order,
      pullQuote: data.pull_quote,
    },
    meta,
  };
}
