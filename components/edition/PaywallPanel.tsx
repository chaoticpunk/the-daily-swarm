"use client";

/* eslint-disable react-hooks/set-state-in-effect -- The wallet redirect can surface a transaction hash after mount; sync it into the manual-verification form. */

import { useEffect, useState } from "react";
import { READER_PRICE_NEAR, REVENUE_SHARES } from "@/lib/config";
import type { Edition } from "@/lib/types";
import type { PublicNearConfig } from "@/lib/api/types";
import { nearToYocto, formatPercent, shortAccount } from "@/lib/utils";
import { setPendingPayment, clearPendingPayment } from "@/lib/storage";
import { useNearWallet } from "@/components/edition/useNearWallet";

export type PaymentStage = "idle" | "verifying" | "settling" | "error" | "done";

export function PaywallPanel({
  edition,
  nearConfig,
  busy,
  stage,
  paymentError,
  onVerify,
  onRetrySettlement,
  canRetrySettlement,
  initialTxHash,
}: {
  edition: Edition;
  nearConfig: PublicNearConfig | null;
  busy: boolean;
  stage: PaymentStage;
  paymentError: string | null;
  onVerify: (txHash: string, senderAccountId: string) => Promise<void>;
  onRetrySettlement: () => Promise<void>;
  canRetrySettlement: boolean;
  initialTxHash?: string | null;
}) {
  const wallet = useNearWallet(nearConfig?.treasuryAccountId);
  const [manualHash, setManualHash] = useState(initialTxHash ?? "");
  const [manualSender, setManualSender] = useState("");
  const [manualError, setManualError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [showManual, setShowManual] = useState(Boolean(initialTxHash));

  useEffect(() => {
    if (initialTxHash) {
      setManualHash(initialTxHash);
      setShowManual(true);
    }
  }, [initialTxHash]);

  const treasury = nearConfig?.treasuryAccountId ?? "treasury.daily-swarm.testnet";

  async function handlePay() {
    setManualError(null);
    setActionError(null);
    if (!wallet.accountId) {
      wallet.connect();
      return;
    }
    try {
      setPendingPayment({
        editionId: edition.id,
        senderAccountId: wallet.accountId,
        startedAt: new Date().toISOString(),
      });
      const hash = await wallet.pay(nearToYocto(READER_PRICE_NEAR).toString());
      await onVerify(hash, wallet.accountId);
    } catch (error) {
      clearPendingPayment();
      setActionError(
        error instanceof Error
          ? error.message
          : "The wallet did not complete the payment.",
      );
    }
  }

  async function handleManualVerify(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setManualError(null);
    const hash = manualHash.trim();
    const sender = manualSender.trim() || wallet.accountId || "";
    if (!hash) {
      setManualError("Paste the transaction hash from your wallet.");
      return;
    }
    if (!sender) {
      setManualError("Enter the NEAR testnet account that signed the payment.");
      return;
    }
    await onVerify(hash, sender);
  }

  return (
    <aside
      aria-labelledby="paywall-heading"
      className="paper-panel border-2 border-ink p-0"
    >
      <div className="border-b-2 border-dashed border-rule bg-ink px-5 py-4 text-newsprint">
        <p className="news-caps text-[9px] text-gold">Reader access</p>
        <h2 id="paywall-heading" className="font-headline mt-1 text-2xl font-bold">
          Unlock the edition
        </h2>
        <p className="mt-2 text-xs leading-relaxed text-newsprint/75">
          One payment unlocks both stories, the fact-check reports, and the public
          payout ledger.
        </p>
      </div>

      <div className="px-5 py-4">
        <div className="flex items-end justify-between border-b border-rule pb-3">
          <p className="font-headline text-4xl font-bold leading-none">
            {READER_PRICE_NEAR}
            <span className="ml-1 text-sm font-normal">NEAR</span>
          </p>
          <p className="text-right text-[10px] leading-tight text-ink-soft">
            testnet only
            <br />
            no real money
          </p>
        </div>

        <p className="mt-3 text-[11px] leading-relaxed text-ink-soft">
          Reader revenue is split by fixed shares: {formatPercent(REVENUE_SHARES.reporters)}{" "}
          reporters, {formatPercent(REVENUE_SHARES.editor)} editor,{" "}
          {formatPercent(REVENUE_SHARES.factChecker)} fact-checker,{" "}
          {formatPercent(REVENUE_SHARES.treasury)} treasury. The treasury absorbs
          rounding.
        </p>

        <div className="mt-4">
          {wallet.accountId ? (
            <div className="flex flex-wrap items-center justify-between gap-2 border border-rule bg-newsprint px-3 py-2">
              <div>
                <p className="news-caps text-[8px] text-ink-soft">Connected reader</p>
                <p className="ledger-num mt-1 text-[11px]" title={wallet.accountId}>
                  {shortAccount(wallet.accountId, 16, 6)}
                </p>
              </div>
              <button
                type="button"
                onClick={wallet.connect}
                className="news-caps border border-ink px-2 py-1.5 text-[8px] hover:border-accent hover:text-accent-deep"
              >
                Change wallet
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={wallet.connect}
              disabled={busy}
              className="news-caps w-full bg-accent px-4 py-3 text-[10px] text-white transition-colors hover:bg-accent-deep disabled:cursor-not-allowed disabled:bg-newsprint-deep disabled:text-ink-soft"
            >
              {wallet.status === "loading"
                ? "Starting NEAR wallet…"
                : "Connect NEAR testnet wallet"}
            </button>
          )}

          {wallet.error ? (
            <p className="mt-2 text-[10px] leading-relaxed text-accent-deep">
              {wallet.error}
            </p>
          ) : null}

          {wallet.accountId ? (
            <button
              type="button"
              onClick={() => void handlePay()}
              disabled={busy || wallet.isPaying}
              className="news-caps mt-3 w-full bg-ink px-4 py-3 text-[10px] text-newsprint transition-colors hover:bg-accent-deep disabled:cursor-not-allowed disabled:bg-newsprint-deep disabled:text-ink-soft"
            >
              {busy
                ? stage === "verifying"
                  ? "Verifying on-chain…"
                  : "Settling the split…"
                : `Pay ${READER_PRICE_NEAR} NEAR and unlock`}
            </button>
          ) : (
            <p className="mt-3 border-t border-rule-soft pt-3 text-[10px] leading-relaxed text-ink-soft">
              Connect a NEAR testnet wallet to pay. The wallet will ask you to send{" "}
              {READER_PRICE_NEAR} testnet NEAR to the treasury; the edition unlocks
              only after the server verifies the final transaction.
            </p>
          )}

          <p className="mt-2 text-[9px] leading-relaxed text-ink-soft">
            Payment settles to{" "}
            <span className="ledger-num" title={treasury}>
              {shortAccount(treasury)}
            </span>{" "}
            on NEAR testnet. The edition unlocks after NEAR confirms the transfer.
          </p>
          {actionError ? (
            <p role="alert" className="mt-2 text-[10px] leading-relaxed text-accent-deep">
              {actionError}
            </p>
          ) : null}
        </div>

        {paywallStatus(stage, paymentError, busy)}

        <div className="mt-4 border-t border-rule-soft pt-3">
          <button
            type="button"
            aria-expanded={showManual}
            onClick={() => setShowManual((value) => !value)}
            className="news-caps text-[9px] text-ink-soft underline decoration-rule hover:text-accent-deep"
          >
            {showManual ? "Hide transfer verification" : "Already paid? Verify a transfer"}
          </button>

          {showManual ? (
            <form onSubmit={handleManualVerify} className="mt-3 space-y-2">
              <div>
                <label htmlFor="manual-tx" className="news-caps text-[8px] text-ink-soft">
                  Transaction hash
                </label>
                <input
                  id="manual-tx"
                  name="txHash"
                  value={manualHash}
                  onChange={(event) => setManualHash(event.target.value)}
                  placeholder="43–44 character NEAR tx hash"
                  autoComplete="off"
                  spellCheck={false}
                  className="ledger-num mt-1 w-full border border-rule bg-white/70 px-2 py-2 text-[11px] focus:border-accent focus:outline-none"
                />
              </div>
              <div>
                <label htmlFor="manual-sender" className="news-caps text-[8px] text-ink-soft">
                  Sender account
                </label>
                <input
                  id="manual-sender"
                  name="senderAccountId"
                  value={manualSender || wallet.accountId || ""}
                  onChange={(event) => setManualSender(event.target.value)}
                  placeholder="reader.testnet"
                  autoComplete="off"
                  spellCheck={false}
                  className="ledger-num mt-1 w-full border border-rule bg-white/70 px-2 py-2 text-[11px] focus:border-accent focus:outline-none"
                />
              </div>
              <button
                type="submit"
                disabled={busy}
                className="news-caps w-full border border-ink px-3 py-2 text-[9px] hover:border-accent hover:text-accent-deep disabled:cursor-not-allowed disabled:opacity-50"
              >
                Verify payment
              </button>
              {manualError ? (
                <p role="alert" className="text-[10px] leading-relaxed text-accent-deep">
                  {manualError}
                </p>
              ) : null}
            </form>
          ) : null}
        </div>

        {canRetrySettlement ? (
          <div className="mt-4 border-l-2 border-gold bg-gold/10 p-3">
            <p className="news-caps text-[9px]">Payment verified · settlement incomplete</p>
            <p className="mt-1 text-[10px] leading-relaxed text-ink-soft">
              The edition is unlocked. You can retry the payout split without paying
              again.
            </p>
            <button
              type="button"
              onClick={() => void onRetrySettlement()}
              disabled={busy}
              className="news-caps mt-2 border border-ink px-3 py-2 text-[9px] hover:border-accent hover:text-accent-deep disabled:opacity-50"
            >
              Retry settlement
            </button>
          </div>
        ) : null}
      </div>

      <div className="border-t border-rule bg-newsprint-deep px-5 py-3">
        <p className="news-caps text-[8px] text-ink-soft">
          Demo edition · curated sources · testnet only
        </p>
      </div>
    </aside>
  );
}

function paywallStatus(
  stage: PaymentStage,
  error: string | null,
  busy: boolean,
) {
  if (stage === "idle" && !error) return null;
  if (stage === "done") {
    return (
      <p
        role="status"
        className="mt-3 border-l-2 border-success bg-success/5 px-3 py-2 text-[10px] leading-relaxed text-success"
      >
        Payment verified on NEAR testnet. The edition is unlocked.
      </p>
    );
  }
  if (stage === "error") {
    return (
      <p
        role="alert"
        className="mt-3 border-l-2 border-accent bg-accent/5 px-3 py-2 text-[10px] leading-relaxed text-accent-deep"
      >
        {error ?? "Payment verification failed. The edition stays locked."}
      </p>
    );
  }
  if (busy) {
    return (
      <p
        aria-live="polite"
        className="mt-3 border-l-2 border-gold bg-gold/10 px-3 py-2 text-[10px] leading-relaxed"
      >
        {stage === "verifying"
          ? "Checking the transaction against NEAR RPC. This can take a few seconds."
          : "The payment is confirmed. The treasury is signing the deterministic split."}
      </p>
    );
  }
  return null;
}
