# Judge quick start

The Daily Swarm · NEAR Hackathon 2026 · primary track **AI Swarms**.

## 1. Fast path — no wallet (30 seconds)

Open **<https://the-daily-swarm.vercel.app/sample>**.

This is a read-only sample edition: both stories, every fact-check, every source, the editor’s note, and the front-page order. It needs no wallet and no payment. It is illustrative output from the same curated source pack the desks use; it is not a live run and has no settlement of its own.

## 2. Live pipeline

1. Open **<https://the-daily-swarm.vercel.app/newsroom>**.
2. Click **Produce today’s edition**. The wire prints real dispatches as each agent responds: three pitches with fees and word counts, the editor’s commission and pass reason, the filed drafts, and the standards desk’s checks. A failed stage remains visible with its error and a retry; nothing later is fabricated.
3. Open the published edition.
4. Unlock it with **1 testnet NEAR**:
   - Connect MyNearWallet on testnet (<https://testnet.mynearwallet.com>) and pay from a funded testnet account.
   - Or use the manual verification form: paste the transaction hash and the sender account. The server re-verifies the transfer against the NEAR testnet RPC.
   - Need testnet NEAR? <https://near-faucet.io/>
5. The receipt and settlement ledger appear. On the public deployment, payout rows are marked **LOCAL · NOT ON-CHAIN** because the server intentionally has no treasury signing key. The reader payment itself is verified on-chain.

## 3. On-chain evidence

The README’s [Testnet transactions](https://github.com/chaoticpunk/the-daily-swarm#testnet-transactions) table links a real reader payment and all four transfers on the NEAR testnet explorer. These were produced on a local instance with the treasury key. The public deployment’s local-ledger mode is documented, not hidden.

## 4. Run the repository

```bash
npm ci
npm run check   # typecheck + lint + tests + production build
```

`npm ci`, `npm test`, and `npm run build` need no `.env.local` and no secrets. To run a real edition locally, copy `.env.example` to `.env.local`, set an LLM key and the NEAR testnet variables, then `npm run dev`; see [SETUP.md](../SETUP.md). `npm run edition` runs one edition from the CLI.

## 5. What the tests cover

- deterministic 55/20/15/10 split in 1e-4 NEAR units
- schema rejection for malformed agent output
- editor budget and reporter constraints
- source-ID constraints
- payment verification failures (wrong receiver, wrong sender, underpayment, failed tx, non-final tx)
- payout classification
- the browser orchestration state machine
- a full fixture-LLM edition (pitch → commission → write → check → revise → re-check → layout)
- the `/sample` edition’s schema and source citations

## 6. Honest limitations

- Editions and ledger rows are stored in the browser that produced them. A shared `/edition/[id]` link does not travel to another browser.
- The public instance does not sign payouts. Testnet only; no real money.
- The full MyNearWallet signing path is the one UI path not exercised end-to-end. Manual transaction-hash verification is the fallback.
- No database, auth, or rate limiting. The public demo uses the author’s LLM key; if the key is exhausted, run the repository locally.

## 7. Where the code lives

| Area | Path |
| --- | --- |
| Agent prompts and schemas | `lib/agents/prompts.ts`, `lib/agents/schemas.ts`, `lib/agents/run.ts` |
| Browser orchestration | `lib/store/newsroom.ts` |
| Revenue split | `lib/economy/split.ts` |
| Payment verification and payouts | `lib/near/verify.ts`, `lib/near/rpc.ts`, `app/api/near/*` |
| Live wire UI | `components/newsroom/WireFeed.tsx` |
| Sample edition | `lib/content/sample-edition.ts`, `app/sample/page.tsx` |
| Tests | `tests/` |
