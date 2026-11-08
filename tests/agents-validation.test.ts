import { beforeEach, describe, expect, it, vi } from "vitest";
import { makePitch, makePitches, factsFor } from "./fixtures";
import type { Story } from "@/lib/types";

const llmMock = vi.hoisted(() => ({
  generateStructured: vi.fn(),
}));

vi.mock("@/lib/llm/client", () => ({
  generateStructured: llmMock.generateStructured,
}));

import {
  runEditorNoteStep,
  runPitchStep,
  runSelectionStep,
  runWriteStep,
} from "@/lib/agents/run";

function respondWith(payload: unknown) {
  llmMock.generateStructured.mockImplementation(
    async ({
      schema,
      step,
    }: {
      schema: { safeParse: (value: unknown) => { success: boolean } };
      step: string;
    }) => {
      const result = schema.safeParse(payload) as
        | { success: true; data: unknown }
        | { success: false; error: { message: string } };
      if (!result.success) {
        throw new Error(`schema failed: ${result.error.message}`);
      }
      return {
        data: result.data,
        meta: { step, model: "test-model", durationMs: 1, attempt: 1 as const },
      };
    },
  );
}

beforeEach(() => {
  llmMock.generateStructured.mockReset();
});

describe("pitch constraints", () => {
  it("rejects a claim whose source is not in the beat pack", async () => {
    const facts = factsFor("reporter-near");
    respondWith({
      headline: "NEAR Intents route through a solver market",
      angle: "Explain how quotes become settled transactions.",
      why_now: "The source pack explains the mechanism today.",
      claims: [
        { text: facts[0].text, source_id: facts[0].id },
        { text: facts[1].text, source_id: facts[1].id },
        { text: facts[2].text, source_id: "invented-source-id" },
      ],
      requested_fee: 0.1,
      word_count: 400,
    });

    await expect(runPitchStep("reporter-near")).rejects.toThrow(/schema failed/);
  });

  it("rejects a fee above the reporter budget", async () => {
    const facts = factsFor("reporter-near");
    respondWith({
      headline: "NEAR Intents route through a solver market",
      angle: "Explain how quotes become settled transactions.",
      why_now: "The source pack explains the mechanism today.",
      claims: facts.slice(0, 3).map((fact) => ({
        text: fact.text,
        source_id: fact.id,
      })),
      requested_fee: 5,
      word_count: 400,
    });

    await expect(runPitchStep("reporter-near")).rejects.toThrow(/schema failed/);
  });
});

describe("editor selection constraints", () => {
  it("normalizes fees from pitches and ignores the model's total_cost", async () => {
    const [near, ai, markets] = makePitches();
    respondWith({
      selected: [
        { pitch_id: near.id, reporter_id: near.agentId, word_count: 1, fee: 0.1 },
        { pitch_id: ai.id, reporter_id: ai.agentId, word_count: 1, fee: 0.1 },
      ],
      rejected: [
        { pitch_id: markets.id, reason: "The beat is already covered today." },
      ],
      total_cost: 99,
      editor_note: "Two desks fit the budget.",
    });

    const { result } = await runSelectionStep([near, ai, markets]);
    expect(result.assignments).toHaveLength(2);
    expect(result.totalCost).toBe(0.2);
    expect(result.rejected).toHaveLength(1);
    expect(result.rejected[0].reason).toMatch(/already covered/);
  });

  it("rejects a selection over the editor budget", async () => {
    const near = makePitch("reporter-near", { requestedFee: 1 });
    const ai = makePitch("reporter-ai", { requestedFee: 1 });
    const markets = makePitch("reporter-markets", { requestedFee: 1 });
    respondWith({
      selected: [
        { pitch_id: near.id, reporter_id: near.agentId, word_count: 400, fee: 1 },
        { pitch_id: ai.id, reporter_id: ai.agentId, word_count: 400, fee: 1 },
      ],
      rejected: [
        { pitch_id: markets.id, reason: "The beat is already covered today." },
      ],
      total_cost: 2,
      editor_note: "Two desks fit the budget.",
    });

    await expect(runSelectionStep([near, ai, markets])).rejects.toThrow(
      /schema failed/,
    );
  });

  it("rejects two pitches from the same reporter", async () => {
    const near = makePitch("reporter-near");
    const nearTwo = makePitch("reporter-near", { id: "pitch-near-two" });
    const ai = makePitch("reporter-ai");
    respondWith({});

    await expect(runSelectionStep([near, nearTwo, ai])).rejects.toThrow(
      /different reporter/,
    );
  });
});

describe("writing constraints", () => {
  it("rejects a draft outside the allowed word-count range", async () => {
    const pitch = makePitch("reporter-near");
    const facts = factsFor("reporter-near");
    respondWith({
      headline: "A draft that is much too short",
      dek: "A valid dek for the story.",
      body_markdown: `${"word ".repeat(40)}Analysis: interpretation.`,
      claims: facts.slice(0, 3).map((fact) => ({
        text: fact.text,
        source_id: fact.id,
      })),
    });

    await expect(
      runWriteStep({
        assignment: {
          pitchId: pitch.id,
          agentId: pitch.agentId,
          beat: "near",
          wordCount: 400,
          fee: pitch.requestedFee,
        },
        pitch,
      }),
    ).rejects.toThrow(/schema failed/);
  });

  it("accepts a small word-count difference within the grace range", async () => {
    const pitch = makePitch("reporter-near", { wordCount: 150 });
    const facts = factsFor("reporter-near");
    respondWith({
      headline: "A draft that is slightly over the assignment",
      dek: "A valid dek for the story.",
      body_markdown: Array(134).fill("word").join(" "),
      claims: facts.slice(0, 3).map((fact) => ({
        text: fact.text,
        source_id: fact.id,
      })),
    });

    const { draft } = await runWriteStep({
      assignment: {
        pitchId: pitch.id,
        agentId: pitch.agentId,
        beat: "near",
        wordCount: 150,
        fee: pitch.requestedFee,
      },
      pitch,
    });
    expect(draft.wordCount).toBe(134);
  });
});

function makeStory(id: string, agentId: string): Story {
  const pitch = makePitch(agentId, { id });
  const body = `${"word ".repeat(360)}Analysis: a carefully labelled interpretation.`;
  return {
    id,
    pitch,
    assignment: {
      pitchId: pitch.id,
      agentId,
      beat: "near",
      wordCount: 400,
      fee: 0.1,
    },
    draft: {
      assignmentId: pitch.id,
      pitchId: pitch.id,
      agentId,
      headline: "A sourced headline for the edition",
      dek: "A valid dek for the story.",
      bodyMarkdown: body,
      claims: pitch.claims,
      wordCount: 362,
    },
    factCheck: {
      draftId: pitch.id,
      checks: [
        {
          claim: pitch.claims[0].text,
          sourceId: pitch.claims[0].sourceId,
          verdict: "supported",
          note: "The source supports this claim.",
        },
      ],
      overall: "pass",
    },
  };
}

describe("editor note constraints", () => {
  it("rejects a pull quote that is not in either story", async () => {
    const one = makeStory("story-one", "reporter-near");
    const two = makeStory("story-two", "reporter-ai");
    respondWith({
      editor_note: "A short editor note for the edition.",
      front_page_order: [one.id, two.id],
      pull_quote: "This sentence appears in neither of the two stories.",
    });

    await expect(runEditorNoteStep([one, two])).rejects.toThrow(/schema failed/);
  });
});
