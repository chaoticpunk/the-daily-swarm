"use client";

import { create } from "zustand";
import { AGENT_CONFIG, STAGE_LABELS } from "@/lib/config";
import { getDemoEditionDate } from "@/lib/content/pack";
import type {
  Agent,
  AgentStatus,
  ApiErrorBody,
  Assignment,
  Draft,
  Edition,
  FactCheck,
  Pitch,
  RejectedPitch,
  StageId,
  StageState,
  Story,
} from "@/lib/types";
import type {
  BalancesApiResponse,
  EditorNoteApiResponse,
  FactCheckApiResponse,
  PitchApiResponse,
  PublicNearConfig,
  SelectionApiResponse,
  WriteApiResponse,
} from "@/lib/api/types";
import { saveEdition } from "@/lib/storage";
import { makeId } from "@/lib/utils";

const STAGE_ORDER: StageId[] = [
  "pitches",
  "selection",
  "writes",
  "factChecks",
  "revisions",
  "rechecks",
  "editorNote",
];

type Phase = "idle" | "running" | "published" | "error";

interface StageResult {
  detail: string;
  skipped?: boolean;
}

interface NewsroomState {
  agents: Agent[];
  stages: StageState[];
  pitches: Pitch[];
  assignments: Assignment[];
  rejected: RejectedPitch[];
  totalCost: number;
  selectionNote: string;
  drafts: Record<string, Draft>;
  factChecks: Record<string, FactCheck>;
  revisedDrafts: Record<string, Draft>;
  rechecks: Record<string, FactCheck>;
  editorNote: string;
  frontPageOrder: string[];
  pullQuote: string;
  edition: Edition | null;
  phase: Phase;
  runError?: ApiErrorBody["error"];
  activeStage?: StageId;
  balancesState: "idle" | "loading" | "ready" | "error";
  balancesError?: string;
  nearConfig?: PublicNearConfig;
  treasuryBalance: number | null;
  storageError?: string;
}

interface NewsroomActions {
  loadBalances: () => Promise<void>;
  runEdition: () => Promise<void>;
  retry: () => Promise<void>;
  reset: () => void;
}

export type NewsroomStore = NewsroomState & NewsroomActions;

class ApiClientError extends Error {
  readonly apiError: ApiErrorBody["error"];
  constructor(apiError: ApiErrorBody["error"]) {
    super(apiError.message);
    this.name = "ApiClientError";
    this.apiError = apiError;
  }
}

async function postJson<T>(url: string, body: unknown): Promise<T> {
  let response: Response;
  try {
    response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
      cache: "no-store",
    });
  } catch {
    throw new ApiClientError({
      code: "NETWORK_ERROR",
      message: "Could not reach the server. Check your connection and retry.",
      retryable: true,
    });
  }
  const payload = (await response.json().catch(() => null)) as
    | T
    | ApiErrorBody
    | null;
  if (!response.ok) {
    const apiError =
      payload && typeof payload === "object" && "error" in payload
        ? (payload as ApiErrorBody).error
        : {
            code: `HTTP_${response.status}`,
            message: `The server returned HTTP ${response.status}.`,
          };
    throw new ApiClientError(apiError);
  }
  if (!payload) {
    throw new ApiClientError({
      code: "EMPTY_RESPONSE",
      message: "The server returned an empty response.",
    });
  }
  return payload as T;
}

function toApiError(error: unknown): ApiErrorBody["error"] {
  if (error instanceof ApiClientError) return error.apiError;
  if (error instanceof Error) {
    return { code: "CLIENT_ERROR", message: error.message };
  }
  return { code: "CLIENT_ERROR", message: "An unexpected client error occurred." };
}

function initialAgents(): Agent[] {
  return AGENT_CONFIG.map((agent) => ({
    id: agent.id,
    name: agent.name,
    role: agent.role,
    beat: agent.beat,
    desk: agent.desk,
    accountId: agent.accountId,
    budget: agent.budget,
    balance: null,
    status: "idle",
  }));
}

function initialStages(): StageState[] {
  return STAGE_ORDER.map((id) => ({
    id,
    label: STAGE_LABELS[id],
    status: "idle",
  }));
}

type RunState = Pick<
  NewsroomState,
  | "stages"
  | "pitches"
  | "assignments"
  | "rejected"
  | "totalCost"
  | "selectionNote"
  | "drafts"
  | "factChecks"
  | "revisedDrafts"
  | "rechecks"
  | "editorNote"
  | "frontPageOrder"
  | "pullQuote"
  | "edition"
  | "phase"
  | "runError"
  | "activeStage"
  | "storageError"
>;

function initialRunState(): RunState {
  return {
    stages: initialStages(),
    pitches: [],
    assignments: [],
    rejected: [],
    totalCost: 0,
    selectionNote: "",
    drafts: {},
    factChecks: {},
    revisedDrafts: {},
    rechecks: {},
    editorNote: "",
    frontPageOrder: [],
    pullQuote: "",
    edition: null,
    phase: "idle",
    runError: undefined,
    activeStage: undefined,
    storageError: undefined,
  };
}

async function settleAll<T>(tasks: Array<Promise<T>>): Promise<T[]> {
  const results = await Promise.allSettled(tasks);
  const failure = results.find(
    (result): result is PromiseRejectedResult => result.status === "rejected",
  );
  if (failure) throw failure.reason;
  return results.map((result) => (result as PromiseFulfilledResult<T>).value);
}

export const useNewsroomStore = create<NewsroomStore>((set, get) => {
  const setStage = (id: StageId, patch: Partial<StageState>) => {
    set((state) => ({
      stages: state.stages.map((stage) =>
        stage.id === id ? { ...stage, ...patch } : stage,
      ),
    }));
  };

  const setAgent = (id: string, patch: Partial<Agent>) => {
    set((state) => ({
      agents: state.agents.map((agent) =>
        agent.id === id ? { ...agent, ...patch } : agent,
      ),
    }));
  };

  const setAllAgents = (status: AgentStatus) => {
    set((state) => ({
      agents: state.agents.map((agent) => ({
        ...agent,
        status: agent.role === "editor" && status === "done" ? "done" : status,
      })),
    }));
  };

  const setAssignedReporters = (status: AgentStatus) => {
    const assigned = new Set(get().assignments.map((assignment) => assignment.agentId));
    set((state) => ({
      agents: state.agents.map((agent) =>
        assigned.has(agent.id) ? { ...agent, status } : agent,
      ),
    }));
  };

  const runPitchStage = async (): Promise<StageResult> => {
    const reporters = AGENT_CONFIG.filter((agent) => agent.role === "reporter");
    set({ pitches: [] });
    for (const reporter of reporters) setAgent(reporter.id, { status: "pitching" });

    await settleAll(
      reporters.map(async (reporter) => {
        const data = await postJson<PitchApiResponse>("/api/agent/pitch", {
          agentId: reporter.id,
        });
        set((state) => ({ pitches: [...state.pitches, data.pitch] }));
        setAgent(reporter.id, { status: "idle" });
        return data.pitch;
      }),
    );

    setAllAgents("idle");
    return { detail: `${reporters.length} pitches` };
  };

  const runSelectionStage = async (): Promise<StageResult> => {
    setAgent("editor", { status: "reviewing" });
    const data = await postJson<SelectionApiResponse>("/api/agent/select", {
      pitches: get().pitches,
    });
    const selectedIds = new Set(data.assignments.map((assignment) => assignment.agentId));
    set((state) => ({
      assignments: data.assignments,
      rejected: data.rejected,
      totalCost: data.totalCost,
      selectionNote: data.selectionNote,
      agents: state.agents.map((agent) => {
        if (agent.id === "editor") return { ...agent, status: "done" };
        if (agent.role === "reporter") {
          return {
            ...agent,
            status: selectedIds.has(agent.id) ? "assigned" : "idle",
          };
        }
        return agent;
      }),
    }));
    return {
      detail: `2 commissioned · 1 passed · ${data.totalCost.toFixed(4)} NEAR commissioned`,
    };
  };

  const runWriteStage = async (): Promise<StageResult> => {
    set({ drafts: {} });
    const assignments = get().assignments;
    const pitches = get().pitches;
    if (assignments.length !== 2) {
      throw new ApiClientError({
        code: "NO_ASSIGNMENTS",
        message: "The editor has not assigned two stories yet.",
      });
    }

    await settleAll(
      assignments.map(async (assignment) => {
        const pitch = pitches.find((item) => item.id === assignment.pitchId);
        if (!pitch) {
          throw new ApiClientError({
            code: "MISSING_PITCH",
            message: "A selected pitch is missing from the assignment.",
          });
        }
        setAgent(assignment.agentId, { status: "writing" });
        const data = await postJson<WriteApiResponse>("/api/agent/write", {
          assignment,
          pitch,
        });
        set((state) => ({
          drafts: { ...state.drafts, [assignment.pitchId]: data.draft },
        }));
      }),
    );

    setAssignedReporters("done");
    return { detail: `${assignments.length} drafts filed` };
  };

  const runFactCheckStage = async (): Promise<StageResult> => {
    set({ factChecks: {} });
    const { assignments, drafts } = get();
    if (assignments.length !== 2) {
      throw new ApiClientError({
        code: "NO_ASSIGNMENTS",
        message: "There are no assignments to fact-check.",
      });
    }
    setAgent("fact-checker", { status: "reviewing" });

    await settleAll(
      assignments.map(async (assignment) => {
        const draft = drafts[assignment.pitchId];
        if (!draft) {
          throw new ApiClientError({
            code: "MISSING_DRAFT",
            message: "A draft is missing before fact-checking.",
          });
        }
        const data = await postJson<FactCheckApiResponse>("/api/agent/fact-check", {
          draft,
          beat: assignment.beat,
        });
        set((state) => ({
          factChecks: { ...state.factChecks, [assignment.pitchId]: data.factCheck },
        }));
      }),
    );

    setAgent("fact-checker", { status: "done" });
    const checks = Object.values(get().factChecks);
    const flagged = checks.filter((check) => check.overall === "revise").length;
    return {
      detail:
        flagged === 0
          ? "All claims supported"
          : `${flagged} ${flagged === 1 ? "draft needs" : "drafts need"} revision`,
    };
  };

  const runRevisionStage = async (): Promise<StageResult> => {
    set({ revisedDrafts: {} });
    const { assignments, drafts, factChecks } = get();
    const needsRevision = assignments.filter(
      (assignment) => factChecks[assignment.pitchId]?.overall === "revise",
    );
    if (needsRevision.length === 0) {
      return { detail: "No revisions required", skipped: true };
    }

    await settleAll(
      needsRevision.map(async (assignment) => {
        const draft = drafts[assignment.pitchId];
        const factCheck = factChecks[assignment.pitchId];
        if (!draft || !factCheck) {
          throw new ApiClientError({
            code: "MISSING_REVISION_INPUT",
            message: "A draft or fact-check result is missing before revision.",
          });
        }
        setAgent(assignment.agentId, { status: "writing" });
        const data = await postJson<WriteApiResponse>("/api/agent/revise", {
          draft,
          factCheck,
          beat: assignment.beat,
        });
        set((state) => ({
          revisedDrafts: {
            ...state.revisedDrafts,
            [assignment.pitchId]: data.draft,
          },
        }));
      }),
    );

    setAssignedReporters("done");
    return { detail: `${needsRevision.length} revised once` };
  };

  const runRecheckStage = async (): Promise<StageResult> => {
    set({ rechecks: {} });
    const { assignments, revisedDrafts } = get();
    const toRecheck = assignments.filter(
      (assignment) => revisedDrafts[assignment.pitchId],
    );
    if (toRecheck.length === 0) {
      return { detail: "No revised drafts to re-check", skipped: true };
    }
    setAgent("fact-checker", { status: "reviewing" });

    await settleAll(
      toRecheck.map(async (assignment) => {
        const draft = revisedDrafts[assignment.pitchId];
        if (!draft) {
          throw new ApiClientError({
            code: "MISSING_REVISION",
            message: "A revised draft is missing before re-checking.",
          });
        }
        const data = await postJson<FactCheckApiResponse>("/api/agent/fact-check", {
          draft,
          beat: assignment.beat,
        });
        set((state) => ({
          rechecks: { ...state.rechecks, [assignment.pitchId]: data.factCheck },
        }));
      }),
    );

    setAgent("fact-checker", { status: "done" });
    const unresolved = Object.values(get().rechecks).filter(
      (check) => check.overall === "revise",
    ).length;
    return {
      detail:
        unresolved === 0
          ? "Revision passes the re-check"
          : `${unresolved} unresolved flag${unresolved === 1 ? "" : "s"} — shown on the edition`,
    };
  };

  const buildStories = (): Story[] => {
    const { assignments, pitches, drafts, factChecks, revisedDrafts, rechecks } =
      get();
    return assignments.map((assignment) => {
      const pitch = pitches.find((item) => item.id === assignment.pitchId);
      const draft = drafts[assignment.pitchId];
      const factCheck = factChecks[assignment.pitchId];
      if (!pitch || !draft || !factCheck) {
        throw new ApiClientError({
          code: "INCOMPLETE_STORY",
          message: "The edition cannot be assembled because a story is incomplete.",
        });
      }
      return {
        id: pitch.id,
        pitch,
        assignment,
        draft,
        factCheck,
        revisedDraft: revisedDrafts[assignment.pitchId],
        recheck: rechecks[assignment.pitchId],
      } satisfies Story;
    });
  };

  const runEditorNoteStage = async (): Promise<StageResult> => {
    setAgent("editor", { status: "reviewing" });
    const stories = buildStories();
    if (stories.length !== 2) {
      throw new ApiClientError({
        code: "STORY_COUNT",
        message: "The edition needs exactly two stories.",
      });
    }

    const data = await postJson<EditorNoteApiResponse>("/api/agent/editor-note", {
      stories,
    });
    const editionDate = getDemoEditionDate();
    const edition: Edition = {
      id: `edition-${editionDate}-${makeId("run").split("-").pop() ?? "local"}`,
      date: editionDate,
      status: "published",
      stories,
      editorNote: data.editorNote,
      selectionNote: get().selectionNote,
      frontPageOrder: data.frontPageOrder,
      pullQuote: data.pullQuote,
      payouts: [],
      totalRevenue: 0,
      createdAt: new Date().toISOString(),
    };
    const saved = saveEdition(edition);
    set({
      edition,
      editorNote: data.editorNote,
      frontPageOrder: data.frontPageOrder,
      pullQuote: data.pullQuote,
      storageError: saved
        ? undefined
        : "This browser could not save the edition to local storage. Keep this tab open, or the edition link will not work.",
    });
    setAllAgents("done");
    return { detail: "Edition published" };
  };

  const runners: Record<StageId, () => Promise<StageResult>> = {
    pitches: runPitchStage,
    selection: runSelectionStage,
    writes: runWriteStage,
    factChecks: runFactCheckStage,
    revisions: runRevisionStage,
    rechecks: runRecheckStage,
    editorNote: runEditorNoteStage,
  };

  const executePipeline = async (fromIndex: number): Promise<void> => {
    set({ phase: "running", runError: undefined });
    for (let index = fromIndex; index < STAGE_ORDER.length; index += 1) {
      const stageId = STAGE_ORDER[index];
      const started = Date.now();
      set((state) => ({
        activeStage: stageId,
        stages: state.stages.map((stage, stageIndex) => {
          if (stageIndex < index) return stage;
          if (stageIndex === index) {
            return {
              ...stage,
              status: "running",
              startedAt: started,
              durationMs: undefined,
              error: undefined,
              detail: undefined,
            };
          }
          return {
            ...stage,
            status: "idle",
            startedAt: undefined,
            durationMs: undefined,
            error: undefined,
            detail: undefined,
          };
        }),
      }));

      try {
        const result = await runners[stageId]();
        setStage(stageId, {
          status: result.skipped ? "skipped" : "done",
          durationMs: Date.now() - started,
          detail: result.detail,
          error: undefined,
        });
      } catch (error) {
        const apiError = toApiError(error);
        setStage(stageId, {
          status: "error",
          durationMs: Date.now() - started,
          error: apiError,
        });
        set((state) => ({
          phase: "error",
          runError: apiError,
          activeStage: stageId,
          agents: state.agents.map((agent) =>
            agent.status === "pitching" ||
            agent.status === "writing" ||
            agent.status === "reviewing"
              ? { ...agent, status: "idle" }
              : agent,
          ),
        }));
        return;
      }
    }
    set({ phase: "published", activeStage: undefined, runError: undefined });
  };

  return {
    agents: initialAgents(),
    ...initialRunState(),
    balancesState: "idle",
    treasuryBalance: null,
    ...({
      loadBalances: async () => {
        set({ balancesState: "loading", balancesError: undefined });
        try {
          const response = await fetch("/api/near/balances", { cache: "no-store" });
          const payload = (await response.json().catch(() => null)) as
            | BalancesApiResponse
            | ApiErrorBody
            | null;
          if (!response.ok) {
            const message =
              payload && typeof payload === "object" && "error" in payload
                ? (payload as ApiErrorBody).error.message
                : `Balances request failed with HTTP ${response.status}.`;
            throw new Error(message);
          }
          const data = payload as BalancesApiResponse;
          const balances = new Map(
            data.accounts.map((account) => [account.agentId, account.balanceNear]),
          );
          set((state) => ({
            balancesState: "ready",
            nearConfig: data.config,
            treasuryBalance: data.treasury.balanceNear,
            agents: state.agents.map((agent) => ({
              ...agent,
              accountId: data.config.accounts[agent.id] ?? agent.accountId,
              balance: balances.get(agent.id) ?? null,
            })),
          }));
        } catch (error) {
          set({
            balancesState: "error",
            balancesError:
              error instanceof Error
                ? error.message
                : "Could not read agent balances from NEAR testnet.",
          });
        }
      },
      runEdition: async () => {
        if (get().phase === "running") return;
        set({
          ...initialRunState(),
          agents: get().agents.map((agent) => ({ ...agent, status: "idle" })),
          phase: "running",
        });
        await executePipeline(0);
      },
      retry: async () => {
        if (get().phase !== "error") return;
        const failed = get().stages.find((stage) => stage.status === "error");
        if (!failed) return;
        const index = STAGE_ORDER.indexOf(failed.id);
        if (index < 0) return;
        await executePipeline(index);
      },
      reset: () => {
        if (get().phase === "running") return;
        set({
          ...initialRunState(),
          agents: get().agents.map((agent) => ({ ...agent, status: "idle" })),
        });
      },
    } satisfies NewsroomActions),
  };
});

export { STAGE_ORDER };
