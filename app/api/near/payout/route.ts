import { EDITOR_BUDGET, getAgentConfig, READER_PRICE_NEAR } from "@/lib/config";
import { computeRevenueSplit } from "@/lib/economy/split";
import { AppError } from "@/lib/errors";
import { apiRoute, jsonResponse, parseBody, readJsonBody } from "@/lib/api/http";
import { payoutRequestSchema } from "@/lib/api/schemas";
import { getNearConfig, payoutConfigured } from "@/lib/near/config";
import { claimPayout, releasePayout } from "@/lib/near/payout-registry";
import { sendPayouts, verifyReaderPayment } from "@/lib/near/rpc";
import { buildLocalPayouts } from "@/lib/near/verify";

export const maxDuration = 55;

export const POST = apiRoute("payout", async (request) => {
  const body = parseBody(payoutRequestSchema, await readJsonBody(request));

  if (body.assignments.length !== 2) {
    throw new AppError({
      code: "PAYOUT_ASSIGNMENT_COUNT",
      message: "The payout split needs exactly two assignments.",
    });
  }

  const reporterIds = new Set<string>();
  const pitchIds = new Set<string>();
  let feeTotal = 0;
  for (const assignment of body.assignments) {
    const agent = getAgentConfig(assignment.agentId);
    if (!agent || agent.role !== "reporter" || !agent.beat) {
      throw new AppError({
        code: "PAYOUT_UNKNOWN_REPORTER",
        message: `Payout target ${assignment.agentId} is not a configured reporter.`,
      });
    }
    if (agent.beat !== assignment.beat) {
      throw new AppError({
        code: "PAYOUT_BEAT_MISMATCH",
        message: `${agent.name} covers ${agent.beat}, not ${assignment.beat}.`,
      });
    }
    if (assignment.fee <= 0 || assignment.fee > agent.budget + 1e-9) {
      throw new AppError({
        code: "PAYOUT_FEE_INVALID",
        message: `Assignment fee for ${agent.name} must be within their ${agent.budget} NEAR budget.`,
      });
    }
    if (reporterIds.has(assignment.agentId)) {
      throw new AppError({
        code: "PAYOUT_DUPLICATE_REPORTER",
        message: "Each reporter can receive at most one payout per edition.",
      });
    }
    if (pitchIds.has(assignment.pitchId)) {
      throw new AppError({
        code: "PAYOUT_DUPLICATE_PITCH",
        message: "Duplicate assignment in payout request.",
      });
    }
    reporterIds.add(assignment.agentId);
    pitchIds.add(assignment.pitchId);
    feeTotal += assignment.fee;
  }

  if (feeTotal > EDITOR_BUDGET + 1e-9) {
    throw new AppError({
      code: "PAYOUT_OVER_BUDGET",
      message: `Assignment fees total ${feeTotal.toFixed(4)} NEAR, over the ${EDITOR_BUDGET} NEAR editorial budget.`,
    });
  }

  const config = getNearConfig();
  const verified = await verifyReaderPayment({
    txHash: body.readerTxHash,
    senderAccountId: body.senderAccountId,
    editionId: body.editionId,
  });

  const split = computeRevenueSplit({
    total: READER_PRICE_NEAR,
    assignmentFees: body.assignments.map((assignment) => ({
      agentId: assignment.agentId,
      fee: assignment.fee,
    })),
    editorId: "editor",
    factCheckerId: "fact-checker",
    treasuryAccountId: config.treasuryAccountId,
    accounts: config.accounts,
  });

  if (!payoutConfigured(config)) {
    return jsonResponse({
      configured: false,
      payment: verified.entry,
      payouts: buildLocalPayouts({
        editionId: body.editionId,
        split,
        reason:
          "NEAR_TREASURY_PRIVATE_KEY is not set on the server, so the split was not executed.",
        treasuryAccountId: config.treasuryAccountId,
      }),
      reason:
        "Treasury payouts are not configured. The reader payment is on-chain; the split is local accounting only.",
    });
  }

  if (!claimPayout(verified.txHash)) {
    throw new AppError({
      code: "PAYOUT_ALREADY_SETTLED",
      message:
        "This reader payment has already been settled in this server process. Check the ledger before retrying.",
      status: 409,
    });
  }

  try {
    const payouts = await sendPayouts({
      editionId: body.editionId,
      split,
      readerPayment: verified.entry,
    });
    return jsonResponse({
      configured: true,
      payment: verified.entry,
      payouts,
    });
  } catch (error) {
    releasePayout(verified.txHash);
    throw error;
  }
});
