import { describe, expect, it } from "vitest";
import { editionSchema } from "@/lib/agents/schemas";
import { sampleEdition } from "@/lib/content/sample-edition";
import { sourceIdsForBeat } from "@/lib/content/pack";

describe("sample edition", () => {
  it("validates with the same schema as a live edition", () => {
    expect(editionSchema.safeParse(sampleEdition).success).toBe(true);
  });

  it("cites only source IDs from each story's beat", () => {
    for (const story of sampleEdition.stories) {
      const allowed = sourceIdsForBeat(story.assignment.beat);
      for (const claim of (story.revisedDraft ?? story.draft).claims) {
        expect(allowed.has(claim.sourceId)).toBe(true);
      }
    }
  });

  it("covers every story in the front page order exactly once", () => {
    expect(sampleEdition.frontPageOrder).toHaveLength(
      sampleEdition.stories.length,
    );
    expect(new Set(sampleEdition.frontPageOrder)).toEqual(
      new Set(sampleEdition.stories.map((story) => story.id)),
    );
  });

  it("has a passing fact-check for every story", () => {
    for (const story of sampleEdition.stories) {
      expect(story.factCheck.overall).toBe("pass");
    }
  });
});
