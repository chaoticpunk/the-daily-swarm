import { describe, expect, it } from "vitest";
import {
  draftResponseSchema,
  editorNoteResponseSchema,
  factCheckResponseSchema,
  pitchResponseSchema,
  selectionResponseSchema,
} from "@/lib/agents/schemas";
import { editionSchema } from "@/lib/agents/schemas";

describe("agent response schemas", () => {
  it("rejects a pitch with the wrong claim count", () => {
    const result = pitchResponseSchema.safeParse({
      headline: "A valid headline",
      angle: "A valid angle for the story.",
      why_now: "A valid reason to publish now.",
      claims: [{ text: "Only one claim", source_id: "near-intents-solver-market-1" }],
      requested_fee: 0.1,
      word_count: 400,
    });
    expect(result.success).toBe(false);
  });

  it("rejects a pitch missing required fields", () => {
    expect(pitchResponseSchema.safeParse({}).success).toBe(false);
  });

  it("rejects an editor selection that does not select exactly two", () => {
    const result = selectionResponseSchema.safeParse({
      selected: [
        { pitch_id: "a", reporter_id: "reporter-near", word_count: 300, fee: 0.1 },
      ],
      rejected: [
        { pitch_id: "c", reason: "Not enough sourcing for today." },
        { pitch_id: "d", reason: "Beat is already covered." },
      ],
      total_cost: 0.1,
      editor_note: "Two stories fit the budget.",
    });
    expect(result.success).toBe(false);
  });

  it("rejects an invalid fact-check verdict", () => {
    const result = factCheckResponseSchema.safeParse({
      checks: [
        {
          claim: "A claim from the draft.",
          source_id: "near-intents-solver-market-1",
          verdict: "probably_true",
          note: "Not a permitted verdict.",
        },
      ],
      overall: "pass",
    });
    expect(result.success).toBe(false);
  });

  it("accepts a well-formed draft", () => {
    const result = draftResponseSchema.safeParse({
      headline: "A valid headline",
      dek: "A valid dek for the story.",
      body_markdown: `${"word ".repeat(350)}Analysis: this is interpretation.`,
      claims: [
        {
          text: "A sourced factual sentence.",
          source_id: "near-intents-solver-market-1",
        },
      ],
    });
    expect(result.success).toBe(true);
  });

  it("rejects an editor note whose order is not two ids", () => {
    const result = editorNoteResponseSchema.safeParse({
      editor_note: "A short editor note for the edition.",
      front_page_order: ["one"],
      pull_quote: "A quote from a story.",
    });
    expect(result.success).toBe(false);
  });

  it("validates a complete edition", () => {
    const story = {
      id: "story-1",
      pitch: {
        id: "pitch-1",
        agentId: "reporter-near",
        headline: "A sourced headline",
        angle: "A valid angle for the story.",
        whyNow: "A valid reason to publish.",
        claims: [
          { text: "A sourced claim.", sourceId: "near-intents-solver-market-1" },
        ],
        requestedFee: 0.1,
        wordCount: 400,
      },
      assignment: {
        pitchId: "pitch-1",
        agentId: "reporter-near",
        beat: "near",
        wordCount: 400,
        fee: 0.1,
      },
      draft: {
        assignmentId: "pitch-1",
        pitchId: "pitch-1",
        agentId: "reporter-near",
        headline: "A sourced headline",
        dek: "A valid dek for the story.",
        bodyMarkdown: `${"word ".repeat(350)}Analysis: interpretation.`,
        claims: [
          { text: "A sourced claim.", sourceId: "near-intents-solver-market-1" },
        ],
        wordCount: 350,
      },
      factCheck: {
        draftId: "pitch-1",
        checks: [
          {
            claim: "A sourced claim.",
            sourceId: "near-intents-solver-market-1",
            verdict: "supported",
            note: "The source supports this.",
          },
        ],
        overall: "pass",
      },
    };
    const result = editionSchema.safeParse({
      id: "edition-1",
      date: "2026-11-13",
      status: "published",
      stories: [story],
      editorNote: "An editor note.",
      selectionNote: "A selection note.",
      frontPageOrder: ["story-1"],
      pullQuote: "A quote",
      payouts: [],
      totalRevenue: 0,
      createdAt: "2026-11-08T12:00:00.000Z",
    });
    expect(result.success).toBe(true);
  });
});
