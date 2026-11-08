"use client";

/* eslint-disable react-hooks/set-state-in-effect -- The edition archive and wallet redirect state live in the browser, so they are read after mount to avoid SSR/hydration mismatches. */

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { LedgerTable } from "@/components/ledger/LedgerTable";
import { PaywallPanel, type PaymentStage } from "@/components/edition/PaywallPanel";
import { PaymentReceipt } from "@/components/edition/PaymentReceipt";
import { StoryArticle } from "@/components/edition/StoryArticle";
import { READER_PRICE_NEAR, SITE } from "@/lib/config";
import type { Edition, LedgerEntry } from "@/lib/types";
import type {
  HealthApiResponse,
  PayoutApiResponse,
  PublicNearConfig,
  VerifyPaymentApiResponse,
} from "@/lib/api/types";
import {
  clearPendingPayment,
  getEdition,
  getPendingPayment,
  saveEdition,
} from "@/lib/storage";
import {
  editionDateLabel,
  formatNear,
  shortAccount,
  shortDateLabel,
} from "@/lib/utils";

type PageState = "loading" | "ready" | "missing";

class RequestError extends Error {
  readonly code: string;
  constructor(message: string, code = "REQUEST_FAILED") {
    super(message);
    this.name = "RequestError";
    this.code = code;
  }
}

async function postJson<T>(url: string, body: unknown): Promise<T> {
  let response: Response;
  try {
    response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
      cache: "no-store",
    });
  } catch {
    throw new RequestError(
      "Could not reach the server. Check your connection and retry.",
      "NETWORK_ERROR",
    );
  }
  const payload = (await response.json().catch(() => null)) as
    | T
    | { error?: { message?: string; code?: string } }
    | null;
  if (!response.ok) {
    const error =
      payload && typeof payload === "object" && "error" in payload
        ? payload.error
        : undefined;
    throw new RequestError(
      error?.message ?? `The server returned HTTP ${response.status}.`,
      error?.code ?? `HTTP_${response.status}`,
    );
  }
  if (!payload) {
    throw new RequestError("The server returned an empty response.");
  }
  return payload as T;
}

function errorMessage(error: unknown): string {
  return error instanceof Error
    ? error.message
    : "An unexpected payment error occurred.";
}

export function EditionPageClient() {
  const params = useParams();
  const rawId = params?.id;
  const id = Array.isArray(rawId) ? rawId[0] : (rawId ?? "");

  const [pageState, setPageState] = useState<PageState>("loading");
  const [edition, setEdition] = useState<Edition | null>(null);
  const [nearConfig, setNearConfig] = useState<PublicNearConfig | null>(null);
  const [busy, setBusy] = useState(false);
  const [stage, setPaymentStage] = useState<PaymentStage>("idle");
  const [paymentError, setPaymentError] = useState<string | null>(null);
  const [settlementError, setSettlementError] = useState<string | null>(null);
  const [payoutNotice, setPayoutNotice] = useState<string | null>(null);
  const [returnedTxHash, setReturnedTxHash] = useState<string | null>(null);
  const [pendingNotice, setPendingNotice] = useState<string | null>(null);
  const [storageWarning, setStorageWarning] = useState<string | null>(null);
  const autoVerifyRef = useRef(false);

  useEffect(() => {
    if (!id) {
      setPageState("missing");
      return;
    }
    const found = getEdition(id);
    if (!found) {
      setPageState("missing");
      return;
    }
    setEdition(found);
    setPageState("ready");

    if (found.status !== "paid") {
      const pending = getPendingPayment();
      if (pending?.editionId === found.id) {
        setPendingNotice(
          "A wallet payment was started in this browser. If the wallet returned here, confirm the sender account below; if you already paid, paste the transaction hash.",
        );
      }
      const search = new URLSearchParams(window.location.search);
      const walletError = search.get("errorCode") ?? search.get("errorMessage");
      if (walletError) {
        setPendingNotice(
          `The wallet returned an error: ${search.get("errorMessage") ?? walletError}. No payment was recorded.`,
        );
      }
      const hash = search.get("transactionHashes")?.split(",")[0]?.trim();
      if (hash && !walletError) setReturnedTxHash(hash);
    }
  }, [id]);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/health", { cache: "no-store" })
      .then(async (response) => {
        const data = (await response.json().catch(() => null)) as
          | HealthApiResponse
          | null;
        if (!cancelled && data?.near) setNearConfig(data.near);
      })
      .catch(() => {
        // Manual verification still works through the server config.
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const verifyAndSettle = useCallback(
    async (txHash: string, senderAccountId: string) => {
      if (!edition || busy) return;
      setBusy(true);
      setPaymentError(null);
      setSettlementError(null);
      setPaymentStage("verifying");

      try {
        const verified = await postJson<VerifyPaymentApiResponse>(
          "/api/near/verify-payment",
          {
            txHash,
            senderAccountId,
            editionId: edition.id,
          },
        );

        const paidEdition: Edition = {
          ...edition,
          status: "paid",
          readerPayment: verified.payment,
          totalRevenue: READER_PRICE_NEAR,
        };
        setEdition(paidEdition);
        const saved = saveEdition(paidEdition);
        if (!saved) {
          setStorageWarning(
            "The payment is verified, but this browser could not save the updated edition. Keep this tab open.",
          );
        }
        clearPendingPayment();
        setPendingNotice(null);
        setPaymentStage("settling");

        try {
          const payout = await postJson<PayoutApiResponse>("/api/near/payout", {
            editionId: paidEdition.id,
            readerTxHash: txHash,
            senderAccountId,
            assignments: paidEdition.stories.map((story) => story.assignment),
          });
          const settled: Edition = {
            ...paidEdition,
            readerPayment: payout.payment ?? paidEdition.readerPayment,
            payouts: payout.payouts,
          };
          setEdition(settled);
          saveEdition(settled);
          setPaymentStage("done");
          if (!payout.configured) {
            setPayoutNotice(
              payout.reason ??
                "Treasury payouts are not configured. The split is local accounting only, not on-chain.",
            );
          }
          const failed = payout.payouts.filter((entry) => entry.status === "failed");
          if (failed.length > 0) {
            setSettlementError(
              `${failed.length} payout transfer${failed.length === 1 ? "" : "s"} failed. Failed entries are never marked confirmed.`,
            );
          }
        } catch (error) {
          setPaymentStage("done");
          setSettlementError(errorMessage(error));
        }
      } catch (error) {
        setPaymentStage("error");
        setPaymentError(errorMessage(error));
      } finally {
        setBusy(false);
        if (typeof window !== "undefined") {
          window.history.replaceState({}, "", window.location.pathname);
        }
      }
    },
    [edition, busy],
  );

  const retrySettlement = useCallback(async () => {
    if (!edition?.readerPayment?.txHash || busy) return;
    setBusy(true);
    setSettlementError(null);
    setPaymentStage("settling");
    try {
      const payout = await postJson<PayoutApiResponse>("/api/near/payout", {
        editionId: edition.id,
        readerTxHash: edition.readerPayment.txHash,
        senderAccountId: edition.readerPayment.from,
        assignments: edition.stories.map((story) => story.assignment),
      });
      const settled: Edition = {
        ...edition,
        readerPayment: payout.payment ?? edition.readerPayment,
        payouts: payout.payouts,
      };
      setEdition(settled);
      saveEdition(settled);
      setPaymentStage("done");
      if (!payout.configured) {
        setPayoutNotice(
          payout.reason ??
            "Treasury payouts are not configured. The split is local accounting only, not on-chain.",
        );
      }
      const failed = payout.payouts.filter((entry) => entry.status === "failed");
      if (failed.length > 0) {
        setSettlementError(
          `${failed.length} payout transfer${failed.length === 1 ? "" : "s"} failed. Failed entries are never marked confirmed.`,
        );
      }
    } catch (error) {
      setPaymentStage("done");
      setSettlementError(errorMessage(error));
    } finally {
      setBusy(false);
    }
  }, [edition, busy]);

  useEffect(() => {
    if (!edition || edition.status === "paid" || !returnedTxHash) return;
    if (autoVerifyRef.current) return;

    const search = new URLSearchParams(window.location.search);
    const pending = getPendingPayment();
    const sender =
      pending?.editionId === edition.id
        ? pending.senderAccountId
        : (search.get("account_id") ?? "");

    if (!sender) {
      setPendingNotice(
        "The wallet returned a transaction hash without a sender account. Paste the transaction hash and sender account below to verify it.",
      );
      return;
    }

    autoVerifyRef.current = true;
    void verifyAndSettle(returnedTxHash, sender);
  }, [edition, returnedTxHash, verifyAndSettle]);

  if (pageState === "loading") {
    return (
      <div className="mx-auto max-w-5xl px-4 py-16 sm:px-6 lg:px-8" aria-live="polite">
        <p className="news-caps text-[10px] text-accent-deep">Loading edition</p>
        <div className="mt-4 space-y-3" aria-hidden="true">
          <div className="h-8 w-2/3 bg-newsprint-deep" />
          <div className="h-4 w-1/2 bg-newsprint-deep" />
          <div className="h-4 w-5/6 bg-newsprint-deep" />
        </div>
        <p className="mt-4 text-sm text-ink-soft">Reading this browser&apos;s archive…</p>
      </div>
    );
  }

  if (pageState === "missing" || !edition) {
    return <MissingEdition id={id} />;
  }

  const unlocked = edition.status === "paid";
  const orderedStories = edition.frontPageOrder
    .map((storyId) => edition.stories.find((story) => story.id === storyId))
    .filter((story): story is NonNullable<typeof story> => Boolean(story));
  const stories =
    orderedStories.length === edition.stories.length
      ? orderedStories
      : edition.stories;
  const entries: LedgerEntry[] = [
    ...(edition.readerPayment ? [edition.readerPayment] : []),
    ...edition.payouts,
  ];
  const totalWords = stories.reduce(
    (total, story) => total + (story.revisedDraft ?? story.draft).wordCount,
    0,
  );
  const sourceIds = new Set(
    stories.flatMap((story) =>
      (story.revisedDraft ?? story.draft).claims.map((claim) => claim.sourceId),
    ),
  );
  const assignmentFees = stories.reduce(
    (total, story) => total + story.assignment.fee,
    0,
  );
  const canRetrySettlement =
    edition.payouts.length === 0 ||
    edition.payouts.every((entry) => entry.status === "failed");

  return (
    <div className="mx-auto max-w-[1500px] px-4 sm:px-6 lg:px-8">
      <header className="border-b-2 border-ink py-7">
        <div className="flex flex-wrap items-center justify-between gap-x-6 gap-y-2 border-b border-rule-soft pb-3">
          <p className="news-caps text-[10px] text-ink-soft">
            {editionDateLabel(edition.date)}
          </p>
          <p className="news-caps text-[9px] text-ink-soft">{SITE.demoLabel}</p>
          <p
            className={
              unlocked
                ? "news-caps bg-success/10 px-2 py-1 text-[9px] text-success"
                : "news-caps bg-gold/30 px-2 py-1 text-[9px] text-ink"
            }
            role="status"
          >
            {unlocked ? "Paid · unlocked" : "Published · locked"}
          </p>
        </div>

        <div className="mt-5 grid gap-5 lg:grid-cols-12 lg:items-end">
          <div className="lg:col-span-8">
            <p className="news-caps text-[10px] text-accent-deep">
              Edition · curated sources
            </p>
            <h1 className="font-headline mt-2 text-4xl leading-[0.98] font-bold tracking-tight sm:text-5xl lg:text-6xl">
              The {shortDateLabel(edition.date)} edition.
            </h1>
            <p className="mt-3 max-w-2xl text-sm leading-relaxed text-ink-soft">
              Three desks pitched. The editor commissioned two, with{" "}
              {formatNear(assignmentFees)} NEAR in commissions, and set the front
              page. Every claim below was checked against the curated source pack.
            </p>
            {!unlocked ? (
              <a
                href="#unlock"
                className="news-caps mt-4 inline-flex bg-ink px-4 py-2.5 text-[10px] text-newsprint hover:bg-accent-deep"
              >
                Unlock with {READER_PRICE_NEAR} testnet NEAR ↓
              </a>
            ) : null}
          </div>
          <dl className="grid grid-cols-2 gap-x-4 gap-y-2 border-t border-rule pt-4 sm:grid-cols-4 lg:col-span-4 lg:border-l lg:border-t-0 lg:pl-5">
            {[
              ["Stories", String(stories.length)],
              ["Words", String(totalWords)],
              ["Sources", String(sourceIds.size)],
              ["Fees", `${formatNear(assignmentFees)} NEAR`],
            ].map(([label, value]) => (
              <div key={label}>
                <dt className="news-caps text-[8px] text-ink-soft">{label}</dt>
                <dd className="ledger-num mt-1 text-sm">{value}</dd>
              </div>
            ))}
          </dl>
        </div>
      </header>

      {storageWarning ? (
        <p
          role="alert"
          className="mt-4 border-l-4 border-gold bg-gold/15 px-4 py-3 text-xs leading-relaxed"
        >
          {storageWarning}
        </p>
      ) : null}

      {pendingNotice ? (
        <p
          role="status"
          className="mt-4 border-l-4 border-gold bg-gold/15 px-4 py-3 text-xs leading-relaxed"
        >
          {pendingNotice}
        </p>
      ) : null}

      <section
        aria-labelledby="editors-note-heading"
        className="grid gap-6 border-b border-rule py-7 lg:grid-cols-12"
      >
        <div className="lg:col-span-8">
          <p className="news-caps text-[10px] text-accent-deep">Editor&apos;s note</p>
          <h2 id="editors-note-heading" className="sr-only">
            Editor&apos;s note
          </h2>
          <p className="font-headline mt-2 max-w-3xl text-xl leading-snug sm:text-2xl">
            {edition.editorNote}
          </p>
          {edition.pullQuote ? (
            <blockquote className="mt-4 border-l-2 border-accent pl-3">
              <p className="font-headline text-lg leading-snug font-bold italic sm:text-xl">
                “{edition.pullQuote}”
              </p>
            </blockquote>
          ) : null}
        </div>
        <div className="lg:col-span-4 lg:border-l lg:border-rule lg:pl-5">
          <p className="news-caps text-[9px] text-ink-soft">Front page order</p>
          <ol className="mt-2 space-y-2">
            {stories.map((story, index) => (
              <li key={story.id} className="flex gap-3 text-xs">
                <span className="ledger-num text-accent-deep">
                  {String(index + 1).padStart(2, "0")}
                </span>
                <span className="font-semibold leading-snug">
                  {(story.revisedDraft ?? story.draft).headline}
                </span>
              </li>
            ))}
          </ol>
          <p className="mt-3 text-[10px] text-ink-soft">
            Reported, written, checked, and laid out by autonomous desks. Curated
            sources only.
          </p>
        </div>
      </section>

      <div className="grid gap-8 py-8 lg:grid-cols-12 lg:gap-7">
        <div className="min-w-0 lg:col-span-8">
          <div className="space-y-10">
            {stories.map((story, index) => (
              <StoryArticle
                key={story.id}
                story={story}
                unlocked={unlocked}
                order={index + 1}
              />
            ))}
          </div>

          <section
            id="edition-ledger"
            className="mt-10 scroll-mt-6 border-t-2 border-ink pt-6"
            aria-labelledby="edition-ledger-heading"
          >
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <div>
                <p className="news-caps text-[10px] text-accent-deep">Public ledger</p>
                <h2
                  id="edition-ledger-heading"
                  className="font-headline mt-1 text-2xl font-bold"
                >
                  This edition&apos;s settlement
                </h2>
              </div>
              <p className="ledger-num text-[10px] text-ink-soft">
                {entries.length} {entries.length === 1 ? "entry" : "entries"}
              </p>
            </div>

            {entries.length > 0 ? (
              <div className="mt-4">
                <LedgerTable entries={entries} />
              </div>
            ) : (
              <div className="paper-inset mt-4 p-5">
                <p className="font-headline text-lg">
                  No ledger entries yet.
                </p>
                <p className="mt-1 text-sm leading-relaxed text-ink-soft">
                  The reader payment and the contributor payout split appear here after the
                  edition is unlocked. Nothing is written to the ledger before an
                  on-chain payment is verified.
                </p>
              </div>
            )}

            <p className="mt-3 text-[10px] leading-relaxed text-ink-soft">
              The reader pays{" "}
              {edition.readerPayment
                ? `${formatNear(edition.readerPayment.amount)} NEAR`
                : `${READER_PRICE_NEAR} NEAR`}{" "}
              to{" "}
              <span
                className="ledger-num"
                title={edition.readerPayment?.to ?? nearConfig?.treasuryAccountId}
              >
                {shortAccount(
                  edition.readerPayment?.to ??
                    nearConfig?.treasuryAccountId ??
                    "treasury.daily-swarm.testnet",
                )}
              </span>
              . Entries marked local are accounting only and are never presented as
              on-chain transfers.
            </p>
          </section>
        </div>

        <aside id="unlock" className="min-w-0 scroll-mt-6 lg:col-span-4">
          <div className="space-y-4 lg:sticky lg:top-4">
            {unlocked ? (
              <PaymentReceipt
                edition={edition}
                settlementError={settlementError}
                payoutNotice={payoutNotice}
                busy={busy}
                onRetry={() => void retrySettlement()}
                canRetry={canRetrySettlement}
              />
            ) : (
              <>
                <PaywallPanel
                  edition={edition}
                  nearConfig={nearConfig}
                  busy={busy}
                  stage={stage}
                  paymentError={paymentError}
                  onVerify={verifyAndSettle}
                  onRetrySettlement={retrySettlement}
                  canRetrySettlement={false}
                  initialTxHash={returnedTxHash}
                />
                <div className="paper-inset p-4">
                  <p className="news-caps text-[9px] text-ink-soft">
                    What unlocks
                  </p>
                  <ul className="mt-2 space-y-1.5 text-xs leading-relaxed text-ink-soft">
                    <li>Both full stories and the editor&apos;s front page.</li>
                    <li>The fact-check report for every claim.</li>
                    <li>Every source link used by the desks.</li>
                    <li>The reader payment and the full settlement ledger.</li>
                  </ul>
                </div>
              </>
            )}
          </div>
        </aside>
      </div>
    </div>
  );
}

function MissingEdition({ id }: { id: string }) {
  return (
    <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6 lg:px-8">
      <p className="news-caps text-[10px] text-accent-deep">Edition not found</p>
      <h1 className="font-headline mt-3 text-4xl leading-tight font-bold">
        This edition is not in this browser&apos;s archive.
      </h1>
      <p className="mt-4 text-sm leading-relaxed text-ink-soft">
        The MVP has no database: editions and ledger rows are saved in the browser
        that ran them. That keeps the demo honest about what is on-chain and what is
        local, but it means a shared link does not carry the edition with it.
      </p>
      <p className="ledger-num mt-3 text-xs text-ink-soft">Requested id: {id || "—"}</p>
      <div className="mt-6 flex flex-wrap gap-3">
        <Link
          href="/newsroom"
          className="news-caps bg-ink px-5 py-3 text-[10px] text-newsprint hover:bg-accent-deep"
        >
          Produce today&apos;s edition
        </Link>
        <Link
          href="/ledger"
          className="news-caps border border-ink px-5 py-3 text-[10px] hover:border-accent hover:text-accent-deep"
        >
          View the ledger
        </Link>
      </div>
      <p className="mt-6 border-t border-rule pt-4 text-xs leading-relaxed text-ink-soft">
        In a live demo, run the edition in this browser first, then open it from the
        newsroom. No results are fabricated to fill a missing link.
      </p>
    </div>
  );
}
