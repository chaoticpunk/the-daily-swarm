import { beforeEach, describe, expect, it, vi } from "vitest";
import type { Assignment, Draft, Pitch } from "@/lib/types";
import { makePitch, makePitches } from "./fixtures";

const pitches = makePitches();
const byAgent = new Map(pitches.map((pitch) => [pitch.agentId, pitch]));
const selected: Assignment[] = [
  {
    pitchId: byAgent.get("reporter-near")!.id,
    agentId: "reporter-near",
    beat: "near",
    wordCount: 400,
    fee: 0.1,
  },
  {
    pitchId: byAgent.get("reporter-markets")!.id,
    agentId: "reporter-markets",
    beat: "markets",
    wordCount: 400,
    fee: 0.1,
  },
];

function draftFor(assignment: Assignment, pitch: Pitch): Draft {
  return {
    assignmentId: assignment.pitchId,
    pitchId: pitch.id,
    agentId: assignment.agentId,
    headline: pitch.headline,
    dek: pitch.angle,
    bodyMarkdown: `${"word ".repeat(400)}A precise pull quote for the front page.`,
    claims: pitch.claims,
    wordCount: 408,
  };
}

function meta(step: string) {
  return { step, model: "fixture-model", durationMs: 1, attempt: 1 };
}

function json(data: unknown): Response {
  return new Response(JSON.stringify(data), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
}

beforeEach(() => {
  vi.unstubAllGlobals();
  const fetchMock = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
    const url = typeof input === "string" ? input : input.toString();
    const body = init?.body ? JSON.parse(String(init.body)) : {};

    if (url.endsWith("/api/agent/pitch")) {
      const agentId = body.agentId as string;
      const pitch = makePitch(agentId);
      return json({ pitch, meta: meta(`pitch:${agentId}`) });
    }
    if (url.endsWith("/api/agent/select")) {
      return json({
        assignments: selected,
        rejected: [
          {
            pitchId: byAgent.get("reporter-ai")!.id,
            reason: "The beat is already covered today.",
          },
        ],
        totalCost: 0.2,
        selectionNote: "Two desks fit the budget.",
        meta: meta("selection"),
      });
    }
    if (url.endsWith("/api/agent/write") || url.endsWith("/api/agent/revise")) {
      const assignment = body.assignment as Assignment;
      const pitch = body.pitch as Pitch;
      return json({
        draft: draftFor(assignment, pitch),
        meta: meta("write"),
      });
    }
    if (url.endsWith("/api/agent/fact-check")) {
      const draft = body.draft as Draft;
      return json({
        factCheck: {
          draftId: draft.assignmentId,
          checks: draft.claims.map((claim) => ({
            claim: claim.text,
            sourceId: claim.sourceId,
            verdict: "supported",
            note: "The source supports this claim.",
          })),
          overall: "pass",
        },
        meta: meta("fact-check"),
      });
    }
    if (url.endsWith("/api/agent/editor-note")) {
      return json({
        editorNote: "The swarm led with the mechanism, not the price.",
        frontPageOrder: selected.map((assignment) => assignment.pitchId),
        pullQuote: "A precise pull quote for the front page.",
        meta: meta("editor-note"),
      });
    }
    throw new Error(`Unexpected fetch ${url}`);
  });
  vi.stubGlobal("fetch", fetchMock);
});

describe("newsroom store", () => {
  it("runs the full pipeline and leaves every agent done", async () => {
    const { useNewsroomStore } = await import("@/lib/store/newsroom");
    useNewsroomStore.getState().reset();
    await useNewsroomStore.getState().runEdition();
    const state = useNewsroomStore.getState();

    expect(state.phase).toBe("published");
    expect(state.edition).not.toBeNull();
    expect(state.edition?.stories).toHaveLength(2);
    expect(state.stages.find((stage) => stage.id === "pitches")?.status).toBe("done");
    expect(state.stages.find((stage) => stage.id === "selection")?.status).toBe("done");
    expect(state.stages.find((stage) => stage.id === "writes")?.status).toBe("done");
    expect(state.stages.find((stage) => stage.id === "factChecks")?.status).toBe("done");
    expect(state.stages.find((stage) => stage.id === "revisions")?.status).toBe("skipped");
    expect(state.stages.find((stage) => stage.id === "rechecks")?.status).toBe("skipped");
    expect(state.stages.find((stage) => stage.id === "editorNote")?.status).toBe("done");
    expect(state.agents.every((agent) => agent.status === "done")).toBe(true);
    expect(state.runError).toBeUndefined();
  });
});
