"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export const NAV_ITEMS = [
  { href: "/explore", label: "App-Explorer", match: ["/explore", "/app/"] },
  { href: "/charts", label: "Rankings", match: ["/charts"] },
];

const base = "rounded-lg px-3 py-2 text-sm font-medium";

/** Plain links: the prerendered fallback while the pathname is unknown. */
export function StaticNav() {
  return (
    <nav className="flex gap-1 md:flex-col">
      {NAV_ITEMS.map((item) => (
        <Link key={item.href} href={item.href} className={`${base} text-muted hover:bg-surface-2 hover:text-text`}>
          {item.label}
        </Link>
      ))}
    </nav>
  );
}

export function Nav() {
  const pathname = usePathname();
  return (
    <nav className="flex gap-1 md:flex-col">
      {NAV_ITEMS.map((item) => {
        const active = item.match.some((prefix) => pathname.startsWith(prefix));
        return (
          <Link
            key={item.href}
            href={item.href}
            aria-current={active ? "page" : undefined}
            className={`${base} ${active ? "bg-primary-soft text-primary" : "text-muted hover:bg-surface-2 hover:text-text"}`}
          >
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
