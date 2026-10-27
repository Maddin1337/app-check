"use client";

import {
  Apple, ArrowUpDown, BarChart3, Calendar, Check, Globe, LayoutGrid, Loader2, Monitor, Play, Smartphone, Tablet, Tags,
  type LucideIcon,
} from "lucide-react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useState, useTransition } from "react";

import { Popover } from "@/components/popover";

// Icons are passed by name: server pages cannot hand component functions to client components.
const ICONS: Record<string, LucideIcon> = {
  all: LayoutGrid, ios: Apple, android: Play, sort: ArrowUpDown, calendar: Calendar, tags: Tags, globe: Globe,
  chart: BarChart3, iphone: Smartphone, ipad: Tablet, mac: Monitor,
};

export type ControlOption = { value: string; label: string; icon?: string; hint?: string };

/** Sets one URL parameter (removing it at its default) and drops the page; results update without a reload. */
function useParam(name: string, fallback: string, reset: string[] = []) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const [pending, startTransition] = useTransition();
  const set = (value: string) => {
    const next = new URLSearchParams(params.toString());
    if (value === fallback) next.delete(name);
    else next.set(name, value);
    next.delete("page");
    for (const key of reset) next.delete(key);
    const query = next.toString();
    startTransition(() => router.push(query ? `${pathname}?${query}` : pathname, { scroll: false }));
  };
  return { set, pending };
}

/** Segmented switch, e.g. All / App Store / Google Play. */
export function ParamSegmented({ name, value, options, fallback = "", reset, label }: {
  name: string; value: string; options: ControlOption[]; fallback?: string; reset?: string[]; label: string;
}) {
  const { set, pending } = useParam(name, fallback, reset);
  return (
    <div className="inline-flex items-center gap-2">
      <div role="radiogroup" aria-label={label} className="inline-flex rounded-xl border border-border bg-bg p-1">
        {options.map((o) => {
          const Icon = o.icon ? ICONS[o.icon] : null;
          return (
            <button key={o.value || "all"} type="button" role="radio" aria-checked={value === o.value} onClick={() => set(o.value)}
              className={`inline-flex h-8 items-center gap-1.5 rounded-lg px-3 text-sm font-medium whitespace-nowrap transition-colors ${
                value === o.value ? "bg-surface text-text shadow-sm ring-1 ring-border" : "text-muted hover:text-text"}`}>
              {Icon ? <Icon className="size-4" /> : null}
              {o.label}
            </button>
          );
        })}
      </div>
      {pending ? <Loader2 className="size-4 animate-spin text-muted" aria-label="Lädt" /> : null}
    </div>
  );
}

/** Chip with a menu of options; shows the chosen label and highlights when not at its default. */
export function ParamMenu({ name, value, options, fallback = "", label, icon = "tags", align, searchable = false }: {
  name: string; value: string; options: ControlOption[]; fallback?: string; label: string; icon?: string;
  align?: "left" | "right"; searchable?: boolean;
}) {
  const { set } = useParam(name, fallback);
  const Icon = ICONS[icon] ?? Tags;
  const current = options.find((o) => o.value === value);
  return (
    <Popover icon={<Icon className="size-3.5" />} label={current?.label ?? label}
      active={value !== fallback} align={align}>
      {(close) => <SearchableList options={options} value={value} searchable={searchable} onPick={(v) => { set(v); close(); }} />}
    </Popover>
  );
}


function SearchableList({ options, value, searchable, onPick }: {
  options: ControlOption[]; value: string; searchable: boolean; onPick: (v: string) => void;
}) {
  const [query, setQuery] = useState("");
  const shown = options.filter((o) => `${o.label} ${o.hint ?? ""}`.toLowerCase().includes(query.toLowerCase()));
  return (
    <div>
      {searchable ? (
        <div className="border-b border-border p-2">
          <input autoFocus value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Suchen …"
            className="h-8 w-full rounded-lg bg-surface-2 px-2.5 text-sm outline-none" />
        </div>
      ) : null}
      <ul className="max-h-80 overflow-y-auto py-1">
        {shown.map((o) => (
          <li key={o.value || "default"}>
            <button type="button" onClick={() => onPick(o.value)}
              className="flex w-full items-center justify-between gap-3 px-3 py-1.5 text-left text-sm hover:bg-surface-2">
              <span>{o.label}</span>
              <span className="flex items-center gap-2 text-xs text-muted">
                {o.hint}
                {o.value === value ? <Check className="size-4 text-primary" /> : null}
              </span>
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
