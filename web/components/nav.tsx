"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export const NAV_ITEMS = [
  { href: "/explore", label: "App-Explorer", match: ["/explore", "/app/"] },
  { href: "/feed", label: "Feed", match: ["/feed"] },
  { href: "/rising", label: "Aufsteiger", match: ["/rising"] },
  { href: "/publishers", label: "Publisher", match: ["/publishers"] },
  { href: "/charts", label: "Rankings", match: ["/charts"] },
  { href: "/methodik", label: "Methodik", match: ["/methodik"] },
];

const base = "shrink-0 whitespace-nowrap rounded-lg px-3 py-2 text-sm font-medium";

/** Plain links: the prerendered fallback while the pathname is unknown. */
export function StaticNav() {
  return (
    <nav className="-mx-4 flex gap-1 overflow-x-auto px-4 md:mx-0 md:flex-col md:overflow-visible md:px-0">
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
    <nav className="-mx-4 flex gap-1 overflow-x-auto px-4 md:mx-0 md:flex-col md:overflow-visible md:px-0">
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
