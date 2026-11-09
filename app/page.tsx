import Link from "next/link";
import { AGENT_CONFIG, REVENUE_SHARES, SITE, getAgentConfig } from "@/lib/config";
import { sourcePack } from "@/lib/content/pack";
import { sampleEdition } from "@/lib/content/sample-edition";
import { BEAT_STYLE } from "@/lib/ui/beat-style";
import { cn, formatNear, formatPercent, shortAccount } from "@/lib/utils";

const STEPS = [
  {
    number: "01",
    title: "The desks pitch",
    body: "Three reporters read the same curated source pack, then file a pitch with a headline, an angle, a claim set, a fee, and a word count.",
  },
  {
    number: "02",
    title: "The editor commissions",
    body: "Two pitches are chosen against a fixed editorial budget. The third is passed with a written reason and stays visible on the board.",
  },
  {
    number: "03",
    title: "The stories are filed",
    body: "Each commissioned desk writes to its assigned length. Every factual claim must cite a source ID from the pack.",
  },
  {
    number: "04",
    title: "The standards desk checks",
    body: "Every claim is checked against the pack. Unsupported claims send the story back for one revision, followed by a re-check.",
  },
  {
    number: "05",
    title: "The edition goes to press",
    body: "The editor writes the note and sets the front page. Readers unlock the edition once; the revenue split settles on NEAR testnet.",
  },
];

const AGENT_ORDER = [
  "editor",
  "reporter-near",
  "reporter-ai",
  "reporter-markets",
  "fact-checker",
];

export default function HomePage() {
  const agents = AGENT_ORDER.map((id) =>
    AGENT_CONFIG.find((agent) => agent.id === id),
  ).filter((agent): agent is (typeof AGENT_CONFIG)[number] => Boolean(agent));

  const facts = sourcePack.topics.reduce(
    (total, topic) => total + topic.facts.length,
    0,
  );

  const sampleLead =
    sampleEdition.stories.find(
      (story) => story.id === sampleEdition.frontPageOrder[0],
    ) ?? sampleEdition.stories[0];
  const sampleLeadDraft = sampleLead.revisedDraft ?? sampleLead.draft;
  const sampleLeadAgent = getAgentConfig(sampleLead.assignment.agentId);
  const sampleLeadBeat = BEAT_STYLE[sampleLead.assignment.beat];
  const sampleFees = sampleEdition.stories.reduce(
    (total, story) => total + story.assignment.fee,
    0,
  );
  const sampleChecks = sampleEdition.stories.reduce(
    (total, story) =>
      total + (story.recheck ?? story.factCheck).checks.length,
    0,
  );
  const sampleSourceCount = new Set(
    sampleEdition.stories.flatMap((story) =>
      (story.revisedDraft ?? story.draft).claims.map((claim) => claim.sourceId),
    ),
  ).size;
  const sampleDispatches = [
    {
      text: `${sampleLeadAgent?.desk ?? "The desk"} files a pitch`,
      detail: `${formatNear(sampleLead.pitch.requestedFee)} NEAR · ${sampleLead.pitch.wordCount} words`,
      dot: sampleLeadBeat.dot,
    },
    {
      text: "The editor commissions two",
      detail: `${formatNear(sampleFees)} / 0.80 NEAR`,
      dot: "bg-accent",
    },
    {
      text: "The standards desk clears every claim",
      detail: `${sampleChecks} checks · 0 flagged`,
      dot: "bg-success",
    },
  ];

  return (
    <div className="mx-auto max-w-[1500px] px-4 sm:px-6 lg:px-8">
      <section className="grid gap-10 border-b-2 border-ink py-10 lg:grid-cols-12 lg:gap-10 lg:py-16">
        <div className="lg:col-span-7">
          <p className="news-caps text-[11px] text-accent-deep">
            The daily edition · NEAR testnet
          </p>
          <h2 className="font-headline mt-5 max-w-4xl text-[2.5rem] leading-[1.02] font-bold tracking-[-0.025em] text-balance sm:text-5xl lg:text-[4.2rem]">
            The edition is the output.
            <span className="block text-accent-deep">The ledger is the proof.</span>
          </h2>
          <p className="mt-6 max-w-2xl text-base leading-relaxed text-ink-soft sm:text-lg">
            Three desks pitch stories. The editor commissions two. A standards desk
            checks every claim. Readers unlock the edition once, and the revenue split
            settles on NEAR testnet — with every pitch, edit, check, and payment visible.
          </p>
          <div className="mt-8 flex flex-wrap items-center gap-3">
            <Link
              href="/newsroom"
              className="news-caps inline-flex items-center gap-3 bg-ink px-5 py-3 text-[11px] text-newsprint transition-colors hover:bg-accent-deep"
            >
              Produce today&apos;s edition <span aria-hidden="true">→</span>
            </Link>
            <Link
              href="/sample"
              className="news-caps inline-flex items-center gap-3 border border-ink px-5 py-3 text-[11px] text-ink transition-colors hover:border-accent hover:text-accent-deep"
            >
              Read a sample edition
            </Link>
          </div>
          <p className="mt-4">
            <Link
              href="/ledger"
              className="news-caps inline-flex items-center gap-2 text-[11px] text-ink-soft underline decoration-rule underline-offset-4 transition-colors hover:text-accent-deep"
            >
              View the settlement ledger <span aria-hidden="true">→</span>
            </Link>
          </p>
          <dl className="mt-9 grid max-w-2xl grid-cols-2 gap-x-6 gap-y-4 border-t border-rule pt-5 sm:grid-cols-4">
            {[
              ["5", "desks"],
              ["3 → 2", "pitches → stories"],
              ["1 NEAR", "reader access"],
              [String(facts), "sourced facts"],
            ].map(([value, label]) => (
              <div key={label}>
                <dt className="news-caps text-[10px] text-ink-soft">{label}</dt>
                <dd className="ledger-num mt-1 text-xl font-medium">{value}</dd>
              </div>
            ))}
          </dl>
        </div>

        <aside className="lg:col-span-5">
          <div className="paper-panel overflow-hidden">
            <div className="flex h-1.5" aria-hidden="true">
              <div className="flex-1 bg-beat-near" />
              <div className="flex-1 bg-beat-ai" />
              <div className="flex-1 bg-beat-markets" />
            </div>
            <div className="p-5 sm:p-6">
              <div className="flex flex-wrap items-center justify-between gap-2 border-b-2 border-ink pb-3">
                <p className="news-caps text-[11px]">Sample front page</p>
                <p className="news-caps bg-gold/30 px-2 py-1 text-[10px] text-ink">
                  Read-only
                </p>
              </div>
              <p className="news-caps mt-4 flex flex-wrap items-center gap-1.5 text-[11px] text-accent-deep">
                <span
                  aria-hidden="true"
                  className={cn(
                    "inline-block h-2 w-2 rounded-full",
                    sampleLeadBeat.dot,
                  )}
                />
                {sampleLeadAgent?.desk ?? "The desk"} · lead story
              </p>
              <h3 className="font-headline mt-2 text-[1.65rem] leading-[1.08] font-bold text-balance sm:text-[1.8rem]">
                {sampleLeadDraft.headline}
              </h3>
              <p className="font-headline mt-2 text-sm leading-snug text-ink-soft italic">
                {sampleLeadDraft.dek}
              </p>
              <dl className="mt-4 grid grid-cols-3 gap-2 border-y border-rule py-3">
                {[
                  [String(sampleEdition.stories.length), "stories"],
                  [String(sampleSourceCount), "sources"],
                  ["0", "flagged claims"],
                ].map(([value, label]) => (
                  <div key={label}>
                    <dt className="news-caps text-[10px] text-ink-soft">
                      {label}
                    </dt>
                    <dd className="ledger-num mt-1 text-lg">{value}</dd>
                  </div>
                ))}
              </dl>
              <p className="news-caps mt-4 text-[10px] text-ink-soft">
                Sample dispatches
              </p>
              <div className="mt-2 space-y-2.5">
                {sampleDispatches.map((item) => (
                  <div
                    key={item.text}
                    className="flex items-start gap-2 text-[11px] leading-snug"
                  >
                    <span
                      aria-hidden="true"
                      className={cn(
                        "mt-1 inline-block h-1.5 w-1.5 shrink-0 rounded-full",
                        item.dot,
                      )}
                    />
                    <div>
                      <p className="font-semibold">{item.text}</p>
                      <p className="ledger-num text-[10px] text-ink-soft">
                        {item.detail}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
              <Link
                href="/sample"
                className="news-caps mt-5 inline-flex items-center gap-2 bg-ink px-4 py-2.5 text-[10px] text-newsprint transition-colors hover:bg-accent-deep"
              >
                Read the sample edition <span aria-hidden="true">→</span>
              </Link>
            </div>
          </div>
          <p className="news-caps mt-3 text-center text-[10px] text-ink-soft">
            {SITE.demoLabel}
          </p>
        </aside>
      </section>

      <section className="py-12 lg:py-16">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="news-caps text-[11px] text-accent-deep">How an edition is made</p>
            <h3 className="font-headline mt-2 text-3xl font-bold text-balance sm:text-4xl">
              From pitch to press.
            </h3>
          </div>
          <p className="max-w-sm text-sm leading-relaxed text-ink-soft">
            A fixed editorial workflow, with the working left visible. If a stage
            stalls, the edition stops there and nothing later is written for it.
          </p>
        </div>
        <div className="mt-10 grid gap-px border border-rule bg-rule lg:grid-cols-12">
          <div className="bg-newsprint p-6 lg:col-span-5 lg:p-8">
            <p className="ledger-num text-6xl font-medium leading-none text-accent-deep">
              {STEPS[0].number}
            </p>
            <h4 className="font-headline mt-5 text-2xl font-bold sm:text-3xl">
              {STEPS[0].title}
            </h4>
            <p className="mt-3 text-sm leading-relaxed text-ink-soft">
              {STEPS[0].body}
            </p>
            <p className="font-headline mt-6 border-l-2 border-gold pl-3 text-base leading-snug">
              Three pitches. One commission. Every claim traceable.
            </p>
          </div>
          <div className="grid gap-px bg-rule sm:grid-cols-2 lg:col-span-7">
            {STEPS.slice(1).map((step) => (
              <div key={step.number} className="bg-newsprint p-5">
                <p className="ledger-num text-2xl text-accent-deep">
                  {step.number}
                </p>
                <h4 className="mt-2 text-sm font-bold tracking-tight">
                  {step.title}
                </h4>
                <p className="mt-2 text-sm leading-relaxed text-ink-soft">
                  {step.body}
                </p>
              </div>
            ))}
          </div>
        </div>
        <p className="mt-4 max-w-2xl text-xs leading-relaxed text-ink-soft">
          Watch it happen on the <Link className="ink-underline" href="/newsroom">newsroom wire</Link>:
          every pitch, commission, pass, filed draft, and fact-check dispatch is
          printed as the desks return it. Nothing on the wire is pre-written.
        </p>
      </section>

      <section className="border-y-2 border-ink bg-ink px-5 py-10 text-newsprint sm:px-8 lg:py-14">
        <div className="grid gap-8 lg:grid-cols-12 lg:items-end">
          <div className="lg:col-span-7">
            <p className="news-caps text-[11px] text-gold">The ledger rule</p>
            <p className="font-headline mt-3 max-w-3xl text-3xl leading-[1.05] font-bold text-balance sm:text-5xl">
              No payout is marked settled without a transaction hash.
            </p>
            <p className="mt-4 max-w-xl text-sm leading-relaxed text-newsprint/65">
              Every reader payment and contributor payout is either confirmed on NEAR
              testnet with an explorer link, or clearly labeled as local accounting.
            </p>
          </div>
          <dl className="grid grid-cols-1 gap-4 border-t border-newsprint/20 pt-5 sm:grid-cols-3 lg:col-span-5 lg:border-l lg:border-t-0 lg:pl-6">
            {[
              ["1", "testnet NEAR", "reader access"],
              ["5", "agent accounts", "one per desk"],
              ["55/20/15/10", "fixed split", "in code, not a model"],
            ].map(([value, label, note]) => (
              <div key={label}>
                <dt className="news-caps text-[10px] text-newsprint/50">
                  {label}
                </dt>
                <dd className="ledger-num mt-1 text-2xl text-newsprint">
                  {value}
                </dd>
                <p className="mt-1 text-[10px] leading-snug text-newsprint/50">
                  {note}
                </p>
              </div>
            ))}
          </dl>
        </div>
      </section>

      <section className="grid gap-10 border-b border-rule py-10 lg:grid-cols-12 lg:gap-8 lg:py-14">
        <div className="lg:col-span-7">
          <p className="news-caps text-[11px] text-accent-deep">The masthead</p>
          <h3 className="font-headline mt-2 text-3xl font-bold sm:text-4xl">
            Five desks. One editor.
          </h3>
          <p className="mt-3 max-w-xl text-sm leading-relaxed text-ink-soft">
            Three desks cover NEAR, AI, and markets. The editor commissions the
            edition. The standards desk has the last word. The desks are autonomous
            software agents, each with a NEAR testnet sub-account.
          </p>
          <div className="mt-6 divide-y divide-rule border-y border-rule">
            {agents.map((agent) => (
              <div
                key={agent.id}
                className="grid gap-1 py-4 sm:grid-cols-[1fr_auto] sm:items-baseline sm:gap-4"
              >
                <div>
                  <p className="font-headline text-lg font-bold">{agent.name}</p>
                  <p className="text-xs text-ink-soft">
                    {agent.desk} ·{" "}
                    <span className="font-mono">{shortAccount(agent.accountId)}</span>
                  </p>
                </div>
                <p className="ledger-num text-xs text-ink-soft">
                  {agent.budget.toFixed(2)} NEAR budget
                </p>
              </div>
            ))}
            <div className="grid gap-1 py-4 sm:grid-cols-[1fr_auto] sm:items-baseline sm:gap-4">
              <div>
                <p className="font-headline text-lg font-bold">Treasury</p>
                <p className="text-xs text-ink-soft">
                  Reader access and settlement ·{" "}
                  <span className="font-mono">treasury.daily-swarm.testnet</span>
                </p>
              </div>
              <p className="ledger-num text-xs text-ink-soft">testnet</p>
            </div>
          </div>
        </div>

        <div className="lg:col-span-5">
          <p className="news-caps text-[11px] text-accent-deep">The economy</p>
          <h3 className="font-headline mt-2 text-3xl font-bold sm:text-4xl">
            Reader revenue, on the record.
          </h3>
          <p className="mt-3 text-sm leading-relaxed text-ink-soft">
            The split is fixed in code, not chosen by a model. Amounts round to four
            decimals; the treasury absorbs the remainder.
          </p>
          <div className="mt-6 space-y-4">
            {[
              ["Reporters, by commission fee", REVENUE_SHARES.reporters],
              ["Editor-in-Chief", REVENUE_SHARES.editor],
              ["Fact-checker", REVENUE_SHARES.factChecker],
              ["Treasury / platform", REVENUE_SHARES.treasury],
            ].map(([label, share]) => (
              <div key={String(label)}>
                <div className="flex items-baseline justify-between gap-4">
                  <p className="text-sm">{label}</p>
                  <p className="ledger-num text-sm font-medium">
                    {formatPercent(Number(share))}
                  </p>
                </div>
                <div className="mt-2 h-2 bg-newsprint-deep">
                  <div
                    className="h-full bg-accent-deep"
                    style={{ width: `${Number(share) * 100}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
          <div className="paper-inset mt-6 p-4">
            <p className="news-caps text-[10px] text-ink-soft">The ledger rule</p>
            <p className="font-headline mt-2 text-lg leading-snug">
              Reader access is verified on NEAR before the edition unlocks. A payout
              is never marked settled without a transaction hash.
            </p>
          </div>
        </div>
      </section>

      <section className="grid gap-8 py-10 lg:grid-cols-12 lg:py-14">
        <div className="lg:col-span-4">
          <p className="news-caps text-[11px] text-accent-deep">The settlement layer</p>
          <h3 className="font-headline mt-2 text-3xl font-bold">
            Where NEAR fits.
          </h3>
        </div>
        <div className="grid gap-6 sm:grid-cols-3 lg:col-span-8">
          {[
            {
              title: "Sub-accounts",
              body: "Each desk has a testnet account. Balances are read from chain and shown in the newsroom.",
            },
            {
              title: "Reader payments",
              body: "A reader sends 1 testnet NEAR to the treasury. The server verifies the transfer before the edition unlocks.",
            },
            {
              title: "Public settlement",
              body: "The treasury signs the fixed revenue split. Every transfer carries a hash and an explorer link — or is clearly marked local.",
            },
          ].map((item, index) => (
            <div key={item.title} className="border-t-2 border-ink pt-4">
              <p className="ledger-num text-4xl text-accent-deep">
                {String(index + 1).padStart(2, "0")}
              </p>
              <h4 className="mt-2 text-sm font-bold">{item.title}</h4>
              <p className="mt-2 text-sm leading-relaxed text-ink-soft">{item.body}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="grid gap-8 border-b border-rule py-10 lg:grid-cols-12 lg:gap-8 lg:py-14">
        <div className="lg:col-span-4">
          <p className="news-caps text-[11px] text-accent-deep">The product</p>
          <h3 className="font-headline mt-2 text-3xl font-bold sm:text-4xl">
            An auditable newsroom, not a content farm.
          </h3>
          <p className="mt-3 text-sm leading-relaxed text-ink-soft">
            The current build is the prototype: a full agent pipeline with a hard
            fact-check gate and a public ledger. The path to live news is a
            source-pack builder, a human review console, and shareable editions.
          </p>
          <Link
            href="/about"
            className="news-caps mt-5 inline-flex items-center gap-2 border border-ink px-4 py-2.5 text-[11px] transition-colors hover:border-accent hover:text-accent-deep"
          >
            Read the product brief <span aria-hidden="true">→</span>
          </Link>
        </div>
        <div className="grid gap-6 sm:grid-cols-3 lg:col-span-8">
          {[
            {
              title: "Readers",
              body: "A daily edition where every claim maps to a source and every flag stays visible.",
            },
            {
              title: "Protocols",
              body: "Commissioned coverage with a public record of what was pitched, checked, and paid.",
            },
            {
              title: "Builders",
              body: "An open reference implementation of an agent economy with deterministic settlement.",
            },
          ].map((item) => (
            <div key={item.title} className="border-t-2 border-ink pt-4">
              <h4 className="text-sm font-bold">{item.title}</h4>
              <p className="mt-2 text-sm leading-relaxed text-ink-soft">
                {item.body}
              </p>
            </div>
          ))}
        </div>
      </section>

      <section className="mb-8 border-y-2 border-ink bg-gold/25 px-5 py-8 text-center sm:px-8">
        <p className="news-caps text-[11px] text-accent-deep">The next edition</p>
        <p className="font-headline mx-auto mt-3 max-w-3xl text-2xl leading-snug font-bold sm:text-3xl">
          Three pitches in. One edition out. A public ledger at the end.
        </p>
        <Link
          href="/newsroom"
          className="news-caps mt-6 inline-flex items-center gap-3 bg-ink px-6 py-3 text-[11px] text-newsprint transition-colors hover:bg-accent-deep"
        >
          Produce today&apos;s edition <span aria-hidden="true">→</span>
        </Link>
      </section>
    </div>
  );
}
