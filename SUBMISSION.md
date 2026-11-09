# Submission notes

NEAR Hackathon 2026 · primary track **AI Swarms** (`swarms`) · team size **1 — Solo builder**.

The form allows selecting multiple tracks. The official FAQ says: “Select every track your project fits.” Keep AI Swarms as the primary narrative. **Autonomous Business** (`business`) is a legitimate second track — the newsroom runs a treasury, sells reader access, commissions its own desks, and splits revenue — but add it only if the “What did you build?” text supports both stories.

## Final links

| Form field | Value |
| --- | --- |
| Repository link | <https://github.com/chaoticpunk/the-daily-swarm> |
| Demo post link | **TODO — the public X thread; the first tweet contains the video** |
| Website | **Leave empty.** The live URL goes in the demo post and the project description. |
| Tracks | **AI Swarms** (primary); optionally **Autonomous Business** |
| Team size | **1 — Solo builder** |
| Project name | The Daily Swarm |
| Team lead / email | Fill in |
| NEAR wallet address | Your wallet; this is where a prize would be sent |

The live demo is not a separate form field: <https://the-daily-swarm.vercel.app>
The no-wallet sample edition: <https://the-daily-swarm.vercel.app/sample>

Demo post requirements: public X post; say you built it at NEAR HACKATHON; tag `@NEARProtocol` and `#NEARHackathon`; attach the video or screenshots. The first tweet must contain the video and the live URL.

## What did you build? (copy-paste, 20–2,000 characters)

```text
The Daily Swarm is an autonomous newsroom with a public ledger. Three reporter desks pitch stories with a fee and word count; an editor commissions two under a fixed budget and records why the third was passed; a standards desk checks every claim against a curated source pack and forces one revision when a claim is unsupported. A live wire prints every pitch, commission, draft, and fact-check as it happens. Readers unlock the finished edition with 1 testnet NEAR; a deterministic 55/20/15/10 split settles to agent sub-accounts on NEAR testnet. The repo includes a read-only sample edition, 48 tests, and real testnet explorer links for a reader payment and all four transfers. The public deployment verifies reader payments against the testnet RPC but does not hold the treasury signing key, so its payout rows are labeled LOCAL · NOT ON-CHAIN.

Live demo: https://the-daily-swarm.vercel.app
Sample (no wallet): https://the-daily-swarm.vercel.app/sample
Repo: https://github.com/chaoticpunk/the-daily-swarm
```

## Verified state

| Check | Result |
| --- | --- |
| `npm run typecheck` | pass |
| `npm run lint` | pass |
| `npm test` | 48 tests · 8 files |
| `npm run build` | pass · 20 route entries, including `/sample` |
| Fresh worktree, no `.env.local` | `npm ci` + `npm test` + `npm run build` pass |
| Live routes `/`, `/sample`, `/newsroom`, `/ledger` | HTTP 200 |
| Live `/api/health` | `ok:true`, LLM configured, NEAR testnet, `payoutsReady:false` |
| Live `/api/agent/pitch` | HTTP 200 · `Qwen/Qwen3.8-27B` · 7.1s |
| Vercel Production env | `NEARAI_CLOUD_API_KEY` set; **no `NEAR_TREASURY_PRIVATE_KEY`** |
| CI on latest `main` | success |
| Repository visibility | public |

The production deployment was promoted with `vercel --prod` after the merge. The live sample route returns 200, and the live pitch endpoint produced a real pitch with the production key. Vercel is not auto-deploying from GitHub, so future changes need `npx vercel --prod` or `vercel git connect`.

## What is on-chain vs local

- The public deployment **verifies reader payments on-chain** against the NEAR testnet RPC.
- It intentionally does **not** hold `NEAR_TREASURY_PRIVATE_KEY`, so its payout rows are `LOCAL · NOT ON-CHAIN`.
- The full on-chain split — reader payment plus all four transfers — was exercised on a local instance. Explorer links are in the README’s [Testnet transactions](README.md#testnet-transactions) section.
- Do not add the treasury key to the public deployment without auth, rate limiting, and durable replay protection. The payout route is public, reader payments are not bound to an edition, and the in-process replay guard does not survive a serverless cold start.

## Video

Script and shot list: [docs/DEMO-SCRIPT.md](docs/DEMO-SCRIPT.md).

The video must show the live URL and the on-chain evidence. Say clearly that the public instance’s payouts are local accounting; do not imply the public server signs transfers.

## X thread draft

The human author must post this; the coding agent must not publish on their behalf.

### Tweet 1

```text
A newsroom run by autonomous agents: three desks pitch, an editor commissions two, a standards desk checks every claim — and they get paid on NEAR.

Built at NEAR HACKATHON: The Daily Swarm (AI Swarms track).

https://the-daily-swarm.vercel.app

[VIDEO]

@NEARProtocol #NEARHackathon
```

Attach the video to tweet 1 and remove the `[VIDEO]` marker before posting. The first tweet must remain under 280 characters; the draft is ~272 by X's weighted count.

### Tweet 2

```text
How it works: three desks pitch with a fee and word count; the editor commissions two under a budget; a standards desk checks every claim; readers unlock with 1 testnet NEAR; the split settles to agent sub-accounts.

Sample: https://the-daily-swarm.vercel.app/sample
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
- [x] Live demo is reachable
- [x] Fresh clone builds and tests without `.env.local`
- [x] Sample edition added to the repository
- [x] Sample edition deployed; live `/sample` returns 200
- [x] Live LLM smoke test passed (`/api/agent/pitch`, production key)
- [ ] Demo video recorded
- [ ] X thread posted by the human author; first tweet contains the video
- [ ] Form submitted with the repository link and the demo post link
- [ ] `website` left empty in the form
- [ ] Track selection: AI Swarms, plus Autonomous Business only if the description supports it
- [ ] Team size is exact
- [ ] Cross-disclosure resolved (see below)
- [ ] The same repository is not submitted twice
- [ ] Repository remains public through judging

## Cross-disclosure

The official FAQ: one person can enter up to 2 different projects if they are independent and each README names the other one.

- If `sealed-ledger` is **also submitted** to NEAR Hackathon 2026, add a line naming The Daily Swarm to the Sealed Ledger README before submitting. Track separation alone does not exempt the rule.
- If `sealed-ledger` is **not submitted** to this hackathon, this item does not apply.

The Daily Swarm README already names Sealed Ledger.

## Demo operations and key safety

- The public deployment uses the author’s LLM key. There is no auth or rate limiting. Set a hard provider spend cap, monitor usage, and rotate the key after judging.
- Never commit `.env.local`. Only `.env.example` is tracked.
- Keep the public instance in `LOCAL · NOT ON-CHAIN` payout mode unless the payout route is protected by auth, rate limiting, and durable replay protection.

## Deadline

Development ends **14 Nov 2026 · 23:59 UTC**. Judging and results: 16–18 Nov 2026. The form can be corrected after submission through the Request changes page.
