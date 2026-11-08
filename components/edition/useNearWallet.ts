"use client";

/* eslint-disable react-hooks/set-state-in-effect -- Wallet-selector setup is browser-only and must run after mount. */

import { useCallback, useEffect, useRef, useState } from "react";
import type { Subscription, WalletSelector } from "@near-wallet-selector/core";
import type { WalletSelectorModal } from "@near-wallet-selector/modal-ui";

type WalletStatus = "idle" | "loading" | "ready" | "error";

export interface NearWallet {
  status: WalletStatus;
  accountId: string | null;
  error: string | null;
  connect: () => void;
  pay: (amountYocto: string) => Promise<string>;
  isPaying: boolean;
}

export function useNearWallet(treasuryAccountId: string | undefined): NearWallet {
  const selectorRef = useRef<WalletSelector | null>(null);
  const modalRef = useRef<WalletSelectorModal | null>(null);
  const [status, setStatus] = useState<WalletStatus>("idle");
  const [accountId, setAccountId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPaying, setIsPaying] = useState(false);

  useEffect(() => {
    if (!treasuryAccountId) return;
    let cancelled = false;
    const subscriptions: Subscription[] = [];

    setStatus("loading");
    setError(null);

    (async () => {
      try {
        const [{ setupWalletSelector }, { setupMyNearWallet }, { setupModal }] =
          await Promise.all([
            import("@near-wallet-selector/core"),
            import("@near-wallet-selector/my-near-wallet"),
            import("@near-wallet-selector/modal-ui"),
          ]);

        const selector = await setupWalletSelector({
          network: "testnet",
          languageCode: "en",
          modules: [
            setupMyNearWallet({
              walletUrl: "https://testnet.mynearwallet.com",
            }),
          ],
        });
        const modal = setupModal(selector, {
          theme: "light",
          description: "The Daily Swarm · NEAR testnet reader",
        });

        if (cancelled) return;
        selectorRef.current = selector;
        modalRef.current = modal;

        const activeAccounts = selector.store.getState().accounts;
        const active =
          activeAccounts.find((account) => account.active) ?? activeAccounts[0];
        setAccountId(active?.accountId ?? null);
        setStatus("ready");

        subscriptions.push(
          selector.on("signedIn", (event) => {
            setAccountId(event.accounts[0]?.accountId ?? null);
            setError(null);
            modal.hide();
          }),
        );
        subscriptions.push(
          selector.on("signedOut", () => {
            setAccountId(null);
          }),
        );
        subscriptions.push(
          selector.on("accountsChanged", (event) => {
            setAccountId(event.accounts[0]?.accountId ?? null);
          }),
        );
      } catch {
        if (cancelled) return;
        setStatus("error");
        setError(
          "Could not initialise the NEAR wallet selector in this browser. You can still verify a testnet transaction manually below.",
        );
      }
    })();

    return () => {
      cancelled = true;
      for (const subscription of subscriptions) subscription.remove();
    };
  }, [treasuryAccountId]);

  const connect = useCallback(() => {
    if (modalRef.current) {
      modalRef.current.show();
    } else {
      setError(
        "The wallet selector is not ready yet. Wait a moment, or verify a transaction manually below.",
      );
    }
  }, []);

  const pay = useCallback(
    async (amountYocto: string): Promise<string> => {
      const selector = selectorRef.current;
      if (!selector) {
        throw new Error("The wallet selector is not ready yet.");
      }
      if (!accountId) {
        throw new Error("Connect a NEAR testnet wallet before paying.");
      }
      if (!treasuryAccountId) {
        throw new Error("The treasury account is not configured.");
      }

      setIsPaying(true);
      setError(null);
      try {
        const { actionCreators } = await import("@near-wallet-selector/core");
        const wallet = await selector.wallet();
        const outcome = await wallet.signAndSendTransaction({
          signerId: accountId,
          receiverId: treasuryAccountId,
          actions: [actionCreators.transfer(BigInt(amountYocto))],
        });
        const hash =
          (outcome as unknown as { transaction_outcome?: { id?: string } })
            ?.transaction_outcome?.id ??
          (outcome as unknown as { transaction?: { hash?: string } })?.transaction
            ?.hash ??
          "";
        if (!hash) {
          throw new Error(
            "The wallet did not return a transaction hash. If you completed the payment, verify the hash manually below.",
          );
        }
        return hash;
      } finally {
        setIsPaying(false);
      }
    },
    [accountId, treasuryAccountId],
  );

  return { status, accountId, error, connect, pay, isPaying };
}
