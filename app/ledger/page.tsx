import type { Metadata } from "next";
import { LedgerPageClient } from "@/components/ledger/LedgerPageClient";

export const metadata: Metadata = {
  title: "Ledger",
  description:
    "Reader payments and contributor payouts from The Daily Swarm, with NEAR testnet transaction hashes and explorer links.",
};

export default function LedgerPage() {
  return <LedgerPageClient />;
}
