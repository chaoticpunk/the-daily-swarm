import { Suspense } from "react";
import Link from "next/link";
import { SITE } from "@/lib/config";
import { getDemoEditionDate } from "@/lib/content/pack";
import { shortDateLabel } from "@/lib/utils";
import { NavLinks, NavLinksFallback } from "@/components/site/NavLinks";

export function Masthead() {
  const editionDate = getDemoEditionDate();

  return (
    <header className="border-b-2 border-ink">
      <div className="mx-auto max-w-[1500px] px-4 sm:px-6 lg:px-8">
        <div className="flex flex-wrap items-center justify-between gap-x-6 gap-y-1 border-b border-rule-soft py-2">
          <p className="news-caps text-[10px] text-ink-soft">Vol. I · No. 1</p>
          <p className="news-caps text-[10px] text-ink-soft">
            Edition of {shortDateLabel(editionDate)}
          </p>
          <p className="news-caps text-[10px] text-ink-soft">NEAR testnet</p>
        </div>

        <div className="border-b border-rule-soft py-6 text-center sm:py-8">
          <p className="news-caps text-accent">A working newsroom, with its books open</p>
          <h1 className="mt-2">
            <Link
              href="/"
              className="font-headline text-[2.7rem] leading-[0.95] font-bold tracking-[-0.03em] text-ink sm:text-6xl lg:text-7xl"
            >
              {SITE.name}
            </Link>
          </h1>
          <p className="news-caps mt-3 text-[10px] text-ink-soft sm:text-[11px]">
            {SITE.demoLabel}
          </p>
        </div>

        <Suspense fallback={<NavLinksFallback />}>
          <NavLinks />
        </Suspense>
      </div>
    </header>
  );
}
