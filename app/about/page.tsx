import type { Metadata } from "next";
import Link from "next/link";
import { SITE } from "@/lib/config";

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
        <p className="news-caps text-[10px] text-accent-deep">
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

      <section className="grid gap-10 border-b border-rule py-10 lg:grid-cols-12 lg:gap-8 lg:py-14">
        <div className="lg:col-span-5">
          <p className="news-caps text-[10px] text-accent-deep">The problem</p>
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
        <p className="news-caps text-[10px] text-accent-deep">Who it is for</p>
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
        <div className="lg:col-span-6">
          <p className="news-caps text-[10px] text-accent-deep">In this build</p>
          <h2 className="font-headline mt-2 text-3xl font-bold">
            What is real
          </h2>
          <ul className="mt-5 space-y-3">
            {REAL.map((item) => (
              <li key={item} className="flex gap-3 text-sm leading-relaxed">
                <span className="news-caps shrink-0 text-[9px] text-success">
                  ✓
                </span>
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>
        <div className="lg:col-span-6 lg:border-l lg:border-rule lg:pl-6">
          <p className="news-caps text-[10px] text-accent-deep">Still demo</p>
          <h2 className="font-headline mt-2 text-3xl font-bold">
            What is next
          </h2>
          <ul className="mt-5 space-y-3">
            {DEMO.map((item) => (
              <li key={item} className="flex gap-3 text-sm leading-relaxed">
                <span className="news-caps shrink-0 text-[9px] text-ink-soft">
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
        <p className="news-caps text-[10px] text-accent-deep">The path</p>
        <h2 className="font-headline mt-2 text-3xl font-bold sm:text-4xl">
          From auditable demo to product.
        </h2>
        <div className="mt-8 grid gap-px border border-rule bg-rule md:grid-cols-3">
          {ROADMAP.map((item) => (
            <div key={item.phase} className="bg-newsprint p-5">
              <div className="flex items-baseline justify-between gap-2">
                <p className="ledger-num text-xs text-accent-deep">
                  {item.phase}
                </p>
                <p className="news-caps text-[8px] text-ink-soft">
                  {item.status}
                </p>
              </div>
              <h3 className="font-headline mt-2 text-xl font-bold">
                {item.title}
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-ink-soft">
                {item.body}
              </p>
            </div>
          ))}
        </div>
      </section>

      <section className="grid gap-10 border-b border-rule py-10 lg:grid-cols-12 lg:gap-8 lg:py-14">
        <div className="lg:col-span-5">
          <p className="news-caps text-[10px] text-accent-deep">Business model</p>
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
          <p className="news-caps text-[10px] text-accent-deep">
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
        <p className="news-caps text-[10px] text-accent-deep">
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
