import { AppError } from "@/lib/errors";
import type { LedgerEntry, RevenueSplit } from "@/lib/types";
import { yoctoToNear } from "@/lib/utils";

export function isSuccessStatus(status: unknown): boolean {
  return Boolean(status && typeof status === "object" && "SuccessValue" in status);
}

export function isFailureStatus(status: unknown): boolean {
  return Boolean(status && typeof status === "object" && "Failure" in status);
}

export function transferDepositFromActions(actions: unknown): bigint {
  if (!Array.isArray(actions)) return 0n;
  let total = 0n;
  for (const action of actions) {
    if (!action || typeof action !== "object") continue;
    const record = action as Record<string, unknown>;
    let deposit: unknown;
    if ("Transfer" in record && record.Transfer && typeof record.Transfer === "object") {
      deposit = (record.Transfer as { deposit?: unknown }).deposit;
    } else if (record.type === "Transfer") {
      const params = record.params as { deposit?: unknown } | undefined;
      deposit = params?.deposit;
    }
    if (typeof deposit === "string" || typeof deposit === "bigint") {
      try {
        total += BigInt(deposit);
      } catch {
        // Ignore malformed action entries.
      }
    }
  }
  return total;
}

export interface PaymentResponseRecord {
  final_execution_status?: string;
  status?: unknown;
  transaction?: {
    receiver_id?: string;
    signer_id?: string;
    actions?: unknown;
  };
  receipts_outcome?: Array<{ status?: unknown }>;
}

export interface PaymentEvaluation {
  entry: LedgerEntry;
  amountYocto: bigint;
}

/**
 * Pure evaluation of an RPC transaction-status response. No network access.
 * Throws AppError with a visible, specific failure.
 */
export function evaluatePaymentResponse(args: {
  response: unknown;
  txHash: string;
  senderAccountId: string;
  treasuryAccountId: string;
  expectedYocto: bigint;
  explorerBase: string;
  rpcHost: string;
  editionId: string;
}): PaymentEvaluation {
  const record = args.response as PaymentResponseRecord;

  if (!record || typeof record !== "object") {
    throw new AppError({
      code: "TX_BAD_RESPONSE",
      message: "NEAR RPC returned an unreadable transaction response.",
      status: 502,
    });
  }
  if (record.final_execution_status !== "FINAL") {
    throw new AppError({
      code: "TX_NOT_FINAL",
      message: "The payment transaction is not final yet. Try again in a moment.",
      status: 409,
      retryable: true,
    });
  }
  if (isFailureStatus(record.status)) {
    throw new AppError({
      code: "TX_FAILED",
      message: "The payment transaction failed on-chain.",
      status: 402,
    });
  }
  if (!isSuccessStatus(record.status)) {
    throw new AppError({
      code: "TX_NOT_SUCCESSFUL",
      message: "The payment transaction did not succeed.",
      status: 402,
    });
  }
  if (record.receipts_outcome?.some((outcome) => isFailureStatus(outcome.status))) {
    throw new AppError({
      code: "TX_RECEIPT_FAILED",
      message: "A receipt in the payment transaction failed on-chain.",
      status: 402,
    });
  }

  const receiver = record.transaction?.receiver_id;
  const signer = record.transaction?.signer_id;
  if (receiver !== args.treasuryAccountId) {
    throw new AppError({
      code: "WRONG_RECEIVER",
      message: `Payment must go to ${args.treasuryAccountId}. This transaction went to ${receiver ?? "an unknown receiver"}.`,
      status: 402,
    });
  }
  if (signer !== args.senderAccountId) {
    throw new AppError({
      code: "WRONG_SENDER",
      message: "The supplied sender account does not match the transaction signer.",
      status: 402,
    });
  }

  const deposit = transferDepositFromActions(record.transaction?.actions);
  if (deposit < args.expectedYocto) {
    throw new AppError({
      code: "UNDERPAID",
      message: `Payment must be at least 1 NEAR. This transaction transferred ${(
        Number(deposit) / 1e24
      ).toFixed(4)} NEAR.`,
      status: 402,
    });
  }

  const amount = yoctoToNear(deposit);
  const entry: LedgerEntry = {
    id: `reader-${args.txHash.slice(0, 16)}`,
    editionId: args.editionId,
    type: "reader_payment",
    kind: "transfer",
    from: args.senderAccountId,
    to: args.treasuryAccountId,
    amount,
    txHash: args.txHash,
    explorerUrl: `${args.explorerBase}/transactions/${args.txHash}`,
    status: "confirmed",
    note: `Verified via NEAR RPC (${args.rpcHost}).`,
  };

  return { entry, amountYocto: deposit };
}

export function classifyTreasuryTransfer(response: unknown): {
  status: "confirmed" | "failed";
  txHash?: string;
  note?: string;
} {
  const record = response as {
    status?: unknown;
    transaction_outcome?: { id?: string };
    transaction?: { hash?: string };
  };
  const hash = record?.transaction_outcome?.id ?? record?.transaction?.hash ?? "";
  if (!hash) {
    return {
      status: "failed",
      note: "The treasury transfer returned no transaction hash.",
    };
  }
  if (!isSuccessStatus(record.status)) {
    return {
      status: "failed",
      txHash: hash,
      note: "The treasury transfer was broadcast but did not succeed.",
    };
  }
  return { status: "confirmed", txHash: hash };
}

/** Purely local accounting entries used when the payout signer is absent. */
export function buildLocalPayouts(args: {
  editionId: string;
  split: RevenueSplit;
  reason: string;
  treasuryAccountId: string;
}): LedgerEntry[] {
  return args.split.lines.map((line, index) => ({
    id: `local-payout-${args.editionId}-${line.agentId}-${index}`,
    editionId: args.editionId,
    type: "agent_payout",
    kind: "local",
    agentId: line.agentId,
    role: line.role,
    from: args.treasuryAccountId,
    to: line.accountId,
    amount: line.amount,
    status: "local",
    note: `LOCAL ACCOUNTING ONLY — not on-chain. ${args.reason}`,
  }));
}
