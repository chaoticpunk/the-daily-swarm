/**
 * Server-side NEAR configuration. Never import this into a client component.
 */
import { AGENT_CONFIG, TREASURY_ACCOUNT_ID } from "@/lib/config";
import { AppError } from "@/lib/errors";
import { isValidAccountId } from "@/lib/utils";

export interface NearConfig {
  network: "testnet" | string;
  rpcUrl: string;
  treasuryAccountId: string;
  treasuryPrivateKey: string;
  accounts: Record<string, string>;
  explorerBase: string;
}

function envAccount(key: string, fallback: string): string {
  const value = process.env[key]?.trim();
  return value && value.length > 0 ? value : fallback;
}

export function getNearConfig(): NearConfig {
  const network = (process.env.NEAR_NETWORK ?? "testnet").trim().toLowerCase();
  const rpcUrl = (process.env.NEAR_RPC_URL ?? "https://test.rpc.fastnear.com").trim();
  const treasuryAccountId = envAccount("NEAR_TREASURY_ACCOUNT", TREASURY_ACCOUNT_ID);
  const treasuryPrivateKey = process.env.NEAR_TREASURY_PRIVATE_KEY?.trim() ?? "";

  const accounts: Record<string, string> = {
    editor: envAccount("NEAR_EDITOR_ACCOUNT", "editor.daily-swarm.testnet"),
    "reporter-near": envAccount(
      "NEAR_REPORTER_NEAR_ACCOUNT",
      "reporter-near.daily-swarm.testnet",
    ),
    "reporter-ai": envAccount(
      "NEAR_REPORTER_AI_ACCOUNT",
      "reporter-ai.daily-swarm.testnet",
    ),
    "reporter-markets": envAccount(
      "NEAR_REPORTER_MARKETS_ACCOUNT",
      "reporter-markets.daily-swarm.testnet",
    ),
    "fact-checker": envAccount(
      "NEAR_FACT_CHECKER_ACCOUNT",
      "fact-checker.daily-swarm.testnet",
    ),
    treasury: treasuryAccountId,
  };

  for (const agent of AGENT_CONFIG) {
    if (!accounts[agent.id]) accounts[agent.id] = agent.accountId;
  }

  const explorerBase =
    network === "testnet"
      ? "https://explorer.testnet.near.org"
      : "https://explorer.near.org";

  return {
    network,
    rpcUrl,
    treasuryAccountId,
    treasuryPrivateKey,
    accounts,
    explorerBase,
  };
}

export function assertTestnet(config = getNearConfig()): void {
  if (config.network !== "testnet") {
    throw new AppError({
      code: "NEAR_NOT_TESTNET",
      message: `NEAR_NETWORK is "${config.network}". The Daily Swarm is testnet-only.`,
      status: 503,
    });
  }
}

export function payoutConfigured(config = getNearConfig()): boolean {
  return (
    config.network === "testnet" &&
    config.treasuryPrivateKey.length > 0 &&
    isValidAccountId(config.treasuryAccountId)
  );
}

export function publicNearConfig(config = getNearConfig()) {
  let rpcHost = "invalid RPC URL";
  try {
    rpcHost = new URL(config.rpcUrl).host;
  } catch {
    // report the safe fallback
  }
  return {
    network: config.network,
    rpcHost,
    treasuryAccountId: config.treasuryAccountId,
    treasuryConfigured: payoutConfigured(config),
    accounts: config.accounts,
    explorerBase: config.explorerBase,
  };
}
