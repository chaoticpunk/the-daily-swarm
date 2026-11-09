# Submission notes

NEAR Hackathon 2026 · track **swarms** · team size **1** (update if different).

## Links

- Repository: <https://github.com/chaoticpunk/the-daily-swarm>
- Live demo: <https://the-daily-swarm.vercel.app>
- Demo post (X thread): **TODO — the human author must post it**
- Video: **TODO — attach to the first tweet**

The live demo produces real editions. It verifies reader payments on NEAR testnet, but it does not hold the treasury signing key, so its payout rows are `LOCAL · NOT ON-CHAIN`. The real on-chain split is documented in the README with testnet explorer links.

Do not fill the submission form’s `website` field; the hackathon API rejects a non-empty website.

## Idea

The Daily Swarm is a self-running newsroom where three autonomous reporter desks pitch stories, an editor commissions two under a fixed budget, and a standards desk fact-checks every claim against a curated source pack. A live wire prints every pitch, commission, pass, filed draft, and fact-check dispatch as it happens. Readers unlock the finished edition with 1 testnet NEAR; a deterministic 55/20/15/10 split is signed by the treasury and recorded in a public ledger on NEAR testnet. The product is the visible agent economy — bids, edits, checks, payments, and payouts — not just generated text.

## X thread draft

The human author must post this; the coding agent must not publish on their behalf.

### Tweet 1

```text
A newsroom where the desks, editor and fact-checker are autonomous software agents — and they pitch, write, and get paid on NEAR.

Built The Daily Swarm for NEAR HACKATHON. One click produces an edition; the reader receipt and payout ledger are public. No fabricated results.

https://the-daily-swarm.vercel.app

[VIDEO]

@NEARProtocol #NEARHackathon
```

### Tweet 2

```text
How it works: three desks pitch with a fee and word count, the editor commissions two against a budget, the standards desk flags unsupported claims, readers unlock the edition with 1 testnet NEAR, and the split settles to agent sub-accounts. The wire prints every dispatch as it happens.

Repo: https://github.com/chaoticpunk/the-daily-swarm
```

### Tweet 3

```text
The edition is the output. The settlement is the proof.

Every reader payment and payout has a NEAR testnet explorer link. Demo edition, curated sources, testnet only.

What should the swarm investigate first?
```

## Submission checklist

- [x] Repository is public
- [x] CI is green
- [x] Live demo is reachable
- [ ] Demo video recorded
- [ ] X thread posted by the human author; first tweet contains the video
- [ ] `demoUrl` is the first tweet
- [ ] `website` is empty in the submission form
- [ ] Track is `swarms` only
- [ ] Team size is exact
- [ ] Cross-disclosure: this repo names Sealed Ledger, and the Sealed Ledger README names The Daily Swarm
- [ ] The same repository is not submitted twice
- [ ] Repository remains public through judging

## Cross-disclosure

This is the second, independent project by the author of [Sealed Ledger](https://github.com/chaoticpunk/sealed-ledger). No Sealed Ledger code, styles, or assets are reused.

The Sealed Ledger README must also mention The Daily Swarm. That repository is outside this workspace; update it separately before submitting.
