import type {
  AccountBalanceView,
  Edition,
  FactCheck,
  HealthResponse,
  LedgerEntry,
  Pitch,
  SelectionResult,
  AgentStepMeta,
  Draft,
} from "@/lib/types";

export interface ApiFailure {
  error: {
    code: string;
    message: string;
    step?: string;
    detail?: string;
    retryable?: boolean;
  };
}

export interface PitchApiResponse {
  pitch: Pitch;
  meta: AgentStepMeta;
}

export interface SelectionApiResponse extends SelectionResult {
  meta: AgentStepMeta;
}

export interface WriteApiResponse {
  draft: Draft;
  meta: AgentStepMeta;
}

export interface FactCheckApiResponse {
  factCheck: FactCheck;
  meta: AgentStepMeta;
}

export interface EditorNoteApiResponse {
  editorNote: string;
  frontPageOrder: string[];
  pullQuote: string;
  meta: AgentStepMeta;
}

export interface BalancesApiResponse {
  accounts: AccountBalanceView[];
  treasury: AccountBalanceView;
  fetchedAt: string;
  config: PublicNearConfig;
}

export interface PublicNearConfig {
  network: string;
  rpcHost: string;
  treasuryAccountId: string;
  treasuryConfigured: boolean;
  accounts: Record<string, string>;
  explorerBase: string;
}

export interface VerifyPaymentApiResponse {
  payment: LedgerEntry;
}

export interface PayoutApiResponse {
  configured: boolean;
  payment: LedgerEntry;
  payouts: LedgerEntry[];
  reason?: string;
}

export type HealthApiResponse = HealthResponse;

export interface EditionApiResponse {
  edition: Edition;
}
