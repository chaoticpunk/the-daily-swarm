"use client";

import type { Edition, LedgerEntry, LedgerRole } from "@/lib/types";
import { cn, formatNear, shortAccount, shortHash } from "@/lib/utils";

const ROLE_LABEL: Record<LedgerRole, string> = {
  reporter: "Reporter",
  editor: "Editor-in-Chief",
  fact_checker: "Fact-checker",
  treasury: "Treasury",
};

function statusTone(entry: LedgerEntry): "ok" | "bad" | "local" | "muted" {
  if (entry.status === "confirmed") return entry.kind === "retained" ? "muted" : "ok";
  if (entry.status === "failed") return "bad";
  if (entry.status === "local") return "local";
  return "muted";
}

export function PaymentReceipt({
  edition,
  settlementError,
  payoutNotice,
  busy,
  onRetry,
  canRetry,
}: {
  edition: Edition;
  settlementError: string | null;
  payoutNotice: string | null;
  busy: boolean;
  onRetry: () => void;
  canRetry: boolean;
}) {
  const payment = edition.readerPayment;
  const payouts = edition.payouts;
  const payoutTotal = payouts.reduce((total, entry) => total + entry.amount, 0);
  const confirmed = payouts.filter((entry) => entry.status === "confirmed").length;
  const failed = payouts.filter((entry) => entry.status === "failed").length;
  const local = payouts.filter((entry) => entry.status === "local").length;
  const incomplete = Boolean(payment) && payouts.length === 0;

  return (
    <aside aria-labelledby="receipt-heading" className="paper-panel border-2 border-ink">
      <div className="border-b-2 border-ink bg-success/10 px-5 py-4">
        <p className="news-caps text-[10px] text-success">Reader receipt · verified</p>
        <h2 id="receipt-heading" className="font-headline mt-1 text-2xl font-bold">
          Edition unlocked
        </h2>
        <p className="mt-1 text-xs text-ink-soft">
          Payment confirmed on NEAR testnet.
        </p>
      </div>

      <div className="px-5 py-4">
        {payment ? (
          <div className="border-b border-rule pb-3">
            <div className="flex items-baseline justify-between gap-3">
              <p className="news-caps text-[10px] text-ink-soft">Reader payment</p>
              <p className="ledger-num text-lg font-medium">
                {formatNear(payment.amount)} NEAR
              </p>
            </div>
            <p className="ledger-num mt-1 text-[11px] text-ink-soft" title={payment.from}>
              from {shortAccount(payment.from, 16, 8)}
            </p>
            {payment.txHash && payment.explorerUrl ? (
              <a
                href={payment.explorerUrl}
                target="_blank"
                rel="noreferrer"
                className="ledger-num mt-1 inline-block text-[11px] text-accent-deep underline decoration-rule"
                title={payment.txHash}
              >
                View payment tx {shortHash(payment.txHash)} ↗
              </a>
            ) : null}
          </div>
        ) : (
          <p role="alert" className="border-l-2 border-accent pl-2 text-xs text-accent-deep">
            The edition is marked paid but has no payment entry. Do not treat this as
            settled.
          </p>
        )}

        <div className="mt-4">
          <div className="flex items-baseline justify-between gap-2">
            <p className="news-caps text-[10px] text-ink-soft">Settlement</p>
            <p className="ledger-num text-[11px] text-ink-soft">
              {formatNear(payoutTotal)} / {formatNear(edition.totalRevenue || 1)} NEAR
            </p>
          </div>

          {payouts.length === 0 ? (
            <p className="mt-2 text-xs leading-relaxed text-ink-soft">
              No payout entries yet. The split is settled after the reader payment is
              verified.
            </p>
          ) : (
            <ul className="mt-2 divide-y divide-rule-soft">
              {payouts.map((entry) => {
                const tone = statusTone(entry);
                return (
                  <li key={entry.id} className="py-2">
                    <div className="flex items-baseline justify-between gap-2">
                      <p className="text-xs font-semibold">
                        {entry.role ? ROLE_LABEL[entry.role] : "Payout"}
                      </p>
                      <p className="ledger-num text-xs">{formatNear(entry.amount)} NEAR</p>
                    </div>
                    <div className="mt-0.5 flex flex-wrap items-center justify-between gap-x-2 gap-y-1">
                      <p className="ledger-num text-[10px] text-ink-soft" title={entry.to}>
                        → {shortAccount(entry.to, 16, 8)}
                      </p>
                      <p
                        className={cn(
                          "news-caps text-[10px]",
                          tone === "ok" && "text-success",
                          tone === "bad" && "text-accent-deep",
                          tone === "local" && "text-ink-soft",
                          tone === "muted" && "text-ink-soft",
                        )}
                      >
                        {entry.status === "confirmed" && entry.kind === "retained"
                          ? "Retained"
                          : entry.status === "confirmed"
                            ? "Confirmed"
                            : entry.status === "failed"
                              ? "Failed"
                              : entry.status === "local"
                                ? "Local"
                                : "Pending"}
                      </p>
                    </div>
                    {entry.txHash && entry.explorerUrl ? (
                      <a
                        href={entry.explorerUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="ledger-num mt-0.5 inline-block text-[10px] text-accent-deep underline decoration-rule"
                        title={entry.txHash}
                      >
                        tx {shortHash(entry.txHash)} ↗
                      </a>
                    ) : entry.kind === "retained" ? (
                      <p className="mt-0.5 text-[10px] text-ink-soft">
                        Stays in the treasury; no self-transfer.
                      </p>
                    ) : entry.kind === "local" ? (
                      <p className="mt-0.5 text-[10px] leading-snug text-ink-soft">
                        Not on-chain.
                      </p>
                    ) : null}
                  </li>
                );
              })}
            </ul>
          )}

          <p className="ledger-num mt-2 text-[10px] text-ink-soft">
            {confirmed} confirmed · {failed} failed · {local} local
          </p>
        </div>

        {payoutNotice ? (
          <p
            role="note"
            className="mt-3 border-l-2 border-gold bg-gold/10 px-3 py-2 text-[11px] leading-relaxed text-ink"
          >
            {payoutNotice}
          </p>
        ) : null}

        {settlementError ? (
          <div className="mt-3 border-l-2 border-accent bg-accent/5 px-3 py-2">
            <p className="news-caps text-[10px] text-accent-deep">
              {canRetry ? "Settlement failed" : "Partial settlement"}
            </p>
            <p className="mt-1 text-[11px] leading-relaxed">{settlementError}</p>
            <p className="mt-1 text-[10px] leading-relaxed text-ink-soft">
              The reader payment is verified and the edition is unlocked.
              {canRetry
                ? " Settlement can be retried without paying again."
                : " Some transfers may already be final. Re-settling is disabled here to avoid double-paying a confirmed transfer; inspect the hashes above."}
            </p>
            {canRetry ? (
              <button
                type="button"
                onClick={onRetry}
                disabled={busy}
                className="news-caps mt-2 border border-ink px-3 py-2 text-[10px] hover:border-accent hover:text-accent-deep disabled:opacity-50"
              >
                {busy ? "Retrying…" : "Retry settlement"}
              </button>
            ) : null}
          </div>
        ) : null}

        {incomplete && !settlementError ? (
          <div className="mt-3 border-l-2 border-gold bg-gold/10 px-3 py-2">
            <p className="news-caps text-[10px]">Settlement incomplete</p>
            <p className="mt-1 text-[11px] leading-relaxed text-ink-soft">
              The payment is verified, but no payout entries were recorded.
            </p>
            <button
              type="button"
              onClick={onRetry}
              disabled={busy || !canRetry}
              className="news-caps mt-2 border border-ink px-3 py-2 text-[10px] hover:border-accent hover:text-accent-deep disabled:opacity-50"
            >
              {busy ? "Settling…" : "Settle the split"}
            </button>
          </div>
        ) : null}

        <a
          href="#edition-ledger"
          className="news-caps mt-4 inline-block text-[10px] text-ink-soft underline decoration-rule hover:text-accent-deep"
        >
          Jump to the full ledger ↓
        </a>
      </div>

      <div className="border-t border-rule bg-newsprint-deep px-5 py-3">
        <p className="news-caps text-[10px] text-ink-soft">
          Testnet only · no real money · demo edition
        </p>
      </div>
    </aside>
  );
}
