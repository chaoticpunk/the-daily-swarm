import type { Metadata } from "next";
import Link from "next/link";
import { SITE } from "@/lib/config";
import { BEAT_STYLE, BEATS } from "@/lib/ui/beat-style";
import { cn } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Product",
  description:
    "The Daily Swarm is an auditable AI newsroom for a niche beat: source-grounded reporting, independent fact-checks, reader payments, and a public settlement ledger.",
};

const USERS = [
  {
    title: "Crypto-native readers",
    body: "A daily, sourced brief instead of an opaque feed. Every claim maps to a source, and the edition shows what the standards desk flagged.",
  },
  {
    title: "Protocols and DAOs",
    body: "Commissioned coverage with a public audit trail: what was pitched, what was commissioned, what was checked, and what was paid.",
  },
  {
    title: "Builders and researchers",
    body: "A working reference implementation of an agent economy: roles, budgets, a hard fact-check gate, and deterministic settlement.",
  },
];

const REAL = [
  "Full pipeline: pitch → commission → write → check → revise → re-check → layout.",
  "Every factual claim must cite a source ID; unsupported claims force a revision.",
  "Five agents with NEAR testnet sub-accounts and a public ledger.",
  "48 tests, CI, and a production build that runs without secrets.",
  "A no-wallet sample edition and a real testnet settlement record.",
];

const DEMO = [
  "The source pack is curated: six topics, 30 facts. The agents do not browse the web.",
  "The public instance does not hold the treasury signing key; payouts are local accounting.",
  "Editions live in the browser, so a shared edition link does not travel.",
  "Testnet only; no accounts, database, or rate limiting.",
];

const ROADMAP = [
  {
    phase: "Phase 1",
    title: "Auditable demo",
    status: "Now",
    body: "Prove the full loop and make the audit trail visible. The curated pack keeps the demo stable and every claim verifiable.",
  },
  {
    phase: "Phase 2",
    title: "Live niche newsroom",
    status: "Next",
    body: "A source-pack builder for one beat: ingest primary sources, snapshot and hash them, extract claim/span evidence. Add a human review console, a database, and shareable editions.",
  },
  {
    phase: "Phase 3",
    title: "Product",
    status: "Then",
    body: "Reader subscriptions or micropayments, a B2B audit/verification API, licensed and sponsored beats, mainnet settlement, and agent reputation.",
  },
];

const MODEL = [
  {
    title: "Reader revenue",
    body: "A subscription or micropayment for the daily edition. The public ledger is part of what the reader is paying for.",
  },
  {
    title: "Audit API",
    body: "Publishers and agent teams can buy the same source-grounded verification layer: claim → source span → verdict.",
  },
  {
    title: "Sponsored beats",
    body: "Protocols can commission a beat with disclosure. The ledger shows exactly what was paid and to which agent.",
  },
];

const PIPELINE = [
  {
    title: "Pitch",
    body: "Three desks file a headline, a fee, a word count, and claims tied to the source pack.",
    dots: BEATS.map((beat) => BEAT_STYLE[beat].dot),
  },
  {
    title: "Commission",
    body: "The editor commissions two under a fixed budget and records why the third was passed.",
    dots: ["bg-accent"],
  },
  {
    title: "Check",
    body: "The standards desk checks every claim. An unsupported claim forces one revision and a re-check.",
    dots: ["bg-success"],
  },
  {
    title: "Settle",
    body: "A reader pays 1 testnet NEAR. The deterministic split settles to agent sub-accounts and lands in the public ledger.",
    dots: ["bg-gold ring-1 ring-ink/20"],
  },
];

const RISKS = [
  {
    title: "Copyright and licensing",
    body: "Use primary sources and licensed feeds. Do not scrape or rewrite paywalled content.",
  },
  {
    title: "Defamation and privacy",
    body: "Human review, corrections, and legal review for high-risk beats. Nothing publishes automatically in Phase 2.",
  },
  {
    title: "Hallucination",
    body: "Source IDs, span-level evidence, schema validation, and re-checks. An unsupported claim is a visible failure, not a silent rewrite.",
  },
  {
    title: "Cost and trust",
    body: "Retrieval, caching, and cheaper models; label AI involvement, show sources, and publish corrections.",
  },
];

export default function ProductPage() {
  return (
    <div className="mx-auto max-w-[1500px] px-4 sm:px-6 lg:px-8">
      <section className="border-b-2 border-ink py-10 lg:py-16">
        <p className="news-caps text-[11px] text-accent-deep">
          Product brief · NEAR Hackathon 2026 · AI Swarms
        </p>
        <h1 className="font-headline mt-5 max-w-5xl text-[2.6rem] leading-[1.02] font-bold tracking-[-0.025em] sm:text-5xl lg:text-[4rem]">
          An auditable newsroom,
          <span className="block text-accent-deep">not a content farm.</span>
        </h1>
        <p className="mt-6 max-w-3xl text-base leading-relaxed text-ink-soft sm:text-lg">
          The Daily Swarm is an AI newsroom for a niche beat. Agents pitch stories,
          an editor commissions two under a budget, and a standards desk checks every
          claim against a source pack. Readers pay once; the revenue split settles to
          agent sub-accounts on NEAR.
        </p>
        <div className="mt-8 flex flex-wrap items-center gap-3">
          <Link
            href="/sample"
            className="news-caps inline-flex items-center gap-3 bg-ink px-5 py-3 text-[11px] text-newsprint transition-colors hover:bg-accent-deep"
          >
            Read the sample edition <span aria-hidden="true">→</span>
          </Link>
          <Link
            href="/newsroom"
            className="news-caps inline-flex items-center gap-3 border border-ink px-5 py-3 text-[11px] text-ink transition-colors hover:border-accent hover:text-accent-deep"
          >
            Produce a live edition
          </Link>
          <a
            href={`${SITE.repoUrl}/blob/main/docs/PRODUCT.md`}
            target="_blank"
            rel="noreferrer"
            className="news-caps inline-flex items-center gap-3 border border-ink px-5 py-3 text-[11px] text-ink transition-colors hover:border-accent hover:text-accent-deep"
          >
            Full product brief
          </a>
        </div>
      </section>

      <section className="border-b border-rule py-10 lg:py-14">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="news-caps text-[11px] text-accent-deep">
              One edition, four moves
            </p>
            <h2 className="font-headline mt-2 text-3xl font-bold sm:text-4xl">
              From pitch to proof.
            </h2>
          </div>
          <p className="max-w-md text-sm leading-relaxed text-ink-soft">
            The agents do the work; the colors show who did it. Beat colors mark
            the three desks, red is the editor, green is the standards desk, and
            gold is the settlement.
          </p>
        </div>
        <ol className="mt-8 grid gap-px border border-rule bg-rule md:grid-cols-4">
          {PIPELINE.map((step, index) => (
            <li key={step.title} className="bg-newsprint p-5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  {step.dots.map((dot) => (
                    <span
                      key={dot}
                      aria-hidden="true"
                      className={cn("inline-block h-2.5 w-2.5 rounded-full", dot)}
                    />
                  ))}
                </div>
                <span className="ledger-num text-[11px] text-ink-soft">
                  {String(index + 1).padStart(2, "0")}
                </span>
              </div>
              <h3 className="font-headline mt-3 text-xl font-bold">
                {step.title}
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-ink-soft">
                {step.body}
              </p>
            </li>
          ))}
        </ol>
        <div className="mt-3 flex flex-wrap items-center gap-4 text-[11px] text-ink-soft">
          <span className="news-caps text-[11px]">Beat colors</span>
          {BEATS.map((beat) => (
            <span key={beat} className="inline-flex items-center gap-1.5">
              <span
                aria-hidden="true"
                className={cn(
                  "inline-block h-2 w-2 rounded-full",
                  BEAT_STYLE[beat].dot,
                )}
              />
              {BEAT_STYLE[beat].label}
            </span>
          ))}
        </div>
      </section>

      <section className="grid gap-10 border-b border-rule py-10 lg:grid-cols-12 lg:gap-8 lg:py-14">
        <div className="lg:col-span-5">
          <p className="news-caps text-[11px] text-accent-deep">The problem</p>
          <h2 className="font-headline mt-2 text-3xl font-bold sm:text-4xl">
            AI news has a trust problem.
          </h2>
        </div>
        <div className="grid gap-6 sm:grid-cols-2 lg:col-span-7">
          <div className="border-t-2 border-ink pt-4">
            <h3 className="text-sm font-bold">Readers cannot see the work</h3>
            <p className="mt-2 text-sm leading-relaxed text-ink-soft">
              Which source supports which sentence? What was checked? What was
              flagged and rewritten? Most AI news products hide all of it.
            </p>
          </div>
          <div className="border-t-2 border-ink pt-4">
            <h3 className="text-sm font-bold">Agents cannot show the books</h3>
            <p className="mt-2 text-sm leading-relaxed text-ink-soft">
              Agent economies need a record of work, verification, and payment.
              A receipt and a public ledger are the missing trust layer.
            </p>
          </div>
          <div className="border-t-2 border-ink pt-4 sm:col-span-2">
            <h3 className="text-sm font-bold">The product</h3>
            <p className="mt-2 text-sm leading-relaxed text-ink-soft">
              A daily edition with claim-to-source mapping, independent fact-check
              reports, a reader receipt, and a deterministic settlement ledger. The
              edition is the output; the settlement is the proof.
            </p>
          </div>
        </div>
      </section>

      <section className="border-b border-rule py-10 lg:py-14">
        <p className="news-caps text-[11px] text-accent-deep">Who it is for</p>
        <h2 className="font-headline mt-2 text-3xl font-bold sm:text-4xl">
          Three audiences, one audit trail.
        </h2>
        <div className="mt-8 grid gap-px border border-rule bg-rule md:grid-cols-3">
          {USERS.map((item) => (
            <div key={item.title} className="bg-newsprint p-5">
              <h3 className="text-sm font-bold">{item.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-ink-soft">
                {item.body}
              </p>
            </div>
          ))}
        </div>
      </section>

      <section className="grid gap-10 border-b border-rule py-10 lg:grid-cols-12 lg:gap-8 lg:py-14">
        <div className="grid grid-cols-3 gap-px border border-rule bg-rule lg:col-span-12">
          {[
            ["5", "agents"],
            ["48", "tests"],
            ["1", "testnet NEAR"],
          ].map(([value, label]) => (
            <div key={label} className="bg-newsprint p-4 sm:p-5">
              <p className="ledger-num text-3xl text-accent-deep sm:text-4xl">
                {value}
              </p>
              <p className="news-caps mt-1 text-[10px] text-ink-soft">
                {label}
              </p>
            </div>
          ))}
        </div>
        <div className="lg:col-span-6">
          <p className="news-caps text-[11px] text-accent-deep">In this build</p>
          <h2 className="font-headline mt-2 text-3xl font-bold">
            What is real
          </h2>
          <ul className="mt-5 space-y-3">
            {REAL.map((item) => (
              <li key={item} className="flex gap-3 text-sm leading-relaxed">
                <span className="news-caps shrink-0 text-[10px] text-success">
                  ✓
                </span>
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>
        <div className="lg:col-span-6 lg:border-l lg:border-rule lg:pl-6">
          <p className="news-caps text-[11px] text-accent-deep">Still demo</p>
          <h2 className="font-headline mt-2 text-3xl font-bold">
            What is next
          </h2>
          <ul className="mt-5 space-y-3">
            {DEMO.map((item) => (
              <li key={item} className="flex gap-3 text-sm leading-relaxed">
                <span className="news-caps shrink-0 text-[10px] text-ink-soft">
                  —
                </span>
                <span>{item}</span>
              </li>
            ))}
          </ul>
          <p className="mt-5 border-l-2 border-gold pl-3 text-xs leading-relaxed text-ink-soft">
            The demo is deliberately honest about the seam: curated sources now, a
            live source-pack builder and a human review console next.
          </p>
        </div>
      </section>

      <section className="border-b border-rule py-10 lg:py-14">
        <p className="news-caps text-[11px] text-accent-deep">The path</p>
        <h2 className="font-headline mt-2 text-3xl font-bold sm:text-4xl">
          From auditable demo to product.
        </h2>
        <ol className="relative mt-10 grid gap-8 md:grid-cols-3 md:gap-6">
          <div
            aria-hidden="true"
            className="absolute top-5 right-0 left-0 hidden h-px bg-rule md:block"
          />
          {ROADMAP.map((item, index) => (
            <li
              key={item.phase}
              className="relative border-l-2 border-ink pl-5 md:border-l-0 md:pl-0"
            >
              <div className="flex items-center gap-3">
                <span className="relative z-10 flex h-10 w-10 shrink-0 items-center justify-center rounded-full border-2 border-ink bg-newsprint font-mono text-sm">
                  {String(index + 1).padStart(2, "0")}
                </span>
                <p className="news-caps text-[10px] text-ink-soft">
                  {item.phase} · {item.status}
                </p>
              </div>
              <h3 className="font-headline mt-4 text-2xl font-bold">
                {item.title}
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-ink-soft">
                {item.body}
              </p>
            </li>
          ))}
        </ol>
      </section>

      <section className="grid gap-10 border-b border-rule py-10 lg:grid-cols-12 lg:gap-8 lg:py-14">
        <div className="lg:col-span-5">
          <p className="news-caps text-[11px] text-accent-deep">Business model</p>
          <h2 className="font-headline mt-2 text-3xl font-bold sm:text-4xl">
            The ledger is the trust layer.
          </h2>
          <p className="mt-3 text-sm leading-relaxed text-ink-soft">
            The news product is the content; the audit trail is why someone pays for
            it. Reader revenue, a B2B verification API, and disclosed sponsored beats
            can share the same pipeline.
          </p>
        </div>
        <div className="grid gap-6 sm:grid-cols-3 lg:col-span-7">
          {MODEL.map((item) => (
            <div key={item.title} className="border-t-2 border-ink pt-4">
              <h3 className="text-sm font-bold">{item.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-ink-soft">
                {item.body}
              </p>
            </div>
          ))}
        </div>
      </section>

      <section className="grid gap-10 border-b border-rule py-10 lg:grid-cols-12 lg:gap-8 lg:py-14">
        <div className="lg:col-span-5">
          <p className="news-caps text-[11px] text-accent-deep">
            Moat and risks
          </p>
          <h2 className="font-headline mt-2 text-3xl font-bold sm:text-4xl">
            Built to be checked.
          </h2>
          <p className="mt-3 text-sm leading-relaxed text-ink-soft">
            Source-grounded verification with a hard gate, a deterministic split, and
            an open reference implementation. The risks are the ones a real newsroom
            has; the mitigation is the same: sources, review, and corrections.
          </p>
        </div>
        <div className="grid gap-5 sm:grid-cols-2 lg:col-span-7">
          {RISKS.map((item) => (
            <div key={item.title} className="paper-inset p-4">
              <h3 className="text-sm font-bold">{item.title}</h3>
              <p className="mt-1.5 text-xs leading-relaxed text-ink-soft">
                {item.body}
              </p>
            </div>
          ))}
        </div>
      </section>

      <section className="mb-8 border-y-2 border-ink bg-gold/25 px-5 py-8 text-center sm:px-8">
        <p className="news-caps text-[11px] text-accent-deep">
          See the product
        </p>
        <p className="font-headline mx-auto mt-3 max-w-3xl text-2xl leading-snug font-bold sm:text-3xl">
          Read the sample edition, then produce a live one.
        </p>
        <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
          <Link
            href="/sample"
            className="news-caps inline-flex items-center gap-3 bg-ink px-6 py-3 text-[11px] text-newsprint transition-colors hover:bg-accent-deep"
          >
            Sample edition <span aria-hidden="true">→</span>
          </Link>
          <Link
            href="/newsroom"
            className="news-caps inline-flex items-center gap-3 border border-ink px-6 py-3 text-[11px] text-ink transition-colors hover:border-accent hover:text-accent-deep"
          >
            Newsroom
          </Link>
          <a
            href={SITE.repoUrl}
            target="_blank"
            rel="noreferrer"
            className="news-caps inline-flex items-center gap-3 border border-ink px-6 py-3 text-[11px] text-ink transition-colors hover:border-accent hover:text-accent-deep"
          >
            Repository
          </a>
        </div>
      </section>
    </div>
  );
}
