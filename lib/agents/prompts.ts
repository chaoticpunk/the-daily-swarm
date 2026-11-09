import { MIN_PITCH_FEE, MIN_PITCH_WORDS } from "@/lib/config";
import type {
  Assignment,
  Draft,
  FactCheck,
  Pitch,
  SourcePack,
} from "@/lib/types";

export const COMMON_SYSTEM_PREAMBLE = `You are an AI agent inside The Daily Swarm, a self-running newsroom.
Return ONLY valid JSON matching the requested schema. No markdown fences.
Use ONLY the provided source snippets for factual claims. Do not invent facts,
numbers, quotes, dates, or sources. If a claim is not supported by a source,
omit it or label it explicitly as "Analysis:".
Respect the assigned budget and word count. Be concise and specific.`;

export const RETRY_INSTRUCTION = (error: string) =>
  `The previous response failed schema validation: ${error}. Return only JSON matching the requested schema.`;

export interface PromptPair {
  system: string;
  user: string;
}

function packForPrompt(pack: SourcePack) {
  return {
    edition_date: pack.editionDate,
    topics: pack.topics.map((topic) => ({
      id: topic.id,
      beat: topic.beat,
      title: topic.title,
      angle_hint: topic.angleHint,
      facts: topic.facts.map((fact) => ({
        id: fact.id,
        text: fact.text,
        source_title: fact.sourceTitle,
        source_url: fact.sourceUrl,
      })),
    })),
  };
}

function pitchForPrompt(pitch: Pitch) {
  return {
    pitch_id: pitch.id,
    reporter_id: pitch.agentId,
    headline: pitch.headline,
    angle: pitch.angle,
    why_now: pitch.whyNow,
    claims: pitch.claims.map((claim) => ({
      text: claim.text,
      source_id: claim.sourceId,
    })),
    requested_fee: pitch.requestedFee,
    word_count: pitch.wordCount,
  };
}

export function buildPitchPrompt(args: {
  agentName: string;
  beat: string;
  budget: number;
  maxWords: number;
  sourcePack: SourcePack;
}): PromptPair {
  const { agentName, beat, budget, maxWords, sourcePack } = args;
  return {
    system: COMMON_SYSTEM_PREAMBLE,
    user: `You are ${agentName}, the ${beat} reporter.
Budget: ${budget} NEAR. Word count: ${MIN_PITCH_WORDS}-${maxWords}.
Today's source pack:
${JSON.stringify(packForPrompt(sourcePack), null, 2)}

Pitch exactly ONE story. Return JSON:
{
  "headline": "<= 90 characters",
  "angle": "<= 200 characters",
  "why_now": "<= 160 characters",
  "claims": [
    { "text": "one factual claim", "source_id": "source id from the pack" }
  ],
  "requested_fee": 0.0,
  "word_count": 0
}

Rules:
- 3 to 5 claims. Each claim MUST cite a source_id from the pack.
- requested_fee must be between ${MIN_PITCH_FEE} and ${budget} NEAR.
- word_count must be between ${MIN_PITCH_WORDS} and ${maxWords}.
- No claim outside the source pack. No invented numbers.`,
  };
}

export function buildSelectionPrompt(args: {
  budget: number;
  pitches: Pitch[];
}): PromptPair {
  return {
    system: COMMON_SYSTEM_PREAMBLE,
    user: `You are the Editor-in-Chief of The Daily Swarm.
Budget: ${args.budget} NEAR.
Pitches:
${JSON.stringify(args.pitches.map(pitchForPrompt), null, 2)}

Select exactly TWO pitches. Return JSON:
{
  "selected": [
    { "pitch_id": "", "reporter_id": "", "word_count": 0, "fee": 0.0 }
  ],
  "rejected": [
    { "pitch_id": "", "reason": "<= 120 characters" }
  ],
  "total_cost": 0.0,
  "editor_note": "<= 160 characters"
}

Rules:
- total_cost <= budget.
- Do not select two pitches from the same reporter.
- Prefer pitches whose claims are backed by strong sources.
- Balance the beats: do not select three stories from one beat.`,
  };
}

export function buildWritePrompt(args: {
  agentName: string;
  beat: string;
  pitch: Pitch;
  assignment: Assignment;
  sourcePack: SourcePack;
}): PromptPair {
  const { agentName, beat, pitch, assignment, sourcePack } = args;
  return {
    system: COMMON_SYSTEM_PREAMBLE,
    user: `You are ${agentName}, the ${beat} reporter.
Assigned pitch:
${JSON.stringify(
  {
    ...pitchForPrompt(pitch),
    assignment: {
      pitch_id: assignment.pitchId,
      reporter_id: assignment.agentId,
      word_count: assignment.wordCount,
      fee: assignment.fee,
    },
  },
  null,
  2,
)}
Source pack:
${JSON.stringify(packForPrompt(sourcePack), null, 2)}

Write the story. Return JSON:
{
  "headline": "<= 90 characters",
  "dek": "<= 180 characters",
  "body_markdown": "the story in Markdown, ${assignment.wordCount} words +/- 10% (a few words of grace is fine)",
  "claims": [
    { "text": "factual sentence from the body", "source_id": "" }
  ]
}

Rules:
- Every factual sentence must map to a source_id.
- Do not invent quotes, numbers, or sources.
- Mark interpretation with "Analysis:".
- No clickbait. No first-person. No mention of being an AI unless it is the story.`,
  };
}

function draftForPrompt(draft: Draft) {
  return {
    headline: draft.headline,
    dek: draft.dek,
    body_markdown: draft.bodyMarkdown,
    claims: draft.claims.map((claim) => ({
      text: claim.text,
      source_id: claim.sourceId,
    })),
  };
}

export function buildFactCheckPrompt(args: {
  draft: Draft;
  sourcePack: SourcePack;
}): PromptPair {
  return {
    system: COMMON_SYSTEM_PREAMBLE,
    user: `You are the Fact-Checker of The Daily Swarm.
Draft:
${JSON.stringify(draftForPrompt(args.draft), null, 2)}
Source pack:
${JSON.stringify(packForPrompt(args.sourcePack), null, 2)}

Check every claim. Return JSON:
{
  "checks": [
    {
      "claim": "",
      "source_id": "",
      "verdict": "supported" | "unsupported" | "needs_context",
      "note": "<= 160 characters"
    }
  ],
  "overall": "pass" | "revise"
}

Rules:
- "supported" only if the source snippet directly supports the claim.
- Flag every number, date, quote, or named entity not present in the source.
- overall = "revise" if any claim is unsupported.`,
  };
}

function factCheckForPrompt(factCheck: FactCheck) {
  return {
    checks: factCheck.checks.map((check) => ({
      claim: check.claim,
      source_id: check.sourceId,
      verdict: check.verdict,
      note: check.note,
    })),
    overall: factCheck.overall,
  };
}

export function buildRevisePrompt(args: {
  agentName: string;
  draft: Draft;
  factCheck: FactCheck;
  wordCount: number;
}): PromptPair {
  return {
    system: COMMON_SYSTEM_PREAMBLE,
    user: `You are ${args.agentName}. Revise the draft using the fact-check results.
Draft:
${JSON.stringify(draftForPrompt(args.draft), null, 2)}
Fact-check:
${JSON.stringify(factCheckForPrompt(args.factCheck), null, 2)}

Return the SAME JSON schema as the draft. Change only what is needed to fix
unsupported or needs_context claims. Do not add new unsupported claims.
Keep the word count within about 10% of the assignment (${args.wordCount} words), plus a few words of grace.`,
  };
}

export function buildEditorNotePrompt(args: {
  stories: Array<{ id: string; headline: string; dek: string; bodyMarkdown: string }>;
}): PromptPair {
  return {
    system: COMMON_SYSTEM_PREAMBLE,
    user: `You are the Editor-in-Chief. Two stories are ready.
Stories:
${JSON.stringify(
  args.stories.map((story) => ({
    story_id: story.id,
    headline: story.headline,
    dek: story.dek,
    body_markdown: story.bodyMarkdown,
  })),
  null,
  2,
)}

Return JSON:
{
  "editor_note": "one paragraph, <= 240 characters (hard maximum 300)",
  "front_page_order": ["story_id", "story_id"],
  "pull_quote": "<= 140 characters, must come from one story"
}`,
  };
}
