import type { Metadata } from "next";
import Link from "next/link";
import { StoryArticle } from "@/components/edition/StoryArticle";
import { READER_PRICE_NEAR, REVENUE_SHARES, SITE } from "@/lib/config";
import { sampleEdition } from "@/lib/content/sample-edition";
import { editionDateLabel, formatNear, shortDateLabel } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Sample edition",
  description:
    "Read a full sample edition of The Daily Swarm without a wallet: sourced stories, fact-check reports, and the settlement the live edition records.",
};

const SPLIT_LABEL = [
  Math.round(REVENUE_SHARES.reporters * 100),
  Math.round(REVENUE_SHARES.editor * 100),
  Math.round(REVENUE_SHARES.factChecker * 100),
  Math.round(REVENUE_SHARES.treasury * 100),
].join(" / ");

export default function SampleEditionPage() {
  const edition = sampleEdition;
  const orderedStories = edition.frontPageOrder
    .map((storyId) => edition.stories.find((story) => story.id === storyId))
    .filter((story): story is NonNullable<typeof story> => Boolean(story));
  const stories =
    orderedStories.length === edition.stories.length
      ? orderedStories
      : edition.stories;
  const totalWords = stories.reduce(
    (total, story) => total + (story.revisedDraft ?? story.draft).wordCount,
    0,
  );
  const sourceIds = new Set(
    stories.flatMap((story) =>
      (story.revisedDraft ?? story.draft).claims.map((claim) => claim.sourceId),
    ),
  );
  const assignmentFees = stories.reduce(
    (total, story) => total + story.assignment.fee,
    0,
  );

  return (
    <div className="mx-auto max-w-[1500px] px-4 sm:px-6 lg:px-8">
      <aside className="mt-4 border-l-4 border-gold bg-gold/15 px-4 py-3">
        <p className="news-caps text-[9px] text-accent-deep">
          Sample edition · read-only
        </p>
        <p className="mt-1 max-w-4xl text-xs leading-relaxed">
          This is an illustrative edition assembled from the same curated source
          pack the desks use. It needs no wallet and no payment. It is not a live
          edition and has no settlement of its own; the archived real testnet
          settlement is in the{" "}
          <a
            href={`${SITE.repoUrl}#testnet-transactions`}
            target="_blank"
            rel="noreferrer"
            className="font-semibold underline decoration-rule hover:decoration-accent"
          >
            repository README
          </a>
          .
        </p>
      </aside>

      <header className="border-b-2 border-ink py-7">
        <div className="flex flex-wrap items-center justify-between gap-x-6 gap-y-2 border-b border-rule-soft pb-3">
          <p className="news-caps text-[10px] text-ink-soft">
            {editionDateLabel(edition.date)}
          </p>
          <p className="news-caps text-[9px] text-ink-soft">{SITE.demoLabel}</p>
          <p
            className="news-caps bg-gold/30 px-2 py-1 text-[9px] text-ink"
            role="status"
          >
            Sample · unlocked for review
          </p>
        </div>

        <div className="mt-5 grid gap-5 lg:grid-cols-12 lg:items-end">
          <div className="lg:col-span-8">
            <p className="news-caps text-[10px] text-accent-deep">
              Sample · curated sources
            </p>
            <h1 className="font-headline mt-2 text-4xl leading-[0.98] font-bold tracking-tight sm:text-5xl lg:text-6xl">
              The {shortDateLabel(edition.date)} edition.
            </h1>
            <p className="mt-3 max-w-2xl text-sm leading-relaxed text-ink-soft">
              Three desks pitched. The editor commissioned two, with{" "}
              {formatNear(assignmentFees)} NEAR in commissions, and set the front
              page. Every claim below was checked against the curated source pack.
              This sample is fully unlocked so a reviewer can see the output
              without a testnet wallet.
            </p>
          </div>
          <dl className="grid grid-cols-2 gap-x-4 gap-y-2 border-t border-rule pt-4 sm:grid-cols-4 lg:col-span-4 lg:border-l lg:border-t-0 lg:pl-5">
            {[
              ["Stories", String(stories.length)],
              ["Words", String(totalWords)],
              ["Sources", String(sourceIds.size)],
              ["Fees", `${formatNear(assignmentFees)} NEAR`],
            ].map(([label, value]) => (
              <div key={label}>
                <dt className="news-caps text-[8px] text-ink-soft">{label}</dt>
                <dd className="ledger-num mt-1 text-sm">{value}</dd>
              </div>
            ))}
          </dl>
        </div>
      </header>

      <section
        aria-labelledby="sample-editors-note-heading"
        className="grid gap-6 border-b border-rule py-7 lg:grid-cols-12"
      >
        <div className="lg:col-span-8">
          <p className="news-caps text-[10px] text-accent-deep">
            Editor&apos;s note
          </p>
          <h2 id="sample-editors-note-heading" className="sr-only">
            Editor&apos;s note
          </h2>
          <p className="font-headline mt-2 max-w-3xl text-xl leading-snug sm:text-2xl">
            {edition.editorNote}
          </p>
          {edition.pullQuote ? (
            <blockquote className="mt-4 border-l-2 border-accent pl-3">
              <p className="font-headline text-lg leading-snug font-bold italic sm:text-xl">
                “{edition.pullQuote}”
              </p>
            </blockquote>
          ) : null}
        </div>
        <div className="lg:col-span-4 lg:border-l lg:border-rule lg:pl-5">
          <p className="news-caps text-[9px] text-ink-soft">Front page order</p>
          <ol className="mt-2 space-y-2">
            {stories.map((story, index) => (
              <li key={story.id} className="flex gap-3 text-xs">
                <span className="ledger-num text-accent-deep">
                  {String(index + 1).padStart(2, "0")}
                </span>
                <span className="font-semibold leading-snug">
                  {(story.revisedDraft ?? story.draft).headline}
                </span>
              </li>
            ))}
          </ol>
          <p className="mt-3 text-[10px] text-ink-soft">
            Reported, written, checked, and laid out by autonomous desks. Curated
            sources only.
          </p>
        </div>
      </section>

      <div className="grid gap-8 py-8 lg:grid-cols-12 lg:gap-7">
        <div className="min-w-0 lg:col-span-8">
          <div className="space-y-10">
            {stories.map((story, index) => (
              <StoryArticle
                key={story.id}
                story={story}
                unlocked
                order={index + 1}
              />
            ))}
          </div>

          <section
            aria-labelledby="sample-settlement-heading"
            className="mt-10 border-t-2 border-ink pt-6"
          >
            <p className="news-caps text-[10px] text-accent-deep">
              What the live edition adds
            </p>
            <h2
              id="sample-settlement-heading"
              className="font-headline mt-1 text-2xl font-bold"
            >
              The receipt and the settlement
            </h2>
            <div className="mt-4 grid gap-3 sm:grid-cols-3">
              {[
                {
                  label: "Reader access",
                  value: `${READER_PRICE_NEAR} NEAR`,
                  body: "One testnet payment unlocks both stories, every fact-check, and the ledger.",
                },
                {
                  label: "Deterministic split",
                  value: SPLIT_LABEL,
                  body: "Reporters, editor, fact-checker, treasury — computed in 1e-4 NEAR units.",
                },
                {
                  label: "Public evidence",
                  value: "On-chain or local",
                  body: "Confirmed entries link to the testnet explorer; local accounting is labelled, never presented as on-chain.",
                },
              ].map((card) => (
                <div key={card.label} className="paper-inset p-4">
                  <p className="news-caps text-[8px] text-ink-soft">
                    {card.label}
                  </p>
                  <p className="ledger-num mt-2 text-lg">{card.value}</p>
                  <p className="mt-2 text-[10px] leading-relaxed text-ink-soft">
                    {card.body}
                  </p>
                </div>
              ))}
            </div>
            <p className="mt-4 text-xs leading-relaxed text-ink-soft">
              The public deployment verifies reader payments against the NEAR
              testnet RPC but does not hold the treasury signing key, so its
              payout rows are labelled{" "}
              <span className="ledger-num text-ink">LOCAL · NOT ON-CHAIN</span>.
              The full on-chain split — a reader payment plus all four transfers —
              was exercised on a local instance; the explorer links are in the{" "}
              <a
                href={`${SITE.repoUrl}#testnet-transactions`}
                target="_blank"
                rel="noreferrer"
                className="font-semibold text-accent-deep underline decoration-rule hover:decoration-accent"
              >
                repository README
              </a>
              .
            </p>
          </section>
        </div>

        <aside className="min-w-0 lg:col-span-4">
          <div className="space-y-4 lg:sticky lg:top-4">
            <div className="paper-panel p-5">
              <p className="news-caps text-[9px] text-accent-deep">
                Read-only sample
              </p>
              <h2 className="font-headline mt-1 text-2xl font-bold">
                No wallet required
              </h2>
              <p className="mt-2 text-xs leading-relaxed text-ink-soft">
                Full stories, every fact-check, and every source are visible on
                this page. In a live run, the reader payment unlocks the same
                content and writes the settlement ledger.
              </p>
              <div className="mt-4 flex flex-col gap-2">
                <Link
                  href="/newsroom"
                  className="news-caps bg-ink px-4 py-2.5 text-center text-[10px] text-newsprint transition-colors hover:bg-accent-deep"
                >
                  Produce a live edition →
                </Link>
                <Link
                  href="/ledger"
                  className="news-caps border border-ink px-4 py-2.5 text-center text-[10px] transition-colors hover:border-accent hover:text-accent-deep"
                >
                  View the public ledger
                </Link>
              </div>
            </div>

            <div className="paper-inset p-4">
              <p className="news-caps text-[9px] text-ink-soft">
                What is real on this page
              </p>
              <ul className="mt-2 space-y-1.5 text-xs leading-relaxed text-ink-soft">
                <li>Every claim cites a fact in the curated source pack.</li>
                <li>Every source link resolves to the original document.</li>
                <li>
                  Fact-check verdicts use the same schema as the live standards
                  desk.
                </li>
                <li>
                  The live pipeline, tests, and on-chain evidence are in the
                  public repository.
                </li>
              </ul>
            </div>

            <div className="paper-inset p-4">
              <p className="news-caps text-[9px] text-ink-soft">
                One line to remember
              </p>
              <p className="font-headline mt-2 text-lg leading-snug">
                The edition is the output. The settlement is the proof.
              </p>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
