import rawTopics from "@/data/topics.json";
import { sourcePackSchema } from "@/lib/content/schema";
import type { Beat, SourceFact, SourcePack, SourceTopic } from "@/lib/types";

const parsed = sourcePackSchema.parse(rawTopics);

export const sourcePack: SourcePack = {
  editionDate: parsed.editionDate,
  topics: parsed.topics,
};

export function getDemoEditionDate(): string {
  return sourcePack.editionDate;
}

export function getTopicsForBeat(beat: Beat): SourceTopic[] {
  return sourcePack.topics.filter((topic) => topic.beat === beat);
}

export function getSourcePackForBeat(beat: Beat): SourcePack {
  return {
    editionDate: sourcePack.editionDate,
    topics: getTopicsForBeat(beat),
  };
}

export function getAllFacts(): SourceFact[] {
  return sourcePack.topics.flatMap((topic) => topic.facts);
}

const factIndex = new Map<string, SourceFact>(
  getAllFacts().map((fact) => [fact.id, fact]),
);

export function getFactById(id: string): SourceFact | undefined {
  return factIndex.get(id);
}

export function getFactsByIds(ids: string[]): SourceFact[] {
  return ids
    .map((id) => factIndex.get(id))
    .filter((fact): fact is SourceFact => Boolean(fact));
}

export function sourceIdsForBeat(beat: Beat): Set<string> {
  return new Set(
    getTopicsForBeat(beat).flatMap((topic) => topic.facts.map((fact) => fact.id)),
  );
}

/** Public source list used by the edition page to resolve claim citations. */
export function sourceMap(): Record<string, SourceFact> {
  return Object.fromEntries(factIndex.entries());
}
