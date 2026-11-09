export type Beat = "near" | "ai" | "markets";

export type AgentRole = "editor" | "reporter" | "fact_checker";

export type LedgerRole = AgentRole | "treasury";

export type AgentStatus =
  | "idle"
  | "pitching"
  | "assigned"
  | "writing"
  | "reviewing"
  | "done";

export interface Agent {
  id: string;
  name: string;
  role: AgentRole;
  beat?: Beat;
  desk: string;
  accountId: string;
  budget: number;
  balance: number | null;
  status: AgentStatus;
}

export interface Claim {
  text: string;
  sourceId: string;
}

export interface Pitch {
  id: string;
  agentId: string;
  headline: string;
  angle: string;
  whyNow: string;
  claims: Claim[];
  requestedFee: number;
  wordCount: number;
}

export interface Assignment {
  pitchId: string;
  agentId: string;
  beat: Beat;
  wordCount: number;
  fee: number;
}

export interface RejectedPitch {
  pitchId: string;
  reason: string;
}

export interface Draft {
  assignmentId: string;
  pitchId: string;
  agentId: string;
  headline: string;
  dek: string;
  bodyMarkdown: string;
  claims: Claim[];
  wordCount: number;
}

export type FactCheckVerdict = "supported" | "unsupported" | "needs_context";

export interface FactCheckCheck {
  claim: string;
  sourceId: string;
  verdict: FactCheckVerdict;
  note: string;
}

export interface FactCheck {
  draftId: string;
  checks: FactCheckCheck[];
  overall: "pass" | "revise";
}

export interface Story {
  id: string;
  pitch: Pitch;
  assignment: Assignment;
  draft: Draft;
  factCheck: FactCheck;
  revisedDraft?: Draft;
  recheck?: FactCheck;
}

export type EditionStatus = "drafting" | "reviewing" | "published" | "paid";

export type LedgerEntryType = "reader_payment" | "agent_payout";

export type LedgerEntryStatus = "pending" | "confirmed" | "failed" | "local";

export type LedgerEntryKind = "transfer" | "retained" | "local";

export interface LedgerEntry {
  id: string;
  editionId: string;
  type: LedgerEntryType;
  kind: LedgerEntryKind;
  agentId?: string;
  role?: LedgerRole;
  from: string;
  to: string;
  amount: number;
  txHash?: string;
  explorerUrl?: string;
  status: LedgerEntryStatus;
  note?: string;
}

export interface Edition {
  id: string;
  date: string;
  status: EditionStatus;
  stories: Story[];
  editorNote: string;
  selectionNote: string;
  frontPageOrder: string[];
  pullQuote: string;
  readerPayment?: LedgerEntry;
  payouts: LedgerEntry[];
  totalRevenue: number;
  createdAt: string;
}

export interface SourceFact {
  id: string;
  text: string;
  sourceTitle: string;
  sourceUrl: string;
}

export interface SourceTopic {
  id: string;
  beat: Beat;
  title: string;
  angleHint: string;
  facts: SourceFact[];
}

export interface SourcePack {
  editionDate: string;
  topics: SourceTopic[];
}

export interface AgentStepMeta {
  step: string;
  model: string;
  durationMs: number;
  attempt: 1 | 2;
}

export interface AccountBalanceView {
  agentId: string;
  accountId: string;
  exists: boolean;
  balanceNear: number | null;
}

export interface HealthResponse {
  ok: boolean;
  demoOnly: true;
  llm: {
    configured: boolean;
    providerHost: string;
    model: string;
    timeoutMs: number;
  };
  near: {
    network: string;
    rpcHost: string;
    treasuryAccountId: string;
    treasuryConfigured: boolean;
    accounts: Record<string, string>;
    explorerBase: string;
    testnet: boolean;
    payoutsReady: boolean;
  };
  content: {
    editionDate: string;
    topics: number;
    facts: number;
  };
  serverTime: string;
}

export interface ApiErrorBody {
  error: {
    code: string;
    message: string;
    step?: string;
    detail?: string;
    retryable?: boolean;
  };
}

export interface SelectionResult {
  assignments: Assignment[];
  rejected: RejectedPitch[];
  totalCost: number;
  selectionNote: string;
}

/** Internal raw result of the editor-selection LLM step. */
export interface RawSelectionResult {
  selected: {
    pitchId: string;
    reporterId: string;
    wordCount: number;
    fee: number;
  }[];
  rejected: RejectedPitch[];
  totalCost: number;
  selectionNote: string;
}

export interface EditorNoteResult {
  editorNote: string;
  frontPageOrder: string[];
  pullQuote: string;
}

export interface SplitLine {
  agentId: string;
  role: LedgerRole;
  accountId: string;
  amount: number;
  percent: number;
  kind: LedgerEntryKind;
}

export interface RevenueSplit {
  lines: SplitLine[];
  total: number;
}

export type StageId =
  | "pitches"
  | "selection"
  | "writes"
  | "factChecks"
  | "revisions"
  | "rechecks"
  | "editorNote";

export type StageStatus = "idle" | "running" | "done" | "error" | "skipped";

export interface StageState {
  id: StageId;
  label: string;
  status: StageStatus;
  startedAt?: number;
  durationMs?: number;
  detail?: string;
  error?: ApiErrorBody["error"];
}

export type WireEventKind =
  | "open"
  | "pitch"
  | "commission"
  | "pass"
  | "draft"
  | "check"
  | "revision"
  | "recheck"
  | "publish"
  | "stop";

/**
 * One line on the newsroom wire. Every message is derived from an actual
 * agent response or from the browser's own orchestration step; nothing is
 * pre-filled or generated for display.
 */
export interface WireEvent {
  id: string;
  at: number;
  kind: WireEventKind;
  agentId?: string;
  message: string;
  detail?: string;
}
