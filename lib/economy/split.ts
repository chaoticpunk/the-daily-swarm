import { REVENUE_SHARES } from "@/lib/config";
import { AppError } from "@/lib/errors";
import type { RevenueSplit, SplitLine } from "@/lib/types";

export interface SplitInput {
  total: number;
  assignmentFees: Array<{ agentId: string; fee: number }>;
  editorId: string;
  factCheckerId: string;
  treasuryAccountId: string;
  accounts: Record<string, string>;
}

const UNITS_PER_NEAR = 10000;

/**
 * Deterministic reader-revenue split, computed in 1e-4 NEAR integer units.
 * Reporters share 55% pro rata by assignment fee; editor 20%; fact-checker 15%;
 * the treasury receives the remainder, absorbing rounding.
 */
export function computeRevenueSplit(input: SplitInput): RevenueSplit {
  const { total, assignmentFees, editorId, factCheckerId, treasuryAccountId, accounts } =
    input;

  if (!Number.isFinite(total) || total <= 0) {
    throw new AppError({
      code: "SPLIT_BAD_TOTAL",
      message: "Revenue split total must be greater than zero.",
    });
  }
  if (assignmentFees.length === 0) {
    throw new AppError({
      code: "SPLIT_NO_ASSIGNMENTS",
      message: "Revenue split needs at least one assignment.",
    });
  }

  const totalUnits = Math.round(total * UNITS_PER_NEAR);
  if (totalUnits < 1) {
    throw new AppError({
      code: "SPLIT_BAD_TOTAL",
      message: "Revenue split total is below 0.0001 NEAR.",
    });
  }

  const feeUnits = assignmentFees.map((assignment) => ({
    agentId: assignment.agentId,
    units: Math.round(assignment.fee * UNITS_PER_NEAR),
  }));
  const feeTotal = feeUnits.reduce((sum, item) => sum + item.units, 0);
  if (feeTotal <= 0) {
    throw new AppError({
      code: "SPLIT_BAD_FEES",
      message: "Assignment fees must sum to a positive amount.",
    });
  }

  const reporterPoolUnits = Math.floor(
    (totalUnits * Math.round(REVENUE_SHARES.reporters * 100)) / 100,
  );
  const editorUnits = Math.floor(
    (totalUnits * Math.round(REVENUE_SHARES.editor * 100)) / 100,
  );
  const factCheckerUnits = Math.floor(
    (totalUnits * Math.round(REVENUE_SHARES.factChecker * 100)) / 100,
  );

  const lines: SplitLine[] = [];

  for (const item of feeUnits) {
    const accountId = accounts[item.agentId];
    if (!accountId) {
      throw new AppError({
        code: "SPLIT_MISSING_ACCOUNT",
        message: `No testnet account is configured for ${item.agentId}.`,
      });
    }
    const units = Math.floor((reporterPoolUnits * item.units) / feeTotal);
    lines.push({
      agentId: item.agentId,
      role: "reporter",
      accountId,
      amount: units / UNITS_PER_NEAR,
      percent: units / totalUnits,
      kind: "transfer",
    });
  }

  const editorAccount = accounts[editorId];
  if (!editorAccount) {
    throw new AppError({
      code: "SPLIT_MISSING_ACCOUNT",
      message: `No testnet account is configured for ${editorId}.`,
    });
  }
  lines.push({
    agentId: editorId,
    role: "editor",
    accountId: editorAccount,
    amount: editorUnits / UNITS_PER_NEAR,
    percent: editorUnits / totalUnits,
    kind: "transfer",
  });

  const factCheckerAccount = accounts[factCheckerId];
  if (!factCheckerAccount) {
    throw new AppError({
      code: "SPLIT_MISSING_ACCOUNT",
      message: `No testnet account is configured for ${factCheckerId}.`,
    });
  }
  lines.push({
    agentId: factCheckerId,
    role: "fact_checker",
    accountId: factCheckerAccount,
    amount: factCheckerUnits / UNITS_PER_NEAR,
    percent: factCheckerUnits / totalUnits,
    kind: "transfer",
  });

  const allocated = lines.reduce(
    (sum, line) => sum + Math.round(line.amount * UNITS_PER_NEAR),
    0,
  );
  const treasuryUnits = totalUnits - allocated;
  if (treasuryUnits < 0) {
    throw new AppError({
      code: "SPLIT_OVERFLOW",
      message: "Revenue split allocated more than the total.",
    });
  }

  lines.push({
    agentId: "treasury",
    role: "treasury",
    accountId: treasuryAccountId,
    amount: treasuryUnits / UNITS_PER_NEAR,
    percent: treasuryUnits / totalUnits,
    kind: "retained",
  });

  const lineTotal = lines.reduce((sum, line) => sum + Math.round(line.amount * UNITS_PER_NEAR), 0);
  if (lineTotal !== totalUnits) {
    throw new AppError({
      code: "SPLIT_NOT_CONSERVED",
      message: "Revenue split does not sum to the total.",
      status: 500,
    });
  }

  return { lines, total: totalUnits / UNITS_PER_NEAR };
}
