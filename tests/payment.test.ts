import { describe, expect, it } from "vitest";
import { computeRevenueSplit } from "@/lib/economy/split";
import { nearToYocto } from "@/lib/utils";
import {
  buildLocalPayouts,
  classifyTreasuryTransfer,
  evaluatePaymentResponse,
  transferDepositFromActions,
} from "@/lib/near/verify";

const treasury = "treasury.daily-swarm.testnet";
const sender = "reader.testnet";
const explorerBase = "https://explorer.testnet.near.org";

function evaluationArgs(response: unknown) {
  return {
    response,
    txHash: "11111111111111111111111111111111",
    senderAccountId: sender,
    treasuryAccountId: treasury,
    expectedYocto: nearToYocto(1),
    explorerBase,
    rpcHost: "rpc.testnet.near.org",
    editionId: "edition-test",
  };
}

function successResponse(overrides: Record<string, unknown> = {}) {
  return {
    final_execution_status: "FINAL",
    status: { SuccessValue: "" },
    transaction: {
      receiver_id: treasury,
      signer_id: sender,
      actions: [{ Transfer: { deposit: nearToYocto(1).toString() } }],
    },
    receipts_outcome: [{ status: { SuccessValue: "" } }],
    ...overrides,
  };
}

describe("evaluatePaymentResponse", () => {
  it("accepts a final, successful 1 NEAR transfer to the treasury", () => {
    const { entry } = evaluatePaymentResponse(evaluationArgs(successResponse()));
    expect(entry.status).toBe("confirmed");
    expect(entry.kind).toBe("transfer");
    expect(entry.amount).toBe(1);
    expect(entry.to).toBe(treasury);
    expect(entry.from).toBe(sender);
    expect(entry.txHash).toBe("11111111111111111111111111111111");
    expect(entry.explorerUrl).toContain("/transactions/");
  });

  it("rejects a transaction with the wrong receiver", () => {
    const response = successResponse({
      transaction: {
        receiver_id: "attacker.testnet",
        signer_id: sender,
        actions: [{ Transfer: { deposit: nearToYocto(1).toString() } }],
      },
    });
    expect(() => evaluatePaymentResponse(evaluationArgs(response))).toThrow(
      /must go to/,
    );
  });

  it("rejects an underpaid transfer", () => {
    const response = successResponse({
      transaction: {
        receiver_id: treasury,
        signer_id: sender,
        actions: [{ Transfer: { deposit: nearToYocto(0.5).toString() } }],
      },
    });
    expect(() => evaluatePaymentResponse(evaluationArgs(response))).toThrow(
      /at least 1 NEAR/,
    );
  });

  it("rejects a failed transaction", () => {
    const response = successResponse({
      status: { Failure: { ActionError: { index: 0 } } },
    });
    expect(() => evaluatePaymentResponse(evaluationArgs(response))).toThrow(
      /failed on-chain/,
    );
  });

  it("rejects a transaction that is not final", () => {
    const response = successResponse({ final_execution_status: "EXECUTED" });
    expect(() => evaluatePaymentResponse(evaluationArgs(response))).toThrow(
      /not final/,
    );
  });

  it("rejects a signer mismatch", () => {
    const response = successResponse({
      transaction: {
        receiver_id: treasury,
        signer_id: "someone-else.testnet",
        actions: [{ Transfer: { deposit: nearToYocto(1).toString() } }],
      },
    });
    expect(() => evaluatePaymentResponse(evaluationArgs(response))).toThrow(
      /does not match/,
    );
  });

  it("rejects a failed receipt", () => {
    const response = successResponse({
      receipts_outcome: [{ status: { Failure: {} } }],
    });
    expect(() => evaluatePaymentResponse(evaluationArgs(response))).toThrow(
      /receipt/,
    );
  });

  it("accepts a transfer action in type/params form and sums transfers", () => {
    const deposit = nearToYocto(0.6);
    const actions = [
      { type: "Transfer", params: { deposit: deposit.toString() } },
      { type: "Transfer", params: { deposit: deposit.toString() } },
    ];
    expect(transferDepositFromActions(actions)).toBe(deposit * 2n);
  });
});

describe("classifyTreasuryTransfer", () => {
  it("marks a successful transfer confirmed with a hash", () => {
    const result = classifyTreasuryTransfer({
      status: { SuccessValue: "" },
      transaction_outcome: { id: "TxHash111" },
    });
    expect(result).toEqual({ status: "confirmed", txHash: "TxHash111" });
  });

  it("marks a failed transfer failed, preserving the hash when present", () => {
    const result = classifyTreasuryTransfer({
      status: { Failure: {} },
      transaction_outcome: { id: "TxHash222" },
    });
    expect(result.status).toBe("failed");
    expect(result.txHash).toBe("TxHash222");
  });

  it("marks a response with no hash failed", () => {
    const result = classifyTreasuryTransfer({ status: { SuccessValue: "" } });
    expect(result.status).toBe("failed");
    expect(result.txHash).toBeUndefined();
  });
});

describe("buildLocalPayouts", () => {
  it("labels every line as local and keeps the split conserved", () => {
    const accounts = {
      editor: "editor.daily-swarm.testnet",
      "reporter-near": "reporter-near.daily-swarm.testnet",
      "reporter-ai": "reporter-ai.daily-swarm.testnet",
      "fact-checker": "fact-checker.daily-swarm.testnet",
    };
    const split = computeRevenueSplit({
      total: 1,
      assignmentFees: [
        { agentId: "reporter-near", fee: 0.1 },
        { agentId: "reporter-ai", fee: 0.2 },
      ],
      editorId: "editor",
      factCheckerId: "fact-checker",
      treasuryAccountId: treasury,
      accounts,
    });
    const entries = buildLocalPayouts({
      editionId: "edition-local",
      split,
      reason: "NEAR_TREASURY_PRIVATE_KEY is not set.",
      treasuryAccountId: treasury,
    });
    expect(entries).toHaveLength(5);
    for (const entry of entries) {
      expect(entry.status).toBe("local");
      expect(entry.kind).toBe("local");
      expect(entry.txHash).toBeUndefined();
      expect(entry.explorerUrl).toBeUndefined();
      expect(entry.note).toMatch(/LOCAL ACCOUNTING ONLY/);
    }
    const total = entries.reduce((sum, entry) => sum + entry.amount, 0);
    expect(Math.round(total * 10000)).toBe(10000);
  });
});
