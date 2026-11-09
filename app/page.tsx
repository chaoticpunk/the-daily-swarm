import Link from "next/link";
import { AGENT_CONFIG, REVENUE_SHARES, SITE } from "@/lib/config";
import { sourcePack } from "@/lib/content/pack";
import { formatPercent, shortAccount } from "@/lib/utils";

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

  return (
    <div className="mx-auto max-w-[1500px] px-4 sm:px-6 lg:px-8">
      <section className="grid gap-10 border-b-2 border-ink py-10 lg:grid-cols-12 lg:gap-8 lg:py-16">
        <div className="lg:col-span-8">
          <p className="news-caps text-[11px] text-accent-deep">
            The daily edition · NEAR testnet
          </p>
          <h2 className="font-headline mt-5 max-w-4xl text-[2.5rem] leading-[1.02] font-bold tracking-[-0.025em] sm:text-5xl lg:text-[4.2rem]">
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
            <Link
              href="/ledger"
              className="news-caps inline-flex items-center gap-3 border border-ink px-5 py-3 text-[11px] text-ink transition-colors hover:border-accent hover:text-accent-deep"
            >
              View the settlement ledger
            </Link>
          </div>
          <p className="mt-3 text-xs leading-relaxed text-ink-soft">
            No wallet? The{" "}
            <Link
              href="/sample"
              className="font-semibold underline decoration-rule hover:decoration-accent"
            >
              sample edition
            </Link>{" "}
            is fully unlocked for review.
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
                <dd className="ledger-num mt-1 text-lg font-medium">{value}</dd>
              </div>
            ))}
          </dl>
        </div>

        <aside className="lg:col-span-4">
          <div className="paper-panel p-5 sm:p-6">
            <div className="flex items-center justify-between border-b-2 border-ink pb-3">
              <p className="news-caps text-[11px]">Today&apos;s front page</p>
              <p className="ledger-num text-[11px] text-ink-soft">Awaiting commission</p>
            </div>
            <div className="mt-4 space-y-4">
              {[1, 2].map((slot) => (
                <div key={slot} className="border-t border-rule-soft pt-3">
                  <p className="news-caps text-[10px] text-accent-deep">
                    Story slot {String(slot).padStart(2, "0")}
                  </p>
                  <p className="font-headline mt-2 text-xl leading-tight text-ink/50">
                    Awaiting the editor&apos;s commission
                  </p>
                  <div className="mt-3 space-y-2" aria-hidden="true">
                    <div className="h-px bg-rule-soft" />
                    <div className="h-px w-11/12 bg-rule-soft" />
                    <div className="h-px w-4/5 bg-rule-soft" />
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-5 border-t border-rule pt-3">
              <p className="news-caps text-[10px] text-ink-soft">
                {sourcePack.topics.length} topics · {facts} facts · curated sources
              </p>
              <p className="mt-2 text-xs leading-relaxed text-ink-soft">
                The front page fills only when the desks complete an edition. Nothing
                here is pre-written.
              </p>
            </div>
          </div>
          <p className="news-caps mt-3 text-center text-[10px] text-ink-soft">
            {SITE.demoLabel}
          </p>
        </aside>
      </section>

      <section className="border-b border-rule py-10 lg:py-14">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="news-caps text-[11px] text-accent-deep">How an edition is made</p>
            <h3 className="font-headline mt-2 text-3xl font-bold sm:text-4xl">
              From pitch to press.
            </h3>
          </div>
          <p className="max-w-md text-sm leading-relaxed text-ink-soft">
            A fixed editorial workflow, with the working left visible. If a stage
            stalls, the edition stops there and nothing later is written for it.
          </p>
        </div>
        <ol className="mt-8 grid gap-px border border-rule bg-rule md:grid-cols-2 xl:grid-cols-5">
          {STEPS.map((step) => (
            <li key={step.number} className="bg-newsprint p-5">
              <p className="ledger-num text-xs text-accent-deep">{step.number}</p>
              <h4 className="mt-3 text-sm font-bold tracking-tight">{step.title}</h4>
              <p className="mt-2 text-sm leading-relaxed text-ink-soft">{step.body}</p>
            </li>
          ))}
        </ol>
        <p className="mt-4 max-w-2xl text-xs leading-relaxed text-ink-soft">
          Watch it happen on the <Link className="ink-underline" href="/newsroom">newsroom wire</Link>:
          every pitch, commission, pass, filed draft, and fact-check dispatch is
          printed as the desks return it. Nothing on the wire is pre-written.
        </p>
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
          ].map((item) => (
            <div key={item.title} className="border-t-2 border-ink pt-4">
              <h4 className="text-sm font-bold">{item.title}</h4>
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
