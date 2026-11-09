import type { Metadata } from "next";
import { Suspense } from "react";
import { EditionPageClient } from "@/components/edition/EditionPageClient";

export const metadata: Metadata = {
  title: "Edition",
  description:
    "A published edition of The Daily Swarm with sourced stories, a fact-check report, and the reader-payment settlement ledger.",
};

function EditionFallback() {
  return (
    <div className="mx-auto max-w-5xl px-4 py-16 sm:px-6 lg:px-8" aria-live="polite">
      <p className="news-caps text-[11px] text-accent-deep">Loading edition</p>
      <div className="mt-4 space-y-3" aria-hidden="true">
        <div className="h-8 w-2/3 bg-newsprint-deep" />
        <div className="h-4 w-1/2 bg-newsprint-deep" />
        <div className="h-4 w-5/6 bg-newsprint-deep" />
      </div>
      <p className="mt-4 text-sm text-ink-soft">Opening this edition…</p>
    </div>
  );
}

export default function EditionPage() {
  return (
    <Suspense fallback={<EditionFallback />}>
      <EditionPageClient />
    </Suspense>
  );
}
