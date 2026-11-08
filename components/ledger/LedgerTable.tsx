import type { LedgerEntry, LedgerRole } from "@/lib/types";
import { cn, formatNear, shortAccount, shortHash } from "@/lib/utils";

const ROLE_LABEL: Record<LedgerRole, string> = {
  reporter: "Reporter",
  editor: "Editor-in-Chief",
  fact_checker: "Fact-checker",
  treasury: "Treasury",
};

const STATUS_LABEL: Record<LedgerEntry["status"], string> = {
  confirmed: "Confirmed",
  failed: "Failed",
  local: "Local · not on-chain",
  pending: "Pending",
};

export function LedgerTable({ entries }: { entries: LedgerEntry[] }) {
  return (
    <div className="scroll-x w-full max-w-full border border-rule bg-newsprint">
      <table className="w-full min-w-[720px] border-collapse text-left">
        <caption className="sr-only">
          Reader payments and contributor payouts with NEAR testnet transaction links
        </caption>
        <thead>
          <tr className="border-b-2 border-ink">
            <th scope="col" className="news-caps px-3 py-2 text-[8px] text-ink-soft">
              Entry
            </th>
            <th scope="col" className="news-caps px-3 py-2 text-[8px] text-ink-soft">
              From → To
            </th>
            <th scope="col" className="news-caps px-3 py-2 text-right text-[8px] text-ink-soft">
              Amount
            </th>
            <th scope="col" className="news-caps px-3 py-2 text-[8px] text-ink-soft">
              Status
            </th>
            <th scope="col" className="news-caps px-3 py-2 text-[8px] text-ink-soft">
              Transaction
            </th>
          </tr>
        </thead>
        <tbody>
          {entries.map((entry) => (
            <tr key={entry.id} className="border-b border-rule-soft last:border-b-0">
              <td className="px-3 py-2.5 align-top">
                <p className="text-xs font-semibold">
                  {entry.type === "reader_payment"
                    ? "Reader payment"
                    : entry.role
                      ? ROLE_LABEL[entry.role]
                      : "Contributor payout"}
                </p>
                <p className="mt-0.5 text-[10px] text-ink-soft">
                  {entry.type === "reader_payment" ? "Edition unlock" : "Revenue split"}
                  {entry.agentId ? ` · ${entry.agentId}` : ""}
                </p>
              </td>
              <td className="px-3 py-2.5 align-top">
                <p className="ledger-num text-[10px]" title={entry.from}>
                  {shortAccount(entry.from, 14, 8)}
                </p>
                <p className="ledger-num text-[10px] text-ink-soft" title={entry.to}>
                  → {shortAccount(entry.to, 14, 8)}
                </p>
              </td>
              <td className="ledger-num whitespace-nowrap px-3 py-2.5 text-right align-top text-xs">
                {formatNear(entry.amount)} NEAR
              </td>
              <td className="px-3 py-2.5 align-top">
                <span
                  className={cn(
                    "news-caps inline-block px-1.5 py-0.5 text-[7px]",
                    entry.status === "confirmed" && "bg-success/10 text-success",
                    entry.status === "failed" && "bg-accent/10 text-accent-deep",
                    entry.status === "local" && "bg-gold/30 text-ink",
                    entry.status === "pending" && "bg-newsprint-deep text-ink-soft",
                  )}
                >
                  {STATUS_LABEL[entry.status]}
                </span>
                {entry.kind === "retained" ? (
                  <p className="mt-1 max-w-[190px] text-[9px] leading-snug text-ink-soft">
                    Retained in treasury; no self-transfer.
                  </p>
                ) : null}
                {entry.kind === "local" ? (
                  <p className="mt-1 max-w-[190px] text-[9px] leading-snug text-ink-soft">
                    {entry.note}
                  </p>
                ) : null}
                {entry.status === "failed" && entry.note ? (
                  <p className="mt-1 max-w-[190px] text-[9px] leading-snug text-accent-deep">
                    {entry.note}
                  </p>
                ) : null}
              </td>
              <td className="px-3 py-2.5 align-top">
                {entry.explorerUrl && entry.txHash ? (
                  <a
                    href={entry.explorerUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="ledger-num text-[10px] text-accent-deep underline decoration-rule hover:decoration-accent"
                    title={entry.txHash}
                  >
                    {shortHash(entry.txHash)} ↗
                  </a>
                ) : (
                  <span className="text-[10px] text-ink-soft">
                    {entry.kind === "retained"
                      ? "No transfer"
                      : entry.kind === "local"
                        ? "Not on-chain"
                        : "No hash"}
                  </span>
                )}
                {entry.status === "confirmed" && entry.txHash ? (
                  <p className="mt-1 text-[9px] text-ink-soft">Final on testnet</p>
                ) : null}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
