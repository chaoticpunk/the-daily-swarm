/**
 * Read-only setup check. Never prints private keys.
 *
 *   npm run check:setup
 */
import { config as loadEnv } from "dotenv";

loadEnv({ path: [".env.local", ".env"], quiet: true });

import { publicLlmConfig } from "@/lib/llm/client";
import { getNearConfig, payoutConfigured, publicNearConfig } from "@/lib/near/config";
import { readBalances } from "@/lib/near/rpc";

async function main() {
  const llm = publicLlmConfig();
  const near = publicNearConfig(getNearConfig());

  console.log("LLM");
  console.log(`  configured: ${llm.configured ? "yes" : "NO"}`);
  console.log(`  provider:   ${llm.providerHost}`);
  console.log(`  model:      ${llm.model}`);

  console.log("\nNEAR");
  console.log(`  network:    ${near.network}`);
  console.log(`  RPC:        ${near.rpcHost}`);
  console.log(`  treasury:   ${near.treasuryAccountId}`);
  console.log(`  payouts:    ${payoutConfigured() ? "signer configured" : "NOT configured (local fallback)"}`);

  try {
    const balances = await readBalances();
    console.table(
      [...balances.accounts, balances.treasury].map((account) => ({
        agent: account.agentId,
        accountId: account.accountId,
        exists: account.exists ? "yes" : "no",
        balance: account.balanceNear === null ? "—" : `${account.balanceNear.toFixed(4)} NEAR`,
      })),
    );
    const missing = [...balances.accounts, balances.treasury].filter(
      (account) => !account.exists,
    );
    if (missing.length > 0) {
      console.log(
        `\n${missing.length} account(s) were not found on testnet. Create/fund them before a real payment demo.`,
      );
    }
  } catch (error) {
    console.error(
      `\nCould not read balances: ${error instanceof Error ? error.message : String(error)}`,
    );
    process.exitCode = 1;
  }

  if (!llm.configured) {
    console.log(
      "\nSet NEARAI_CLOUD_API_KEY (or LLM_API_KEY) before running an edition.",
    );
  }
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
});
