import { describe, expect, it } from "vitest";
import { computeRevenueSplit } from "@/lib/economy/split";

const accounts = {
  editor: "editor.daily-swarm.testnet",
  "reporter-near": "reporter-near.daily-swarm.testnet",
  "reporter-ai": "reporter-ai.daily-swarm.testnet",
  "reporter-markets": "reporter-markets.daily-swarm.testnet",
  "fact-checker": "fact-checker.daily-swarm.testnet",
  treasury: "treasury.daily-swarm.testnet",
};

function splitWith(fees: Array<{ agentId: string; fee: number }>) {
  return computeRevenueSplit({
    total: 1,
    assignmentFees: fees,
    editorId: "editor",
    factCheckerId: "fact-checker",
    treasuryAccountId: "treasury.daily-swarm.testnet",
    accounts,
  });
}

function units(amount: number): number {
  return Math.round(amount * 10000);
}

describe("computeRevenueSplit", () => {
  it("conserves the total exactly at four decimals", () => {
    const split = splitWith([
      { agentId: "reporter-near", fee: 0.1 },
      { agentId: "reporter-ai", fee: 0.2 },
    ]);
    const total = split.lines.reduce((sum, line) => sum + units(line.amount), 0);
    expect(total).toBe(10000);
    expect(split.total).toBe(1);
  });

  it("splits the reporter pool pro rata by assignment fee", () => {
    const split = splitWith([
      { agentId: "reporter-near", fee: 0.1 },
      { agentId: "reporter-ai", fee: 0.2 },
    ]);
    const near = split.lines.find((line) => line.agentId === "reporter-near");
    const ai = split.lines.find((line) => line.agentId === "reporter-ai");
    expect(near).toBeDefined();
    expect(ai).toBeDefined();
    // 0.55 pool split 1:2. Floors keep the treasury whole.
    expect(units(near!.amount)).toBe(1833);
    expect(units(ai!.amount)).toBe(3666);
  });

  it("gives the editor 20%, fact-checker 15%, and treasury the remainder", () => {
    const split = splitWith([
      { agentId: "reporter-near", fee: 0.1 },
      { agentId: "reporter-ai", fee: 0.2 },
    ]);
    const editor = split.lines.find((line) => line.agentId === "editor");
    const checker = split.lines.find((line) => line.agentId === "fact-checker");
    const treasury = split.lines.find((line) => line.agentId === "treasury");
    expect(units(editor!.amount)).toBe(2000);
    expect(units(checker!.amount)).toBe(1500);
    expect(units(treasury!.amount)).toBe(10000 - 1833 - 3666 - 2000 - 1500);
    expect(treasury!.kind).toBe("retained");
  });

  it("is deterministic for the same inputs", () => {
    const fees = [
      { agentId: "reporter-near", fee: 0.1234 },
      { agentId: "reporter-markets", fee: 0.0891 },
    ];
    expect(splitWith(fees)).toEqual(splitWith(fees));
  });

  it("rejects a zero total and zero fees", () => {
    expect(() =>
      computeRevenueSplit({
        total: 0,
        assignmentFees: [{ agentId: "reporter-near", fee: 0.1 }],
        editorId: "editor",
        factCheckerId: "fact-checker",
        treasuryAccountId: "treasury.daily-swarm.testnet",
        accounts,
      }),
    ).toThrow(/greater than zero/);

    expect(() =>
      splitWith([
        { agentId: "reporter-near", fee: 0 },
        { agentId: "reporter-ai", fee: 0 },
      ]),
    ).toThrow(/positive/);
  });

  it("rejects missing agent accounts", () => {
    expect(() =>
      computeRevenueSplit({
        total: 1,
        assignmentFees: [{ agentId: "reporter-unknown", fee: 0.1 }],
        editorId: "editor",
        factCheckerId: "fact-checker",
        treasuryAccountId: "treasury.daily-swarm.testnet",
        accounts,
      }),
    ).toThrow(/No testnet account/);
  });
});
