# Demo video script

Target: **75–90 seconds**, 16:9. Record the live deployment at <https://the-daily-swarm.vercel.app>. The first tweet of the X thread contains this video.

## Before recording

- Do not show `.env.local`, terminal history, API keys, or the treasury private key.
- Testnet funds have no real value. Use a funded testnet wallet only if you want to show the payment live.
- The public instance runs payouts in **local-ledger mode**. Say that clearly. The on-chain evidence is the README explorer table, not a live payout on the public server.
- If the wallet flow is slow, record the verified receipt and the explorer transaction separately, then cut them together.

## Shot list

| Time | Screen | Action / on-screen text |
| --- | --- | --- |
| 0:00–0:06 | Home page | “The Daily Swarm” + live URL. “An autonomous newsroom with a public ledger.” |
| 0:06–0:18 | `/newsroom` | Click **Produce today’s edition**. The wire starts. Point at three pitches: fee, word count, sourced claims. |
| 0:18–0:30 | Wire / workflow | Editor commissions two under the 0.80 NEAR budget and passes the third with a reason. Desks file. |
| 0:30–0:45 | Standards desk | One unsupported claim is flagged; the desk revises once; the re-check passes. If a flag survives, it stays visible. |
| 0:45–1:00 | Edition page | Editor’s note, front page, both stories, every claim mapped to a source. |
| 1:00–1:15 | Paywall / receipt | Reader pays 1 testnet NEAR. Receipt and split appear. Call out **LOCAL · NOT ON-CHAIN** on the public instance, then cut to the README explorer links for the real split. |
| 1:15–1:25 | `/sample` + repo | “No wallet? Read the sample edition.” Show `npm ci && npm run check`. Close on “The edition is the output. The settlement is the proof.” |

## Narration

**0:00–0:06**

> This is The Daily Swarm: an autonomous newsroom where the desks, editor, and fact-checker are software agents — and the books are public.

**0:06–0:18**

> One click starts an edition. Three desks pitch with a headline, a fee, a word count, and claims that must cite the curated source pack.

**0:18–0:30**

> The editor commissions two against a fixed budget and records why the third was passed. The desks then file to their assigned length.

**0:30–0:45**

> A standards desk checks every claim against the sources. An unsupported claim sends the story back for one revision, then a re-check. Nothing is silently replaced.

**0:45–1:00**

> The finished edition carries the editor’s note, the front page, and every claim mapped to its source. The wire has printed each dispatch as it happened.

**1:00–1:15**

> A reader unlocks the edition with one testnet NEAR. The treasury verifies the payment on-chain and computes a deterministic split: reporters, editor, fact-checker, treasury. On this public instance the payout rows are local accounting — the full on-chain split was exercised separately, and every transfer is linked in the README.

**1:15–1:25**

> No wallet? The sample edition is fully unlocked. The repository runs typecheck, lint, tests, and a production build with no secrets. The edition is the output; the settlement is the proof.

## Claims to keep accurate

- **Do:** “Reader payments are verified against the NEAR testnet RPC.”
- **Do:** “The public instance records payouts as LOCAL · NOT ON-CHAIN.”
- **Do:** “The full split was exercised on a local instance; the explorer links are in the README.”
- **Don’t:** say the public instance settles payouts on-chain.
- **Don’t:** imply the sample edition was paid for or is a record of a live run.

## 60-second cut

Drop the standards-desk revision shot (0:30–0:45) and the repository shot. Keep: home → wire/pitches → editor commission → edition → receipt/explorer → closing line. The video must still show the live URL and the on-chain evidence link.
