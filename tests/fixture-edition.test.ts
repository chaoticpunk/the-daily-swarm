import { beforeEach, describe, expect, it, vi } from "vitest";
import { factsFor } from "./fixtures";
import type { Assignment, Pitch, Story } from "@/lib/types";

const llmMock = vi.hoisted(() => ({
  generateStructured: vi.fn(),
}));

vi.mock("@/lib/llm/client", () => ({
  generateStructured: llmMock.generateStructured,
}));

import {
  runEditorNoteStep,
  runFactCheckStep,
  runPitchStep,
  runReviseStep,
  runSelectionStep,
  runWriteStep,
} from "@/lib/agents/run";

type Queue = Map<string, unknown[]>;

function makePitchPayload(agentId: string) {
  const facts = factsFor(agentId);
  return {
    headline: `${agentId} files a sourced story for today's edition`,
    angle: "Explain the mechanism with the curated evidence.",
    why_now: "The source pack contains directly relevant evidence.",
    claims: facts.slice(0, 3).map((fact) => ({
      text: fact.text,
      source_id: fact.id,
    })),
    requested_fee: 0.1,
    word_count: 400,
  };
}

const BODY = `${Array(400).fill("word").join(" ")} A precise pull quote for the front page.`;

function makeDraftPayload(agentId: string) {
  const facts = factsFor(agentId);
  return {
    headline: `${agentId} reports a sourced story`,
    dek: "A carefully sourced dek for the edition page.",
    body_markdown: BODY,
    claims: facts.slice(0, 3).map((fact) => ({
      text: fact.text,
      source_id: fact.id,
    })),
  };
}

function makeFactCheckPayload(
  agentId: string,
  verdict: "supported" | "unsupported",
) {
  const facts = factsFor(agentId);
  return {
    checks: facts.slice(0, 3).map((fact) => ({
      claim: fact.text,
      source_id: fact.id,
      verdict,
      note:
        verdict === "supported"
          ? "The source snippet supports this claim."
          : "This claim is not supported by the source snippet.",
    })),
    overall: verdict === "unsupported" ? "revise" : "pass",
  };
}

function installFixtures() {
  const queues: Queue = new Map();

  function queue(step: string, ...payloads: unknown[]) {
    queues.set(step, payloads);
  }

  const near = makePitchPayload("reporter-near");
  const ai = makePitchPayload("reporter-ai");
  const markets = makePitchPayload("reporter-markets");

  queue("pitch:reporter-near", near);
  queue("pitch:reporter-ai", ai);
  queue("pitch:reporter-markets", markets);
  queue("selection", {
    selected: [
      { pitch_id: "near", reporter_id: "reporter-near", word_count: 400, fee: 0.1 },
      { pitch_id: "ai", reporter_id: "reporter-ai", word_count: 400, fee: 0.1 },
    ],
    rejected: [
      { pitch_id: "markets", reason: "The beat is already covered today." },
    ],
    total_cost: 0.2,
    editor_note: "Two desks fit the budget.",
  });
  queue("write:reporter-near", makeDraftPayload("reporter-near"));
  queue("write:reporter-ai", makeDraftPayload("reporter-ai"));
  queue("fact-check:reporter-ai", makeFactCheckPayload("reporter-ai", "supported"));
  queue(
    "fact-check:reporter-near",
    makeFactCheckPayload("reporter-near", "unsupported"),
    makeFactCheckPayload("reporter-near", "supported"),
  );
  queue("revise:reporter-near", makeDraftPayload("reporter-near"));
  queue("editor-note", {
    editor_note: "The swarm led with the mechanism, not the price.",
    front_page_order: ["placeholder-a", "placeholder-b"],
    pull_quote: "A precise pull quote for the front page.",
  });

  llmMock.generateStructured.mockImplementation(
    async ({ schema, step }: { schema: { safeParse: (v: unknown) => unknown }; step: string }) => {
      const payloads = queues.get(step);
      if (!payloads || payloads.length === 0) {
        throw new Error(`No fixture queued for step ${step}`);
      }
      const payload = payloads.length > 1 ? payloads.shift() : payloads[0];
      const result = schema.safeParse(payload) as
        | { success: true; data: unknown }
        | { success: false; error: { message: string } };
      if (!result.success) {
        throw new Error(`fixture failed schema for ${step}: ${result.error.message}`);
      }
      return {
        data: result.data,
        meta: { step, model: "fixture-model", durationMs: 1, attempt: 1 as const },
      };
    },
  );

  return queues;
}

beforeEach(() => {
  llmMock.generateStructured.mockReset();
});

describe("one edition with a fixture LLM", () => {
  it("runs pitch → select → write → check → revise → re-check → layout", async () => {
    const queues = installFixtures();

    const pitches: Pitch[] = [];
    for (const agentId of ["reporter-near", "reporter-ai", "reporter-markets"]) {
      const { pitch } = await runPitchStep(agentId);
      pitches.push(pitch);
    }
    expect(pitches).toHaveLength(3);

    // The fixture selection uses the reporter ids; rewrite pitch ids to the real ids.
    const selectionPayload = queues.get("selection")![0] as {
      selected: Array<{ pitch_id: string; reporter_id: string; word_count: number; fee: number }>;
      rejected: Array<{ pitch_id: string; reason: string }>;
    };
    const byAgent = new Map(pitches.map((pitch) => [pitch.agentId, pitch]));
    selectionPayload.selected[0].pitch_id = byAgent.get("reporter-near")!.id;
    selectionPayload.selected[1].pitch_id = byAgent.get("reporter-ai")!.id;
    selectionPayload.rejected[0].pitch_id = byAgent.get("reporter-markets")!.id;

    const { result: selection } = await runSelectionStep(pitches);
    expect(selection.assignments).toHaveLength(2);
    expect(selection.rejected).toHaveLength(1);
    expect(selection.totalCost).toBeCloseTo(0.2, 4);

    const drafts = new Map<string, Awaited<ReturnType<typeof runWriteStep>>["draft"]>();
    for (const assignment of selection.assignments) {
      const pitch = pitches.find((item) => item.id === assignment.pitchId)!;
      const { draft } = await runWriteStep({ assignment, pitch });
      drafts.set(assignment.pitchId, draft);
    }
    expect(drafts.size).toBe(2);

    const checks = new Map<string, Awaited<ReturnType<typeof runFactCheckStep>>["factCheck"]>();
    for (const assignment of selection.assignments) {
      const { factCheck } = await runFactCheckStep({
        draft: drafts.get(assignment.pitchId)!,
        beat: assignment.beat,
      });
      checks.set(assignment.pitchId, factCheck);
    }
    const nearAssignment = selection.assignments.find(
      (assignment) => assignment.agentId === "reporter-near",
    )!;
    const aiAssignment = selection.assignments.find(
      (assignment) => assignment.agentId === "reporter-ai",
    )!;
    expect(checks.get(nearAssignment.pitchId)!.overall).toBe("revise");
    expect(checks.get(aiAssignment.pitchId)!.overall).toBe("pass");

    const { draft: revised } = await runReviseStep({
      draft: drafts.get(nearAssignment.pitchId)!,
      factCheck: checks.get(nearAssignment.pitchId)!,
      beat: nearAssignment.beat,
    });
    expect(revised.wordCount).toBeGreaterThan(0);

    const { factCheck: recheck } = await runFactCheckStep({
      draft: revised,
      beat: nearAssignment.beat,
    });
    expect(recheck.overall).toBe("pass");

    const stories: Story[] = selection.assignments.map((assignment: Assignment) => {
      const pitch = pitches.find((item) => item.id === assignment.pitchId)!;
      return {
        id: pitch.id,
        pitch,
        assignment,
        draft: drafts.get(assignment.pitchId)!,
        factCheck: checks.get(assignment.pitchId)!,
        revisedDraft: assignment.agentId === "reporter-near" ? revised : undefined,
        recheck: assignment.agentId === "reporter-near" ? recheck : undefined,
      };
    });

    // Patch the editor-note fixture order to the real story ids.
    const editorPayload = queues.get("editor-note")![0] as {
      front_page_order: string[];
    };
    editorPayload.front_page_order = [stories[0].id, stories[1].id];

    const { result: note } = await runEditorNoteStep(stories);
    expect(note.frontPageOrder).toEqual([stories[0].id, stories[1].id]);
    expect(note.pullQuote).toMatch(/precise pull quote/);
    expect(note.editorNote.length).toBeGreaterThan(8);

    // An edition object assembled from the real step results is complete.
    const edition = {
      date: "2026-11-13",
      status: "published" as const,
      stories,
      editorNote: note.editorNote,
      frontPageOrder: note.frontPageOrder,
      pullQuote: note.pullQuote,
    };
    expect(edition.stories).toHaveLength(2);
    expect(edition.stories.some((story) => story.recheck?.overall === "pass")).toBe(true);
  });
});
