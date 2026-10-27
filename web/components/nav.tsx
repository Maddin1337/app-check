"use client";

import { BarChart3, BookOpen, Building2, LayoutGrid, Rss, TrendingUp, type LucideIcon } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

type Item = { href: string; label: string; icon: LucideIcon; match: string[] };

export const NAV_GROUPS: { title: string; items: Item[] }[] = [
  {
    title: "Entdecken",
    items: [
      { href: "/explore", label: "App-Explorer", icon: LayoutGrid, match: ["/explore", "/app/"] },
      { href: "/feed", label: "Feed", icon: Rss, match: ["/feed"] },
      { href: "/rising", label: "Aufsteiger", icon: TrendingUp, match: ["/rising"] },
      { href: "/charts", label: "Rankings", icon: BarChart3, match: ["/charts"] },
    ],
  },
  { title: "Markt", items: [{ href: "/publishers", label: "Publisher", icon: Building2, match: ["/publishers"] }] },
  { title: "Info", items: [{ href: "/methodik", label: "Methodik", icon: BookOpen, match: ["/methodik"] }] },
];

const base = "flex shrink-0 items-center gap-2.5 whitespace-nowrap rounded-lg px-3 py-2 text-sm font-medium";

function NavList({ isActive }: { isActive: (item: Item) => boolean }) {
  return (
    <nav className="-mx-4 flex gap-1 overflow-x-auto px-4 md:mx-0 md:flex-col md:gap-4 md:overflow-visible md:px-0">
      {NAV_GROUPS.map((group) => (
        <div key={group.title} className="flex gap-1 md:flex-col">
          <div className="hidden px-3 pb-1 text-[11px] font-semibold tracking-wider text-muted uppercase md:block">{group.title}</div>
          {group.items.map((item) => {
            const active = isActive(item);
            const Icon = item.icon;
            return (
              <Link key={item.href} href={item.href} aria-current={active ? "page" : undefined}
                className={`${base} ${active ? "bg-primary-soft text-primary" : "text-muted hover:bg-surface-2 hover:text-text"}`}>
                <Icon className="size-4" />
                {item.label}
              </Link>
            );
          })}
        </div>
      ))}
    </nav>
  );
}

/** Plain links: the prerendered fallback while the pathname is unknown. */
export function StaticNav() {
  return <NavList isActive={() => false} />;
}

export function Nav() {
  const pathname = usePathname();
  return <NavList isActive={(item) => item.match.some((prefix) => pathname.startsWith(prefix))} />;
}
