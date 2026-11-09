"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const LINKS = [
  { href: "/", label: "Front page" },
  { href: "/sample", label: "Sample edition" },
  { href: "/newsroom", label: "Newsroom" },
  { href: "/ledger", label: "Ledger" },
  { href: "/about", label: "Product" },
] as const;

function NavLinksView({ pathname }: { pathname: string | null }) {
  return (
    <nav aria-label="Primary" className="scroll-x border-t border-rule">
      <ul className="flex min-w-max items-stretch justify-center gap-1 py-1 sm:gap-2">
        {LINKS.map((link) => {
          const active =
            pathname !== null &&
            (link.href === "/"
              ? pathname === "/"
              : pathname === link.href || pathname.startsWith(`${link.href}/`));
          return (
            <li key={link.href}>
              <Link
                href={link.href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "news-caps inline-flex items-center gap-2 px-3 py-2 transition-colors sm:px-5",
                  active
                    ? "text-ink underline decoration-accent decoration-[3px] underline-offset-[7px]"
                    : "text-ink-soft hover:text-accent-deep",
                )}
              >
                {link.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

export function NavLinks() {
  const pathname = usePathname();
  return <NavLinksView pathname={pathname} />;
}

export function NavLinksFallback() {
  return <NavLinksView pathname={null} />;
}
