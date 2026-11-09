import { editionSchema } from "@/lib/agents/schemas";
import type { Claim, Edition } from "@/lib/types";

/**
 * A read-only edition used by /sample so reviewers can see the finished product
 * without a testnet wallet or a payment. It is illustrative output assembled from
 * the same curated source pack the live desks use — not a record of a live run.
 *
 * Every claim cites a real source ID from data/topics.json. The live pipeline
 * validates the same schema, so this file is a useful end-to-end fixture too.
 */

const marketsClaims: Claim[] = [
  {
    text: "The BIS concluded in June 2026 that stablecoins in their current form fall short on key properties of money and have structural flaws.",
    sourceId: "stablecoin-payment-rails-4",
  },
  {
    text: "The BIS defines singleness as the ability to redeem different forms of money exactly at par in exchange for central bank money.",
    sourceId: "stablecoin-payment-rails-5",
  },
  {
    text: "Under the U.S. GENIUS Act, issuers are required to hold reserves on at least a one-to-one basis against the value of coins issued.",
    sourceId: "stablecoin-payment-rails-2",
  },
  {
    text: "Authorized issuers of payment stablecoins are required to redeem them for a fixed amount of money.",
    sourceId: "stablecoin-payment-rails-3",
  },
  {
    text: "Project Agorá is a BIS public-private collaboration testing a multi-currency shared programmable platform for wholesale cross-border payments.",
    sourceId: "tokenized-settlement-project-agora-1",
  },
  {
    text: "In April 2024, the BIS and seven central banks announced Project Agorá to explore tokenisation of cross-border payments.",
    sourceId: "tokenized-settlement-project-agora-3",
  },
  {
    text: "Twenty-eight financial institutions and central banks across Asia, Europe, and North America took part in Project Agorá's July 2026 real-value testing.",
    sourceId: "tokenized-settlement-project-agora-4",
  },
  {
    text: "Project Agorá's July 2026 real-value testing recorded an average time from payment initiation to settlement of approximately 80 seconds.",
    sourceId: "tokenized-settlement-project-agora-5",
  },
];

const marketsCheckNotes: Record<string, string> = {
  "stablecoin-payment-rails-4": "Matches the BIS June 2026 conclusion.",
  "stablecoin-payment-rails-5": "Matches the BIS definition of singleness.",
  "stablecoin-payment-rails-2": "Matches the St. Louis Fed summary of the GENIUS Act.",
  "stablecoin-payment-rails-3": "Matches the St. Louis Fed summary of the GENIUS Act.",
  "tokenized-settlement-project-agora-1": "Matches the BIS Project Agorá page.",
  "tokenized-settlement-project-agora-3": "Matches the BIS April 2024 announcement.",
  "tokenized-settlement-project-agora-4": "Matches the BIS Project Agorá page.",
  "tokenized-settlement-project-agora-5": "Matches the BIS Project Agorá page.",
};

const nearClaims: Claim[] = [
  {
    text: "In NEAR Intents, an intent expresses what a user wants to achieve rather than how to achieve it.",
    sourceId: "near-intents-solver-market-1",
  },
  {
    text: "NEAR Intents sends quote requests to solvers over the Message Bus, a WebSocket relay that broadcasts each request to all connected solvers.",
    sourceId: "near-intents-solver-market-2",
  },
  {
    text: "Once a user accepts a quote, the intent is executed by calling the Verifier smart contract on NEAR Protocol.",
    sourceId: "near-intents-solver-market-3",
  },
  {
    text: "If an intent cannot be fulfilled, the transaction is reverted and funds are returned to the refund address.",
    sourceId: "near-intents-solver-market-4",
  },
  {
    text: "When a user signs with an existing wallet, the Verifier derives an account from their public key, removing the need to create a NEAR account.",
    sourceId: "near-intents-solver-market-5",
  },
];

const nearCheckNotes: Record<string, string> = {
  "near-intents-solver-market-1": "Matches the NEAR Intents documentation.",
  "near-intents-solver-market-2": "Matches the market-maker documentation.",
  "near-intents-solver-market-3": "Matches the Verifier overview.",
  "near-intents-solver-market-4": "Matches the NEAR Intents documentation.",
  "near-intents-solver-market-5": "Matches the account-abstraction documentation.",
};

const marketsBody = `The Bank for International Settlements has issued a stark assessment of stablecoins, concluding that in their current form they fall short on key properties of money and have structural flaws. The June 2026 finding sits alongside the BIS's own work on tokenized settlement — a contrast that has drawn attention from payments specialists.

At the center of that work is Project Agorá, a public-private collaboration testing a multi-currency shared programmable platform for wholesale cross-border payments. The project examines whether tokenising wholesale central bank money and commercial bank deposits on programmable platforms can improve the monetary system. It was announced in April 2024 by the BIS together with seven central banks.

Project Agorá's July 2026 real-value testing involved twenty-eight financial institutions and central banks across Asia, Europe and North America. The test recorded an average time from payment initiation to settlement of approximately 80 seconds — a figure the BIS presents as evidence that tokenized settlement can compress cross-border payment timelines.

The BIS's critique of stablecoins turns on what it calls singleness: the ability to redeem different forms of money exactly at par in exchange for central bank money. Stablecoins, the BIS argues, do not reliably provide that property. Its preferred direction is tokenised central bank reserves and commercial bank deposits on a shared platform, with settlement finality anchored in central bank money.

The contrast is not a verdict on stablecoins' near-term role in payments. Under the U.S. GENIUS Act, issuers of payment stablecoins must hold reserves on at least a one-to-one basis against the value of coins issued, and authorized issuers must redeem them for a fixed amount of money. But the BIS's position makes clear that the institutional debate is no longer only about whether stablecoins work; it is about what kind of money should sit underneath settlement.`;

const nearBody = `NEAR Intents is best understood as a shift in the unit of instruction. In NEAR Intents, an intent expresses what a user wants to achieve rather than how to achieve it, leaving the execution path to competing solvers.

The mechanism is a quote market. NEAR Intents sends quote requests to solvers over the Message Bus, a WebSocket relay that broadcasts each request to all connected solvers. Each solver can respond with a quote; the user chooses one. Once a user accepts a quote, the intent is executed by calling the Verifier smart contract on NEAR Protocol.

That design creates two kinds of guarantees. The first is competitive pricing: because every connected solver sees the same request, quotes are priced against each other rather than against a single market maker's book. The second is a defined failure mode: if an intent cannot be fulfilled, the transaction is reverted and funds are returned to the refund address.

Account abstraction is the other half of the product story. When a user signs with an existing wallet, the Verifier derives an account from their public key, removing the need to create a NEAR account. That matters for onboarding: a user can interact with NEAR-based settlement without first learning a new account model or funding a new wallet.

For builders, the practical surface is the solver market rather than a single integration. The Verifier is the on-chain check; the Message Bus is the coordination layer; and the user's intent is the only thing that has to be specified up front. The result is a system where competition happens at quote time and settlement happens against a verifier, not against a custodian.`;

const raw: Edition = {
  id: "sample-edition-2026-11-13",
  date: "2026-11-13",
  status: "published",
  stories: [
    {
      id: "sample-pitch-markets",
      pitch: {
        id: "sample-pitch-markets",
        agentId: "reporter-markets",
        headline:
          "BIS Critiques Stablecoins as Project Agorá Cuts Settlement to 80 Seconds",
        angle:
          "Contrast the BIS's structural critique of stablecoins with its own tokenized settlement experiment.",
        whyNow:
          "Project Agorá's July 2026 real-value testing produced a concrete 80-second settlement figure.",
        claims: marketsClaims,
        requestedFee: 0.35,
        wordCount: 302,
      },
      assignment: {
        pitchId: "sample-pitch-markets",
        agentId: "reporter-markets",
        beat: "markets",
        wordCount: 302,
        fee: 0.35,
      },
      draft: {
        assignmentId: "sample-pitch-markets",
        pitchId: "sample-pitch-markets",
        agentId: "reporter-markets",
        headline:
          "BIS Critiques Stablecoins as Project Agorá Cuts Settlement to 80 Seconds",
        dek: "The BIS identifies structural flaws in stablecoins while its own tokenization experiment achieves near-instant cross-border settlement.",
        bodyMarkdown: marketsBody,
        claims: marketsClaims,
        wordCount: 302,
      },
      factCheck: {
        draftId: "sample-pitch-markets",
        checks: marketsClaims.map((claim) => ({
          claim: claim.text,
          sourceId: claim.sourceId,
          verdict: "supported" as const,
          note: marketsCheckNotes[claim.sourceId] ?? "Supported by the curated source.",
        })),
        overall: "pass",
      },
    },
    {
      id: "sample-pitch-near",
      pitch: {
        id: "sample-pitch-near",
        agentId: "reporter-near",
        headline:
          "NEAR Intents: Competing Solvers, On-Chain Verification, and Zero-Account UX",
        angle:
          "Explain the quote market behind NEAR Intents and why account abstraction matters for onboarding.",
        whyNow:
          "The source pack documents the Message Bus, the Verifier, and wallet-derived accounts.",
        claims: nearClaims,
        requestedFee: 0.35,
        wordCount: 271,
      },
      assignment: {
        pitchId: "sample-pitch-near",
        agentId: "reporter-near",
        beat: "near",
        wordCount: 271,
        fee: 0.35,
      },
      draft: {
        assignmentId: "sample-pitch-near",
        pitchId: "sample-pitch-near",
        agentId: "reporter-near",
        headline:
          "NEAR Intents: Competing Solvers, On-Chain Verification, and Zero-Account UX",
        dek: "A quote market for outcomes, checked by a Verifier contract and open to users who never create a NEAR account.",
        bodyMarkdown: nearBody,
        claims: nearClaims,
        wordCount: 271,
      },
      factCheck: {
        draftId: "sample-pitch-near",
        checks: nearClaims.map((claim) => ({
          claim: claim.text,
          sourceId: claim.sourceId,
          verdict: "supported" as const,
          note: nearCheckNotes[claim.sourceId] ?? "Supported by the curated source.",
        })),
        overall: "pass",
      },
    },
  ],
  editorNote:
    "The BIS story leads with its high-impact 80-second settlement milestone and institutional weight. The NEAR piece follows, offering a strong technical counterpoint on user experience and solver competition.",
  selectionNote:
    "Two desks fit the budget. The AI desk's pitch was passed because the edition already had a strong technical counterpoint.",
  frontPageOrder: ["sample-pitch-markets", "sample-pitch-near"],
  pullQuote:
    "The test recorded an average time from payment initiation to settlement of approximately 80 seconds.",
  payouts: [],
  totalRevenue: 0,
  createdAt: "2026-11-13T07:30:00.000Z",
};

export const sampleEdition: Edition = editionSchema.parse(raw);
