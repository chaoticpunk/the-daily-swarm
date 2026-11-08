import type { AgentRole, Beat, StageId } from "@/lib/types";

export interface AgentConfig {
  id: string;
  name: string;
  role: AgentRole;
  beat?: Beat;
  accountId: string;
  budget: number;
  maxWords: number;
  desk: string;
  bio: string;
}

/**
 * Testnet account IDs are defaults from the build brief. The server can override
 * each one with env vars (see lib/near/config.ts); the browser only ever displays them.
 */
export const AGENT_CONFIG: AgentConfig[] = [
  {
    id: "editor",
    name: "Marguerite Vale",
    role: "editor",
    accountId: "editor.daily-swarm.testnet",
    budget: 0.8,
    maxWords: 0,
    desk: "Editor-in-Chief",
    bio: "Allocates the edition budget and decides what runs.",
  },
  {
    id: "reporter-near",
    name: "Nadia Okoye",
    role: "reporter",
    beat: "near",
    accountId: "reporter-near.daily-swarm.testnet",
    budget: 0.4,
    maxWords: 550,
    desk: "NEAR desk",
    bio: "Covers the NEAR protocol, intents, and on-chain infrastructure.",
  },
  {
    id: "reporter-ai",
    name: "Kenji Arata",
    role: "reporter",
    beat: "ai",
    accountId: "reporter-ai.daily-swarm.testnet",
    budget: 0.4,
    maxWords: 550,
    desk: "AI desk",
    bio: "Covers models, agents, evaluation, and the systems around them.",
  },
  {
    id: "reporter-markets",
    name: "Sol Ruiz",
    role: "reporter",
    beat: "markets",
    accountId: "reporter-markets.daily-swarm.testnet",
    budget: 0.4,
    maxWords: 550,
    desk: "Markets desk",
    bio: "Covers payment rails, market structure, and tokenized assets.",
  },
  {
    id: "fact-checker",
    name: "Inez Calder",
    role: "fact_checker",
    accountId: "fact-checker.daily-swarm.testnet",
    budget: 0.15,
    maxWords: 0,
    desk: "Standards desk",
    bio: "Checks every claim against the curated source pack.",
  },
];

export function getAgentConfig(id: string): AgentConfig | undefined {
  return AGENT_CONFIG.find((agent) => agent.id === id);
}

export function getReporterConfigs(): AgentConfig[] {
  return AGENT_CONFIG.filter((agent) => agent.role === "reporter");
}

export const EDITOR_AGENT_ID = "editor";
export const FACT_CHECKER_AGENT_ID = "fact-checker";
export const TREASURY_AGENT_ID = "treasury";

export const TREASURY_ACCOUNT_ID = "treasury.daily-swarm.testnet";

export const READER_PRICE_NEAR = 1;

/** Deterministic reader-revenue split. The treasury absorbs rounding. */
export const REVENUE_SHARES = {
  reporters: 0.55,
  editor: 0.2,
  factChecker: 0.15,
  treasury: 0.1,
} as const;

export const STAGE_LABELS: Record<StageId, string> = {
  pitches: "Desks pitch",
  selection: "Editor commissions",
  writes: "Desks file",
  factChecks: "Standards desk checks",
  revisions: "Desks revise",
  rechecks: "Standards re-check",
  editorNote: "Editor lays out",
};

export const SITE = {
  name: "The Daily Swarm",
  tagline: "An autonomous newsroom with a public ledger.",
  description:
    "A daily edition produced by autonomous desks, with sourced reporting, independent fact-checks, and reader revenue settled on NEAR testnet.",
  repoUrl: "https://github.com/chaoticpunk/the-daily-swarm",
  crossDisclosure:
    "The Daily Swarm is an independent second project by the author of Sealed Ledger.",
  sealedLedgerUrl: "https://github.com/chaoticpunk/sealed-ledger",
  demoLabel: "DEMO EDITION · CURATED SOURCES",
} as const;

export const EXPLORER_BASE = "https://explorer.testnet.near.org";
export const NEAR_RPC_URL = "https://test.rpc.fastnear.com";

export const MAX_PITCH_WORDS = 550;
export const MIN_PITCH_WORDS = 250;
export const MIN_PITCH_FEE = 0.05;
export const PITCH_FEE_CEILING = 0.4;
export const EDITOR_BUDGET = 0.8;
