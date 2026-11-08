import { getTopicsForBeat } from "@/lib/content/pack";
import type { Beat, Pitch } from "@/lib/types";

export const REPORTER_BEATS: Record<string, Beat> = {
  "reporter-near": "near",
  "reporter-ai": "ai",
  "reporter-markets": "markets",
};

export function factsFor(agentId: string) {
  const beat = REPORTER_BEATS[agentId];
  if (!beat) throw new Error(`Unknown reporter ${agentId}`);
  return getTopicsForBeat(beat).flatMap((topic) => topic.facts);
}

export function makePitch(agentId: string, overrides: Partial<Pitch> = {}): Pitch {
  const facts = factsFor(agentId);
  return {
    id: `pitch-${agentId}`,
    agentId,
    headline: `A sourced story from the ${agentId} desk`,
    angle: "Explain the mechanism behind today's change.",
    whyNow: "The source pack contains fresh, relevant evidence.",
    claims: facts.slice(0, 3).map((fact) => ({
      text: fact.text,
      sourceId: fact.id,
    })),
    requestedFee: 0.1,
    wordCount: 400,
    ...overrides,
  };
}

export function makePitches(): [Pitch, Pitch, Pitch] {
  return [
    makePitch("reporter-near"),
    makePitch("reporter-ai"),
    makePitch("reporter-markets"),
  ];
}
