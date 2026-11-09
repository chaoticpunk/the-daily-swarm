# Submission notes

NEAR Hackathon 2026 · tracks **AI Swarms** (`swarms`) + **Autonomous Business** (`business`) · team size **1** (API) / `1 — Solo builder` (form).

Official rules to keep in view:

- Deadline: **2026-11-14T23:59:00Z**. Judging starts **2026-11-16T00:00:00Z**; results by **2026-11-18T23:59:00Z**.
- One submission per project. Each repository can be submitted only once.
- The repository must be public by the deadline and stay public through judging.
- The demo post is a public X post by the human, with the video or screenshots attached. The agent must not post it.
- The agent must not send the submission until the human has seen the full JSON payload and said yes.

## Final fields

| Form field | Value |
| --- | --- |
| Project name | `The Daily Swarm` |
| Team lead | **human fills in** (2–80 chars) |
| Email address | **human fills in** (max 160 chars) |
| Team size | Form: `1 — Solo builder` · API: `"1"` |
| Tracks | Recommended: `["swarms", "business"]`. Focused alternative: `["swarms"]`. |
| NEAR wallet address | **human fills in**: a **mainnet** named account (e.g. `team.near`) or 64-character implicit account. Not testnet. Never a private key. |
| Repository link | <https://github.com/chaoticpunk/the-daily-swarm> |
| Demo post link | **TODO**: public X post after the human records and posts the video |
| Website | **Leave empty.** The form/API treats a non-empty website as a spam trap. |

The live demo is not a form field: <https://the-daily-swarm.vercel.app>
The no-wallet sample edition: <https://the-daily-swarm.vercel.app/sample>
The product brief: <https://the-daily-swarm.vercel.app/about>

## What did you build? (copy-paste, 20–2,000 characters)

```text
AI-generated news is opaque: readers cannot see which source supports a sentence, what was checked, or who was paid. The Daily Swarm is an auditable AI newsroom for a niche beat. Three reporter agents pitch stories with a fee and word count; an editor commissions two under a fixed budget and records why the third was passed; a standards desk checks every claim against a source pack and forces one revision when a claim is unsupported. A live wire prints every dispatch. Readers unlock the edition with 1 testnet NEAR. NEAR is the settlement and audit layer: each agent has a sub-account, the reader payment is verified on the testnet RPC, and the deterministic 55/20/15/10 split is recorded in a public ledger. The prototype proves the full loop — source-grounded writing, independent checks, reader payment, and auditable settlement. The repo includes a no-wallet sample edition, 48 tests, and real testnet explorer links for a reader payment and all four transfers. The public deployment verifies payments on testnet but does not hold the treasury signing key, so its payout rows are labeled LOCAL · NOT ON-CHAIN. The product path — live primary-source ingestion, human review, shareable editions, subscriptions, and an audit API — is in docs/PRODUCT.md.

Live demo: https://the-daily-swarm.vercel.app
Sample (no wallet): https://the-daily-swarm.vercel.app/sample
Product brief: https://the-daily-swarm.vercel.app/about
Repo: https://github.com/chaoticpunk/the-daily-swarm
```

## Official compliance check

| Requirement | Status |
| --- | --- |
| Project name 2–80 chars | ✅ `The Daily Swarm` |
| Team lead 2–80 chars | ❌ human fills in |
| Email max 160 chars | ❌ human fills in |
| Team size exactly one of the allowed strings | ⚠️ form `1 — Solo builder`; API must be `"1"` |
| Tracks: every track the project fits, using ids | ✅ recommended `["swarms", "business"]` |
| NEAR payout account: mainnet named or 64-char implicit | ❌ human fills in; must not be testnet |
| Repository public and uniquely submitted | ✅ public; not submitted yet — confirm before sending |
| Demo post: public X post with video/screenshots | ❌ not posted yet |
| Idea: 20–2,000 chars, problem + product + NEAR role | ✅ problem-led copy above |
| Consent notice read and agreed | ❌ human must agree |
| Website empty (spam trap) | ✅ leave empty |
| Code written in the window | ✅ initial commit 2026-11-08, after 2026-10-19 |
| License | ✅ MIT (`LICENSE`) |
| Testnet-only eligible | ✅ Q-010 allows testnet-only projects in all tracks |
| Hosted demo | ✅ live; keep it up through 2026-11-18, ideally 2026-11-25 |
| Secrets not committed | ✅ only `.env.example` tracked |
| No mainnet transaction or deployment | ✅ testnet only |
| Agent did not post on X | ✅ |
| Submission API not sent yet | ✅ waiting for human confirmation |
| README readable by screening agents | ✅ “For judges” quick start, routes, tests, limits |

## Submission API payload (do not send yet)

Print the full JSON, fill the human fields, and send only after a yes:

```json
{
  "requestId": "<generate once with uuidgen | tr A-Z a-z>",
  "projectName": "The Daily Swarm",
  "leadName": "<human>",
  "email": "<human>",
  "size": "1",
  "tracks": ["swarms", "business"],
  "nearAddress": "<human mainnet account>",
  "projectUrl": "https://github.com/chaoticpunk/the-daily-swarm",
  "demoUrl": "<public X post URL>",
  "idea": "<copy the What did you build? block>",
  "consent": true
}
```

Rules:

- Body ≤ 12,000 bytes. Exact fields only; do not send `website` or any extra field.
- Generate `requestId` once. Reuse it on a retry after a network error or 503.
- 201 = saved. 400 = fix the listed fields and resend with the same `requestId`. 403 = submissions closed or cross-site; tell the human, do not retry. 409 = repository already submitted or email limit; do not change the link or email to get around it. 413 = shorten the description. 503 = wait and retry with the same `requestId`.
- Never submit twice. If a saved submission has a mistake, the human requests changes at <https://nearhackathon.com/request-changes>.

## Consent notice (read verbatim)

> I agree that the organizers may use these details to review our submission and contact us about this hackathon.

The API receives `consent: true` only after the human agrees to this exact notice.

## Demo post requirements

The human posts this on X; the agent must not publish it. The post must:

- say the project was built at NEAR HACKATHON;
- tag `@NEARProtocol` and `#NEARHackathon` (`@NearLegion` and `@NearBuilders` optional);
- attach the demo video or screenshots;
- lead with the user problem, show one complete moment, explain NEAR’s role concretely, and give a next step (the live link and repo).

The first tweet must stay under 280 weighted characters. The draft below is ~271.

## X thread draft

### Tweet 1

```text
AI news is opaque: you can't see what was checked or who was paid.

The Daily Swarm: auditable AI newsroom. Agents pitch, a standards desk checks every claim, and readers pay on NEAR.

Built at NEAR HACKATHON.

https://the-daily-swarm.vercel.app
[VIDEO]
@NEARProtocol #NEARHackathon
```

Attach the video to tweet 1 and remove the `[VIDEO]` marker before posting.

### Tweet 2

```text
Three desks pitch with a fee and word count; the editor commissions two under a budget; a standards desk checks every claim; readers unlock with 1 testnet NEAR; the split settles to agent sub-accounts.

Built for the AI Swarms track. Sample (no wallet): https://the-daily-swarm.vercel.app/sample
```

### Tweet 3

```text
The edition is the output. The settlement is the proof.

Every payment and payout has a testnet explorer link. The public instance keeps payouts in local-ledger mode; the archived on-chain split is in the README.

Repo: https://github.com/chaoticpunk/the-daily-swarm
```

## Submission checklist

- [x] Repository is public
- [x] CI is green on the latest `main`
- [x] Live demo and `/sample` are reachable
- [x] Fresh clone builds and tests without `.env.local`
- [x] 48 tests; production build passes
- [x] No secrets tracked
- [x] MIT license
- [x] Code written in the hackathon window
- [x] Testnet-only is allowed
- [x] README has a judge quick start
- [ ] Team lead and email filled in
- [ ] Mainnet NEAR payout account filled in
- [ ] Demo video recorded
- [ ] X thread posted by the human; first tweet has the video
- [ ] Demo post URL copied into the form/API payload
- [ ] Tracks selected: `["swarms", "business"]` (or `["swarms"]`)
- [ ] API `size` set to `"1"`
- [ ] `idea` copied from the block above
- [ ] `website` left empty
- [ ] Consent notice read and agreed
- [ ] Full JSON payload printed and human said yes
- [ ] Submission sent once; 201 received
- [ ] Demo and repository stay public through 2026-11-18

## Demo operations and key safety

- The public deployment uses the author’s LLM key. There is no auth or rate limiting. Set a hard provider spend cap, monitor usage, and rotate the key after judging.
- Never commit `.env.local`. Only `.env.example` is tracked.
- Keep the public instance in `LOCAL · NOT ON-CHAIN` payout mode unless the payout route is protected by auth, rate limiting, and durable replay protection.
- Do not create or invent a NEAR payout account for the human. Do not paste a private key into the form or the demo.

## Deadline

- Development ends **2026-11-14T23:59:00Z**.
- Judging starts **2026-11-16T00:00:00Z**; results by **2026-11-18T23:59:00Z**.
- Keep the repository and demo up through judging. If a saved submission has a mistake, use <https://nearhackathon.com/request-changes>; do not submit again.
