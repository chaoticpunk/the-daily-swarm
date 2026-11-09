# Product brief

## One sentence

The Daily Swarm is an auditable AI newsroom for a niche beat: agents pitch, write, and check every claim against a source pack; readers pay once; the revenue split settles on NEAR.

## The problem

- AI-generated news is opaque. Readers cannot see what was checked, which source supports which sentence, or who was paid.
- Newsrooms experimenting with agents lack an audit trail and a settlement rail for machine contributors.
- Agent economies lack a credible reference implementation that connects work, verification, and payment.

## The product

- A daily edition for a niche beat (NEAR ecosystem, AI, markets).
- Every factual claim maps to a source ID. The standards desk checks each claim; unsupported claims force one revision and a re-check.
- A live wire shows every pitch, commission, pass, draft, and fact-check as the agents return it.
- A reader receipt and public ledger show the payment and the deterministic 55/20/15/10 split to agent sub-accounts.
- The edition is the output; the settlement is the proof.

## Who it is for

- **Crypto-native readers** who want a daily, sourced brief instead of an opaque feed.
- **Protocols and DAOs** that want commissioned coverage with a public audit trail and a settlement record.
- **Builders and researchers** who want a working reference implementation of an agent economy.

## What is real in this build

- The full pipeline: pitch → commission → write → check → revise → re-check → layout.
- Source-grounded claims and a hard fact-check gate.
- Five agents with NEAR testnet sub-accounts.
- 48 tests, CI, and a production build; a fresh clone runs without secrets.
- A no-wallet sample edition and a live deployment.
- A real testnet reader payment and four transfers on the explorer (from a local run).

## What is still demo

- The source pack is curated: six topics, 30 facts. The agents do not browse the web.
- The public instance keeps payouts in local-ledger mode; it has no treasury key.
- Editions are stored in the browser; a shared edition link does not travel.
- Testnet only; no accounts, database, or rate limiting.

## Product path

### Phase 1 — auditable demo (now)

The current build. It proves the full loop and makes the audit trail visible. The curated pack keeps the demo stable and the claims verifiable.

### Phase 2 — live niche newsroom

- **Source-pack builder:** ingest primary sources (official blogs, governance forums, docs, on-chain data, filings), snapshot and hash each source, extract claim/span evidence, and produce the same `SourcePack` schema the agents already use.
- **Human review console:** an editor approves, edits, and signs off. High-risk claims require a human; nothing publishes automatically.
- **Database and accounts:** editions, source snapshots, corrections, and shareable edition links.
- **One beat, daily cadence:** run 10–20 editions as a pilot, measure claim support and revision rates, then widen.

### Phase 3 — product

- Reader subscriptions or micropayments for the daily edition.
- A B2B audit/verification API for publishers and agent teams.
- Sponsored beats, licensing, and mainnet settlement.
- Agent reputation and source reliability scoring from the public ledger.

## Business model

- **Reader subscriptions or micropayments** for the daily edition.
- **B2B audit/verification API** for publishers and agent teams that need the same source-grounded check.
- **Sponsored beats and licensing** for protocols that want coverage.
- The public ledger is the trust layer; the news product is the content.

## Moat

- Source-grounded verification with a hard gate, not a disclaimer.
- Deterministic, auditable settlement.
- Agent reputation and history derived from the ledger.
- A reference implementation others can fork and audit.

## Risks and mitigations

- **Copyright and licensing:** use primary sources and licensed feeds; do not scrape or rewrite paywalled content.
- **Defamation and privacy:** human review, corrections, and legal review for high-risk beats.
- **Hallucination:** source IDs, span-level evidence, schema validation, and re-checks.
- **Cost:** cheaper models, retrieval, caching, and a price per edition.
- **Trust:** label AI involvement, show sources, publish corrections, and keep the audit trail.

## Metrics

Claim support rate, revision rate, time per edition, cost per edition, reader unlock conversion, payout success rate, correction rate.

## What to build next

1. `scripts/build-source-pack.ts`: fetch primary sources for one beat, snapshot, extract facts, write a `SourcePack`.
2. `/api/source-pack`: serve the pack with a version and hash.
3. A human review page: approve or reject claims and stories before publish.
4. Postgres or Vercel KV for editions, sources, corrections, and shareable links.
5. Shareable edition links backed by the database.
