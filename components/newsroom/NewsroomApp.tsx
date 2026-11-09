"use client";

import { useEffect } from "react";
import Link from "next/link";
import { AgentCard } from "@/components/newsroom/AgentCard";
import { BidBoard } from "@/components/newsroom/BidBoard";
import { FactCheckPanel } from "@/components/newsroom/FactCheckPanel";
import { FrontPagePreview } from "@/components/newsroom/FrontPagePreview";
import { RunProgress } from "@/components/newsroom/RunProgress";
import { WireFeed } from "@/components/newsroom/WireFeed";
import { EDITOR_BUDGET, READER_PRICE_NEAR, REVENUE_SHARES } from "@/lib/config";
import { sourcePack } from "@/lib/content/pack";
import { useNewsroomStore } from "@/lib/store/newsroom";
import {
  cn,
  formatNear,
  formatPercent,
} from "@/lib/utils";

export function NewsroomApp() {
  const agents = useNewsroomStore((state) => state.agents);
  const stages = useNewsroomStore((state) => state.stages);
  const wire = useNewsroomStore((state) => state.wire);
  const pitches = useNewsroomStore((state) => state.pitches);
  const assignments = useNewsroomStore((state) => state.assignments);
  const rejected = useNewsroomStore((state) => state.rejected);
  const totalCost = useNewsroomStore((state) => state.totalCost);
  const selectionNote = useNewsroomStore((state) => state.selectionNote);
  const drafts = useNewsroomStore((state) => state.drafts);
  const factChecks = useNewsroomStore((state) => state.factChecks);
  const revisedDrafts = useNewsroomStore((state) => state.revisedDrafts);
  const rechecks = useNewsroomStore((state) => state.rechecks);
  const editorNote = useNewsroomStore((state) => state.editorNote);
  const pullQuote = useNewsroomStore((state) => state.pullQuote);
  const edition = useNewsroomStore((state) => state.edition);
  const phase = useNewsroomStore((state) => state.phase);
  const runError = useNewsroomStore((state) => state.runError);
  const activeStage = useNewsroomStore((state) => state.activeStage);
  const balancesState = useNewsroomStore((state) => state.balancesState);
  const balancesError = useNewsroomStore((state) => state.balancesError);
  const nearConfig = useNewsroomStore((state) => state.nearConfig);
  const treasuryBalance = useNewsroomStore((state) => state.treasuryBalance);
  const storageError = useNewsroomStore((state) => state.storageError);

  const loadBalances = useNewsroomStore((state) => state.loadBalances);
  const runEdition = useNewsroomStore((state) => state.runEdition);
  const retry = useNewsroomStore((state) => state.retry);
  const reset = useNewsroomStore((state) => state.reset);

  useEffect(() => {
    void loadBalances();
  }, [loadBalances]);

  const activeStageLabel = stages.find((stage) => stage.id === activeStage)?.label;
  const committedByAgent = new Map<string, number>();
  for (const assignment of assignments) {
    committedByAgent.set(
      assignment.agentId,
      (committedByAgent.get(assignment.agentId) ?? 0) + assignment.fee,
    );
  }

  return (
    <div className="mx-auto max-w-[1500px] px-4 sm:px-6 lg:px-8">
      <section className="grid gap-6 border-b border-rule py-8 lg:grid-cols-12 lg:items-end">
        <div className="lg:col-span-8">
          <p className="news-caps text-[10px] text-accent-deep">
            The desk · edition workflow
          </p>
          <h2 className="font-headline mt-2 text-4xl leading-none font-bold tracking-tight sm:text-5xl">
            Produce today&apos;s edition
          </h2>
          <p className="mt-3 max-w-2xl text-sm leading-relaxed text-ink-soft">
            Three desks pitch. The editor commissions two against a{" "}
            {EDITOR_BUDGET.toFixed(2)} NEAR budget. The stories are written, checked,
            revised if needed, and laid out. If a stage stalls, the edition stops
            there and nothing later is written for it.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3 lg:col-span-4 lg:justify-end">
          {phase === "published" && edition ? (
            <>
              <Link
                href={`/edition/${edition.id}`}
                className="news-caps bg-ink px-5 py-3 text-[10px] text-newsprint transition-colors hover:bg-accent-deep"
              >
                Open the edition <span aria-hidden="true">→</span>
              </Link>
              <button
                type="button"
                onClick={reset}
                className="news-caps border border-ink px-4 py-3 text-[10px] hover:border-accent hover:text-accent-deep"
              >
                Start another
              </button>
            </>
          ) : phase === "error" ? (
            <>
              <button
                type="button"
                onClick={() => void retry()}
                className="news-caps bg-ink px-5 py-3 text-[10px] text-newsprint transition-colors hover:bg-accent-deep"
              >
                Retry this stage
              </button>
              <button
                type="button"
                onClick={reset}
                className="news-caps border border-ink px-4 py-3 text-[10px] hover:border-accent hover:text-accent-deep"
              >
                Start over
              </button>
            </>
          ) : (
            <button
              type="button"
              onClick={() => void runEdition()}
              disabled={phase === "running"}
              className={cn(
                "news-caps px-6 py-3 text-[11px] transition-colors",
                phase === "running"
                  ? "cursor-not-allowed bg-newsprint-deep text-ink-soft"
                  : "bg-ink text-newsprint hover:bg-accent-deep",
              )}
            >
              {phase === "running"
                ? activeStageLabel
                  ? `Producing · ${activeStageLabel}`
                  : "Producing…"
                : "Produce today's edition"}
            </button>
          )}
        </div>
      </section>

      <RunProgress
        stages={stages}
        phase={phase}
        activeStage={activeStage}
        runError={runError}
        onRetry={() => void retry()}
        onReset={reset}
      />

      <WireFeed events={wire} running={phase === "running"} />

      {balancesError ? (
        <div
          role="alert"
          className="mt-4 flex flex-wrap items-center justify-between gap-3 border-l-4 border-gold bg-gold/15 px-4 py-3"
        >
          <div>
            <p className="news-caps text-[9px] text-ink">Balances unavailable</p>
            <p className="mt-1 text-xs text-ink-soft">{balancesError}</p>
          </div>
          <button
            type="button"
            onClick={() => void loadBalances()}
            className="news-caps border border-ink px-3 py-2 text-[9px] hover:border-accent hover:text-accent-deep"
          >
            Refresh balances
          </button>
        </div>
      ) : null}

      {nearConfig && !nearConfig.treasuryConfigured ? (
        <details className="group mt-4 border-l-4 border-gold bg-gold/15 px-4 py-2">
          <summary className="news-caps cursor-pointer list-none text-[9px] text-ink">
            Settlement signer not configured · local accounting only{" "}
            <span aria-hidden="true" className="group-open:hidden">
              +
            </span>
            <span aria-hidden="true" className="hidden group-open:inline">
              −
            </span>
          </summary>
          <p className="mt-2 text-xs leading-relaxed text-ink-soft">
            Balances and reader-access verification can still be live, but without{" "}
            <span className="ledger-num">NEAR_TREASURY_PRIVATE_KEY</span> the revenue
            split is recorded as local accounting only. Local entries are never shown
            as on-chain transfers.
          </p>
        </details>
      ) : null}

      <div className="grid gap-8 py-8 lg:grid-cols-12 lg:gap-7">
        <div className="lg:col-span-6 xl:col-span-7">
          <FrontPagePreview
            edition={edition}
            phase={phase}
            editorNote={editorNote}
            pullQuote={pullQuote}
            storageError={storageError}
          />

          <section className="mt-6 border-y border-rule py-5">
            <p className="news-caps text-[10px] text-accent-deep">Reader revenue</p>
            <div className="mt-2 flex flex-wrap items-baseline gap-x-6 gap-y-3">
              <p className="font-headline flex items-baseline gap-2 text-5xl font-bold leading-none">
                {READER_PRICE_NEAR}
                <span className="text-base font-normal tracking-normal">NEAR</span>
              </p>
              <div className="min-w-0 flex-1 basis-64">
                <p className="text-sm leading-relaxed text-ink-soft">
                  A reader unlocks the edition with {READER_PRICE_NEAR} testnet NEAR.
                  The split is fixed in code, not chosen by a model:{" "}
                  {formatPercent(REVENUE_SHARES.reporters)} reporters ·{" "}
                  {formatPercent(REVENUE_SHARES.editor)} editor ·{" "}
                  {formatPercent(REVENUE_SHARES.factChecker)} fact-checker ·{" "}
                  {formatPercent(REVENUE_SHARES.treasury)} treasury.
                </p>
                <p className="mt-2 text-xs text-ink-soft">
                  Payment is verified on NEAR before unlock. The treasury signs the
                  split; local accounting is labelled, never presented as on-chain.
                </p>
              </div>
            </div>
          </section>

          <section className="mt-6 border-b border-rule pb-5">
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <p className="news-caps text-[10px] text-accent-deep">
                Curated source pack
              </p>
              <p className="ledger-num text-[10px] text-ink-soft">
                {sourcePack.topics.length} topics ·{" "}
                {sourcePack.topics.reduce(
                  (total, topic) => total + topic.facts.length,
                  0,
                )}{" "}
                facts
              </p>
            </div>
            <p className="mt-2 text-sm leading-relaxed text-ink-soft">
              The desks work only from this pack. Every pitch, draft claim, and
              fact-check decision is grounded here.
            </p>
            <ul className="mt-4 grid gap-x-5 gap-y-3 sm:grid-cols-2">
              {sourcePack.topics.map((topic) => {
                const sourceCount = new Set(
                  topic.facts.map((fact) => fact.sourceUrl),
                ).size;
                return (
                  <li key={topic.id} className="border-t border-rule-soft pt-2">
                    <p className="news-caps text-[8px] text-accent-deep">
                      {topic.beat} desk
                    </p>
                    <p className="font-headline mt-1 text-base leading-snug font-bold">
                      {topic.title}
                    </p>
                    <p className="mt-1 text-[10px] text-ink-soft">
                      {topic.facts.length} facts · {sourceCount} source
                      {sourceCount === 1 ? "" : "s"}
                    </p>
                  </li>
                );
              })}
            </ul>
          </section>
        </div>

        <aside className="lg:col-span-6 xl:col-span-5" aria-label="The desk">
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <h3 className="font-headline text-2xl font-bold">The desk</h3>
            <p className="ledger-num text-[10px] text-ink-soft">
              Budget {formatNear(EDITOR_BUDGET, 2)} NEAR · commissioned{" "}
              {formatNear(totalCost, 4)}
            </p>
          </div>
          <p className="mt-1 text-[11px] text-ink-soft">
            NEAR testnet · balances read from chain
          </p>
          {balancesState === "ready" && agents.every((agent) => agent.balance === null) ? (
            <p className="mt-2 border-l-2 border-gold pl-2 text-[10px] leading-relaxed text-ink-soft">
              No configured testnet accounts were found. Create and fund them before a
              real reader payment; see the testnet setup in the README.
            </p>
          ) : null}
          <div className="mt-3 grid gap-2 sm:grid-cols-2">
            {agents.map((agent) => (
              <AgentCard
                key={agent.id}
                agent={agent}
                balancesState={balancesState}
                committedFee={committedByAgent.get(agent.id)}
              />
            ))}
            <article className="paper-panel flex flex-col justify-between p-3">
              <div>
                <p className="news-caps text-[8px] text-ink-soft">Treasury</p>
                <p className="font-headline mt-1 text-sm font-bold">Reader payments</p>
                <p className="mt-1 text-[10px] leading-snug text-ink-soft">
                  Receives the 1 NEAR unlock and signs the split. Server-side key
                  only.
                </p>
              </div>
              <p className="ledger-num mt-3 text-[11px]">
                {treasuryBalance === null
                  ? balancesState === "loading" || balancesState === "idle"
                    ? "reading…"
                    : "balance unavailable"
                  : `${formatNear(treasuryBalance)} NEAR`}
              </p>
            </article>
          </div>

          <BidBoard
            pitches={pitches}
            rejected={rejected}
            assignments={assignments}
            totalCost={totalCost}
            selectionNote={selectionNote}
          />

          <FactCheckPanel
            assignments={assignments}
            pitches={pitches}
            drafts={drafts}
            factChecks={factChecks}
            revisedDrafts={revisedDrafts}
            rechecks={rechecks}
          />

          <p className="mt-6 border-t border-rule pt-3 text-[10px] leading-relaxed text-ink-soft">
            The desks work only from the curated source pack; they cannot browse the
            web. Every number, date, quote, and named entity in a story must trace to
            a source id.
          </p>
        </aside>
      </div>
    </div>
  );
}
