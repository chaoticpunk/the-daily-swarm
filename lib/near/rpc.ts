/**
 * Server-only NEAR RPC + payout helpers. Testnet by policy.
 */
import { Account, JsonRpcProvider, actions, type KeyPairString } from "near-api-js";
import { READER_PRICE_NEAR } from "@/lib/config";
import { AppError } from "@/lib/errors";
import type { LedgerEntry, RevenueSplit } from "@/lib/types";
import {
  isValidAccountId,
  isValidTxHash,
  nearToYocto,
  sleep,
  yoctoToNear,
} from "@/lib/utils";
import {
  assertTestnet,
  getNearConfig,
  payoutConfigured,
} from "@/lib/near/config";
import {
  classifyTreasuryTransfer,
  evaluatePaymentResponse,
} from "@/lib/near/verify";

const providers = new Map<string, JsonRpcProvider>();

export function getProvider(config = getNearConfig()): JsonRpcProvider {
  const existing = providers.get(config.rpcUrl);
  if (existing) return existing;
  const provider = new JsonRpcProvider(
    { url: config.rpcUrl },
    { retries: 1, wait: 500, backoff: 2 },
  );
  providers.set(config.rpcUrl, provider);
  return provider;
}

async function withTimeout<T>(
  promise: Promise<T>,
  timeoutMs: number,
  message: string,
): Promise<T> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  const timeout = new Promise<never>((_, reject) => {
    timer = setTimeout(
      () =>
        reject(
          new AppError({
            code: "NEAR_RPC_TIMEOUT",
            message,
            status: 504,
            retryable: true,
          }),
        ),
      timeoutMs,
    );
  });
  try {
    return await Promise.race([promise, timeout]);
  } finally {
    if (timer) clearTimeout(timer);
  }
}

export interface AccountBalance {
  agentId: string;
  accountId: string;
  exists: boolean;
  balanceNear: number | null;
}

export async function readBalances(): Promise<{
  accounts: AccountBalance[];
  treasury: AccountBalance;
  fetchedAt: string;
}> {
  const config = getNearConfig();
  assertTestnet(config);
  const provider = getProvider(config);

  const uniqueAccounts = new Map<string, string>();
  for (const [agentId, accountId] of Object.entries(config.accounts)) {
    if (isValidAccountId(accountId)) uniqueAccounts.set(accountId, agentId);
  }

  const results = await Promise.all(
    [...uniqueAccounts.entries()].map(async ([accountId, agentId]) => {
      try {
        const view = await withTimeout(
          provider.viewAccount({ accountId }),
          8000,
          `Timed out reading ${accountId} from NEAR RPC.`,
        );
        return {
          agentId,
          accountId,
          exists: true,
          balanceNear: yoctoToNear(BigInt(view.amount)),
        } satisfies AccountBalance;
      } catch (error) {
        if (error instanceof AppError) throw error;
        return {
          agentId,
          accountId,
          exists: false,
          balanceNear: null,
        } satisfies AccountBalance;
      }
    }),
  );

  const treasury =
    results.find((item) => item.accountId === config.treasuryAccountId) ?? {
      agentId: "treasury",
      accountId: config.treasuryAccountId,
      exists: false,
      balanceNear: null,
    };

  return {
    accounts: results.filter((item) => item.agentId !== "treasury"),
    treasury,
    fetchedAt: new Date().toISOString(),
  };
}

function rpcHostOf(url: string): string {
  try {
    return new URL(url).host;
  } catch {
    return "NEAR RPC";
  }
}

export interface VerifiedPayment {
  entry: LedgerEntry;
  txHash: string;
  senderAccountId: string;
}

export async function verifyReaderPayment(args: {
  txHash: string;
  senderAccountId: string;
  editionId: string;
}): Promise<VerifiedPayment> {
  const config = getNearConfig();
  assertTestnet(config);

  if (!isValidTxHash(args.txHash)) {
    throw new AppError({
      code: "INVALID_TX_HASH",
      message: "That does not look like a NEAR transaction hash.",
      status: 400,
    });
  }
  if (!isValidAccountId(args.senderAccountId)) {
    throw new AppError({
      code: "INVALID_SENDER",
      message: "Enter the NEAR testnet account that signed the payment.",
      status: 400,
    });
  }

  const provider = getProvider(config);
  let response: unknown;
  try {
    response = await withTimeout(
      provider.viewTransactionStatus({
        txHash: args.txHash,
        accountId: args.senderAccountId,
        waitUntil: "FINAL",
      }),
      25000,
      "NEAR RPC did not finalize the transaction in time. Try verification again.",
    );
  } catch (error) {
    if (error instanceof AppError) throw error;
    throw new AppError({
      code: "NEAR_TX_LOOKUP_FAILED",
      message:
        "NEAR RPC could not find that transaction for the supplied sender account. Check the hash and signer account.",
      status: 409,
      retryable: true,
    });
  }

  const { entry } = evaluatePaymentResponse({
    response,
    txHash: args.txHash,
    senderAccountId: args.senderAccountId,
    treasuryAccountId: config.treasuryAccountId,
    expectedYocto: nearToYocto(READER_PRICE_NEAR),
    explorerBase: config.explorerBase,
    rpcHost: rpcHostOf(config.rpcUrl),
    editionId: args.editionId,
  });

  return { entry, txHash: args.txHash, senderAccountId: args.senderAccountId };
}

function payoutNoteForError(error: unknown): string {
  if (error instanceof Error) {
    return error.message.replace(/\s+/g, " ").slice(0, 240);
  }
  return "Transfer failed.";
}

export async function sendPayouts(args: {
  editionId: string;
  split: RevenueSplit;
  readerPayment: LedgerEntry;
}): Promise<LedgerEntry[]> {
  const config = getNearConfig();
  assertTestnet(config);
  if (!payoutConfigured(config)) {
    throw new AppError({
      code: "NEAR_PAYOUTS_NOT_CONFIGURED",
      message:
        "Treasury payouts are not configured. Set NEAR_TREASURY_PRIVATE_KEY to settle the split on testnet.",
      status: 503,
    });
  }

  const provider = getProvider(config);
  const account = new Account(
    config.treasuryAccountId,
    provider,
    config.treasuryPrivateKey as KeyPairString,
  );

  const entries: LedgerEntry[] = [];
  for (const [index, line] of args.split.lines.entries()) {
    const base: Omit<LedgerEntry, "status" | "kind"> = {
      id: `payout-${args.editionId}-${line.agentId}-${index}`,
      editionId: args.editionId,
      type: "agent_payout",
      agentId: line.agentId,
      role: line.role,
      from: config.treasuryAccountId,
      to: line.accountId,
      amount: line.amount,
    };

    if (line.kind === "retained" || line.amount <= 0) {
      entries.push({
        ...base,
        kind: "retained",
        status: "confirmed",
        note:
          line.amount <= 0
            ? "Share rounds to zero and is retained in the treasury."
            : "Platform share stays in the treasury; no self-transfer is sent. The reader payment is already on-chain.",
      });
      continue;
    }

    try {
      const response = await account.signAndSendTransaction({
        receiverId: line.accountId,
        actions: [actions.transfer(nearToYocto(line.amount))],
        waitUntil: "FINAL",
        throwOnFailure: false,
      });
      const result = classifyTreasuryTransfer(response);
      if (result.status === "failed") {
        entries.push({
          ...base,
          kind: "transfer",
          status: "failed",
          txHash: result.txHash,
          explorerUrl: result.txHash
            ? `${config.explorerBase}/transactions/${result.txHash}`
            : undefined,
          note: result.note ?? "The treasury transfer did not succeed.",
        });
        continue;
      }
      if (!result.txHash) {
        entries.push({
          ...base,
          kind: "transfer",
          status: "failed",
          note: "The treasury transfer returned no transaction hash.",
        });
        continue;
      }
      entries.push({
        ...base,
        kind: "transfer",
        status: "confirmed",
        txHash: result.txHash,
        explorerUrl: `${config.explorerBase}/transactions/${result.txHash}`,
        note: `Signed by ${config.treasuryAccountId} on NEAR testnet.`,
      });
    } catch (error) {
      entries.push({
        ...base,
        kind: "transfer",
        status: "failed",
        note: payoutNoteForError(error),
      });
    }
    // Keep sequential transfers stable for a single treasury access key.
    await sleep(150);
  }

  return entries;
}
