"use client";

/* eslint-disable react-hooks/set-state-in-effect -- The ledger archive is localStorage; it can only be read after mount. */

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { LedgerTable } from "@/components/ledger/LedgerTable";
import { READER_PRICE_NEAR } from "@/lib/config";
import type { Edition, HealthResponse, LedgerEntry } from "@/lib/types";
import { listEditions } from "@/lib/storage";
import {
  formatNear,
  shortAccount,
  shortDateLabel,
} from "@/lib/utils";

type LoadState = "loading" | "ready";

export function LedgerPageClient() {
  const [loadState, setLoadState] = useState<LoadState>("loading");
  const [editions, setEditions] = useState<Edition[]>([]);
  const [health, setHealth] = useState<HealthResponse | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    setEditions(listEditions());
    setLoadState("ready");
  }, [refreshKey]);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/health", { cache: "no-store" })
      .then(async (response) => {
        const data = (await response.json().catch(() => null)) as
          | HealthResponse
          | null;
        if (!cancelled && data) setHealth(data);
      })
      .catch(() => {
        // The archive is still readable without the health endpoint.
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const summary = useMemo(() => {
    const entries = editions.flatMap((edition) => [
      ...(edition.readerPayment ? [edition.readerPayment] : []),
      ...edition.payouts,
    ]);
    return {
      editions: editions.length,
      readerRevenue: editions.reduce(
        (total, edition) => total + (edition.readerPayment?.amount ?? 0),
        0,
      ),
      confirmedPayouts: entries.filter(
        (entry) => entry.type === "agent_payout" && entry.status === "confirmed",
      ).length,
      localEntries: entries.filter((entry) => entry.status === "local").length,
      failedEntries: entries.filter((entry) => entry.status === "failed").length,
      totalEntries: entries.length,
    };
  }, [editions]);

  return (
    <div className="mx-auto max-w-[1500px] px-4 sm:px-6 lg:px-8">
      <header className="border-b-2 border-ink py-8">
        <div className="grid gap-6 lg:grid-cols-12 lg:items-end">
          <div className="lg:col-span-8">
            <p className="news-caps text-[11px] text-accent-deep">
              Reader payments · contributor payouts
            </p>
            <h1 className="font-headline mt-2 text-4xl leading-none font-bold tracking-tight sm:text-6xl">
              The Ledger
            </h1>
            <p className="mt-3 max-w-2xl text-sm leading-relaxed text-ink-soft">
              Every unlocked edition leaves a settlement record. Reader payments are
              verified on NEAR; the fixed split is signed by the treasury. Transaction
              hashes link to the explorer, and local accounting is always labelled as
              local.
            </p>
          </div>
          <div className="lg:col-span-4 lg:border-l lg:border-rule lg:pl-5">
            <p className="news-caps text-[10px] text-ink-soft">Settlement network</p>
            <p className="ledger-num mt-2 text-[11px]">
              {health
                ? `${health.near.network} · ${health.near.rpcHost}`
                : "—"}
            </p>
            <p className="mt-1 text-[11px] text-ink-soft">
              Treasury:{" "}
              <span className="ledger-num">
                {shortAccount(
                  health?.near.treasuryAccountId ??
                    "treasury.daily-swarm.testnet",
                )}
              </span>
            </p>
            <p className="mt-1 text-[11px] text-ink-soft">
              Settlement:{" "}
              {health
                ? health.near.payoutsReady
                  ? "on-chain"
                  : "local accounting only"
                : "unknown"}
            </p>
          </div>
        </div>
      </header>

      <section
        aria-label="Ledger summary"
        className="grid grid-cols-2 gap-px border-b border-rule bg-rule sm:grid-cols-4"
      >
        {[
          ["Editions", String(summary.editions)],
          ["Reader revenue", `${formatNear(summary.readerRevenue)} NEAR`],
          ["Confirmed payouts", String(summary.confirmedPayouts)],
          [
            "Local / failed",
            `${summary.localEntries} local · ${summary.failedEntries} failed`,
          ],
        ].map(([label, value]) => (
          <div key={label} className="bg-newsprint px-4 py-4">
            <p className="news-caps text-[10px] text-ink-soft">{label}</p>
            <p className="ledger-num mt-1 text-lg">{value}</p>
          </div>
        ))}
      </section>

      {loadState === "loading" ? (
        <p className="py-12 text-sm text-ink-soft" aria-live="polite">
          Reading this browser&apos;s archive…
        </p>
      ) : editions.length === 0 ? (
        <div className="paper-panel my-8 p-6 sm:p-10">
          <p className="news-caps text-[11px] text-accent-deep">Nothing settled yet</p>
          <h2 className="font-headline mt-2 text-3xl font-bold">
            No editions in this browser.
          </h2>
          <p className="mt-3 max-w-xl text-sm leading-relaxed text-ink-soft">
            The demo stores each edition and its settlement in this browser. Produce
            an edition, unlock it with {READER_PRICE_NEAR} testnet NEAR, and the first
            entries will appear here.
          </p>
          <div className="mt-5 flex flex-wrap gap-3">
            <Link
              href="/newsroom"
              className="news-caps bg-ink px-5 py-3 text-[11px] text-newsprint hover:bg-accent-deep"
            >
              Produce today&apos;s edition
            </Link>
            <Link
              href="/"
              className="news-caps border border-ink px-5 py-3 text-[11px] hover:border-accent hover:text-accent-deep"
            >
              Back to the front page
            </Link>
          </div>
        </div>
      ) : (
        <div className="space-y-8 py-8">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-xs text-ink-soft">
              {summary.totalEntries} ledger{" "}
              {summary.totalEntries === 1 ? "entry" : "entries"} across{" "}
              {summary.editions} {summary.editions === 1 ? "edition" : "editions"} in
              this browser.
            </p>
            <button
              type="button"
              onClick={() => setRefreshKey((value) => value + 1)}
              className="news-caps border border-ink px-3 py-2 text-[10px] hover:border-accent hover:text-accent-deep"
            >
              Refresh
            </button>
          </div>

          {editions.map((edition) => {
            const entries: LedgerEntry[] = [
              ...(edition.readerPayment ? [edition.readerPayment] : []),
              ...edition.payouts,
            ];
            return (
              <section
                key={edition.id}
                aria-labelledby={`ledger-${edition.id}`}
                className="border-t border-rule pt-5"
              >
                <div className="flex flex-wrap items-end justify-between gap-3">
                  <div>
                    <p className="news-caps text-[10px] text-accent-deep">
                      {shortDateLabel(edition.date)} · {edition.stories.length} stories
                    </p>
                    <h2
                      id={`ledger-${edition.id}`}
                      className="font-headline mt-1 text-2xl font-bold"
                    >
                      {edition.editorNote}
                    </h2>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <span
                      className={
                        edition.status === "paid"
                          ? "news-caps bg-success/10 px-2 py-1 text-[10px] text-success"
                          : "news-caps bg-gold/30 px-2 py-1 text-[10px] text-ink"
                      }
                    >
                      {edition.status === "paid" ? "Paid" : "Awaiting payment"}
                    </span>
                    <Link
                      href={`/edition/${edition.id}`}
                      className="news-caps border border-ink px-3 py-2 text-[10px] hover:border-accent hover:text-accent-deep"
                    >
                      Open edition
                    </Link>
                  </div>
                </div>

                {entries.length > 0 ? (
                  <div className="mt-4">
                    <LedgerTable entries={entries} />
                  </div>
                ) : (
                  <p className="paper-inset mt-4 p-4 text-sm text-ink-soft">
                    No entries for this edition yet. Open it and pay{" "}
                    {READER_PRICE_NEAR} testnet NEAR to unlock and settle.
                  </p>
                )}
              </section>
            );
          })}

          <div className="border-t border-rule pt-4">
            <p className="text-[11px] leading-relaxed text-ink-soft">
              Editions and settlements are kept in this browser&apos;s local storage.
              On-chain entries remain verifiable on the NEAR testnet explorer; local
              rows are explicitly marked.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
