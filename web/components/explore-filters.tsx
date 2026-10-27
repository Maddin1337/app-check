"use client";

import {
  Apple, ArrowUpDown, Calendar, Check, DollarSign, Languages, LayoutGrid, Loader2, Megaphone, Play,
  Search, Star, Tags, X,
} from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState, useTransition, type ReactNode } from "react";

import { Popover } from "@/components/popover";
import { activeFilterCount, DEFAULT_FILTERS, filtersToQuery, type ExploreFilters } from "@/lib/explore-params";

type Option<T> = { value: T; label: string };

const SORTS: Option<ExploreFilters["sort"]>[] = [
  { value: "ratings", label: "Meiste Bewertungen" },
  { value: "revenue", label: "Höchster Umsatz (geschätzt)" },
  { value: "downloads", label: "Meiste Downloads (geschätzt)" },
  { value: "growth", label: "Stärkstes Wachstum (30 Tage)" },
  { value: "rank", label: "Bester Chart-Platz" },
  { value: "newest", label: "Neueste" },
  { value: "updated", label: "Zuletzt aktualisiert" },
  { value: "name", label: "Name" },
];
const RELEASED: Option<ExploreFilters["released"]>[] = [
  { value: "", label: "Jederzeit" }, { value: "30", label: "30 Tage" }, { value: "90", label: "90 Tage" },
  { value: "365", label: "12 Monate" },
];
const MIN_RATINGS: Option<number>[] = [
  { value: 0, label: "Egal" }, { value: 100, label: "100+" }, { value: 1000, label: "1.000+" },
  { value: 10000, label: "10.000+" }, { value: 100000, label: "100.000+" },
];
const MIN_AVG: Option<number>[] = [
  { value: 0, label: "Egal" }, { value: 3, label: "3,0+" }, { value: 4, label: "4,0+" }, { value: 4.5, label: "4,5+" },
];
const MIN_REVENUE: Option<number>[] = [
  { value: 0, label: "Egal" }, { value: 1000, label: "1.000 $+" }, { value: 10000, label: "10.000 $+" },
  { value: 100000, label: "100.000 $+" }, { value: 1000000, label: "1 Mio. $+" },
];
const PRICE: Option<ExploreFilters["price"]>[] = [
  { value: "", label: "Alle" }, { value: "free", label: "Kostenlos" }, { value: "paid", label: "Kostenpflichtig" },
];
const IAP: Option<ExploreFilters["iap"]>[] = [
  { value: "", label: "Egal" }, { value: "yes", label: "Mit Abo oder IAP" }, { value: "no", label: "Ohne" },
];

const label = <T,>(options: Option<T>[], value: T) => options.find((o) => o.value === value)?.label ?? String(value);

export function ExploreFilters({ filters, categories, languages }: {
  filters: ExploreFilters;
  categories: { category: string; apps: number }[];
  languages: Record<string, string>;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [pending, startTransition] = useTransition();

  const apply = (changes: Partial<ExploreFilters>) => {
    const query = filtersToQuery({ ...filters, ...changes, page: 1 });
    startTransition(() => router.push(query ? `${pathname}?${query}` : pathname, { scroll: false }));
  };

  const active = activeFilterCount(filters);
  const chips: { key: string; text: string; clear: Partial<ExploreFilters> }[] = [
    filters.category && { key: "category", text: `Kategorie: ${filters.category}`, clear: { category: "" } },
    filters.excludeCategory && { key: "exclude", text: `Ohne: ${filters.excludeCategory}`, clear: { excludeCategory: "" } },
    filters.released && { key: "released", text: `Veröffentlicht: ${label(RELEASED, filters.released)}`, clear: { released: "" } },
    filters.minRatings > 0 && { key: "minRatings", text: `Bewertungen ${label(MIN_RATINGS, filters.minRatings)}`, clear: { minRatings: 0 } },
    filters.minRating > 0 && { key: "minRating", text: `Ø ${label(MIN_AVG, filters.minRating)}`, clear: { minRating: 0 } },
    filters.price && { key: "price", text: label(PRICE, filters.price), clear: { price: "" } },
    filters.iap && { key: "iap", text: `IAP: ${label(IAP, filters.iap)}`, clear: { iap: "" } },
    filters.minRevenue > 0 && { key: "minRevenue", text: `Umsatz ${label(MIN_REVENUE, filters.minRevenue)}`, clear: { minRevenue: 0 } },
    filters.language && { key: "language", text: `Sprache: ${languages[filters.language] ?? filters.language}`, clear: { language: "" } },
    filters.charted && { key: "charted", text: "In den Charts", clear: { charted: false } },
    filters.appleAds && { key: "appleAds", text: "Wirbt bei Apple (EU)", clear: { appleAds: false } },
    filters.developer && { key: "developer", text: `Publisher ${filters.developer}`, clear: { developer: "" } },
  ].filter(Boolean) as { key: string; text: string; clear: Partial<ExploreFilters> }[];

  return (
    <div className="space-y-3 rounded-2xl border border-border bg-surface p-3 shadow-sm">
      <div className="flex flex-wrap items-center gap-2">
        <SearchBox value={filters.q} onSearch={(q) => apply({ q })} />
        {/* Categories differ between the stores, so a platform switch drops the category filters. */}
        <PlatformToggle value={filters.platform}
          onChange={(platform) => apply({ platform, ...(platform !== filters.platform ? { category: "", excludeCategory: "" } : {}) })} />
        <div className="ml-auto flex items-center gap-2">
          {pending ? <Loader2 className="size-4 animate-spin text-muted" aria-label="Lädt" /> : null}
          <Popover icon={<ArrowUpDown className="size-3.5" />} label={label(SORTS, filters.sort)} align="right">
            {(close) => (
              <ul className="py-1">
                {SORTS.map((o) => (
                  <li key={o.value}>
                    <button type="button" onClick={() => { apply({ sort: o.value }); close(); }}
                      className="flex w-full items-center justify-between gap-3 px-3 py-2 text-left text-sm hover:bg-surface-2">
                      {o.label}
                      {o.value === filters.sort ? <Check className="size-4 text-primary" /> : null}
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </Popover>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        <Popover icon={<Tags className="size-3.5" />} label="Kategorie" active={!!(filters.category || filters.excludeCategory)}>
          {(close) => (
            <CategoryList categories={categories} include={filters.category} exclude={filters.excludeCategory}
              onInclude={(category) => { apply({ category, excludeCategory: "" }); close(); }}
              onExclude={(excludeCategory) => { apply({ excludeCategory, category: "" }); close(); }} />
          )}
        </Popover>
        <Popover icon={<Calendar className="size-3.5" />} label="Veröffentlicht" active={!!filters.released}>
          {(close) => (
            <Panel title="Veröffentlicht in den letzten">
              <Pills options={RELEASED} value={filters.released} onChange={(released) => { apply({ released }); close(); }} />
            </Panel>
          )}
        </Popover>
        <Popover icon={<Star className="size-3.5" />} label="Bewertungen" active={filters.minRatings > 0 || filters.minRating > 0}>
          {(close) => (
            <>
              <Panel title="Anzahl Bewertungen">
                <Pills options={MIN_RATINGS} value={filters.minRatings} onChange={(minRatings) => { apply({ minRatings }); close(); }} />
              </Panel>
              <Panel title="Durchschnitt">
                <Pills options={MIN_AVG} value={filters.minRating} onChange={(minRating) => { apply({ minRating }); close(); }} />
              </Panel>
            </>
          )}
        </Popover>
        <Popover icon={<DollarSign className="size-3.5" />} label="Monetarisierung"
          active={!!(filters.price || filters.iap || filters.minRevenue)}>
          {(close) => (
            <>
              <Panel title="Preis">
                <Pills options={PRICE} value={filters.price} onChange={(price) => { apply({ price }); close(); }} />
              </Panel>
              <Panel title="In-App-Käufe">
                <Pills options={IAP} value={filters.iap} onChange={(iap) => { apply({ iap }); close(); }} />
              </Panel>
              <Panel title="Umsatz pro Monat (geschätzt)">
                <Pills options={MIN_REVENUE} value={filters.minRevenue} onChange={(minRevenue) => { apply({ minRevenue }); close(); }} />
              </Panel>
            </>
          )}
        </Popover>
        <Popover icon={<Languages className="size-3.5" />} label="Sprache" active={!!filters.language}>
          {(close) => (
            <ListPicker
              items={Object.entries(languages).map(([code, name]) => ({ value: code, label: name, hint: code }))}
              value={filters.language} placeholder="Sprache suchen …"
              onChange={(language) => { apply({ language }); close(); }} />
          )}
        </Popover>
        <Popover icon={<Megaphone className="size-3.5" />} label="Signale" active={filters.charted || filters.appleAds}>
          {() => (
            <div className="space-y-1 p-2">
              <Toggle checked={filters.charted} onChange={(charted) => apply({ charted })}
                title="In den Charts" hint="Heute in einem der erfassten Charts" />
              <Toggle checked={filters.appleAds} onChange={(appleAds) => apply({ appleAds })}
                title="Wirbt bei Apple (EU)" hint="Apple Search Ads in den letzten 90 Tagen" />
              <Toggle checked={filters.all} onChange={(all) => apply({ all })}
                title="Auch ohne Metadaten" hint="Apps, die bisher nur aus der Sitemap bekannt sind" />
            </div>
          )}
        </Popover>
      </div>

      {chips.length ? (
        <div className="flex flex-wrap items-center gap-2 border-t border-border pt-3">
          <span className="text-xs text-muted">{active} {active === 1 ? "Filter" : "Filter"} aktiv</span>
          {chips.map((chip) => (
            <button key={chip.key} type="button" onClick={() => apply(chip.clear)}
              className="inline-flex items-center gap-1 rounded-full bg-primary-soft px-2.5 py-1 text-xs font-medium text-primary hover:bg-primary/15">
              {chip.text}
              <X className="size-3" aria-label="entfernen" />
            </button>
          ))}
          <button type="button" onClick={() => apply({ ...DEFAULT_FILTERS, q: filters.q, platform: filters.platform, sort: filters.sort })}
            className="text-xs font-medium text-muted hover:text-text">
            Alle zurücksetzen
          </button>
        </div>
      ) : null}
    </div>
  );
}

function SearchBox({ value, onSearch }: { value: string; onSearch: (q: string) => void }) {
  const [text, setText] = useState(value);
  const last = useRef(value);
  useEffect(() => {
    if (text === last.current) return;
    const timer = setTimeout(() => { last.current = text; onSearch(text.trim()); }, 400);
    return () => clearTimeout(timer);
  }, [text, onSearch]);
  return (
    <label className="relative flex min-w-64 flex-1 items-center">
      <Search className="pointer-events-none absolute left-3 size-4 text-muted" />
      <input value={text} onChange={(e) => setText(e.target.value)} placeholder="App, Entwickler oder Store-ID suchen"
        className="h-10 w-full rounded-xl border border-border bg-bg pr-3 pl-9 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20" />
    </label>
  );
}

function PlatformToggle({ value, onChange }: { value: ExploreFilters["platform"]; onChange: (v: ExploreFilters["platform"]) => void }) {
  const options: { value: ExploreFilters["platform"]; label: string; icon: ReactNode }[] = [
    { value: "", label: "Alle", icon: <LayoutGrid className="size-4" /> },
    { value: "ios", label: "App Store", icon: <Apple className="size-4" /> },
    { value: "android", label: "Google Play", icon: <Play className="size-4" /> },
  ];
  return (
    <div role="radiogroup" aria-label="Plattform" className="inline-flex rounded-xl border border-border bg-bg p-1">
      {options.map((o) => (
        <button key={o.value || "all"} type="button" role="radio" aria-checked={value === o.value} onClick={() => onChange(o.value)}
          className={`inline-flex h-8 items-center gap-1.5 rounded-lg px-3 text-sm font-medium transition-colors ${
            value === o.value ? "bg-surface text-text shadow-sm ring-1 ring-border" : "text-muted hover:text-text"}`}>
          {o.icon}
          {o.label}
        </button>
      ))}
    </div>
  );
}

function Panel({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="border-b border-border p-3 last:border-0">
      <div className="mb-2 text-xs font-medium text-muted">{title}</div>
      {children}
    </div>
  );
}

function Pills<T extends string | number>({ options, value, onChange }: { options: Option<T>[]; value: T; onChange: (v: T) => void }) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {options.map((o) => (
        <button key={String(o.value)} type="button" onClick={() => onChange(o.value)}
          className={`rounded-full border px-2.5 py-1 text-xs font-medium ${
            o.value === value ? "border-primary bg-primary text-white" : "border-border bg-surface hover:bg-surface-2"}`}>
          {o.label}
        </button>
      ))}
    </div>
  );
}

function Toggle({ checked, onChange, title, hint }: { checked: boolean; onChange: (v: boolean) => void; title: string; hint: string }) {
  return (
    <button type="button" role="switch" aria-checked={checked} onClick={() => onChange(!checked)}
      className="flex w-full items-center justify-between gap-3 rounded-lg px-2 py-2 text-left hover:bg-surface-2">
      <span>
        <span className="block text-sm font-medium">{title}</span>
        <span className="block text-xs text-muted">{hint}</span>
      </span>
      <span className={`relative h-5 w-9 shrink-0 rounded-full transition-colors ${checked ? "bg-primary" : "bg-border"}`}>
        <span className={`absolute top-0.5 size-4 rounded-full bg-white shadow transition-all ${checked ? "left-4.5" : "left-0.5"}`} />
      </span>
    </button>
  );
}

function ListPicker({ items, value, placeholder, onChange }: {
  items: { value: string; label: string; hint?: string }[]; value: string; placeholder: string; onChange: (v: string) => void;
}) {
  const [query, setQuery] = useState("");
  const shown = items.filter((i) => `${i.label} ${i.hint ?? ""}`.toLowerCase().includes(query.toLowerCase()));
  return (
    <div>
      <div className="border-b border-border p-2">
        <input autoFocus value={query} onChange={(e) => setQuery(e.target.value)} placeholder={placeholder}
          className="h-8 w-full rounded-lg bg-surface-2 px-2.5 text-sm outline-none" />
      </div>
      <ul className="max-h-72 overflow-y-auto py-1">
        {value ? (
          <li>
            <button type="button" onClick={() => onChange("")} className="w-full px-3 py-1.5 text-left text-xs text-muted hover:bg-surface-2">
              Auswahl entfernen
            </button>
          </li>
        ) : null}
        {shown.map((i) => (
          <li key={i.value}>
            <button type="button" onClick={() => onChange(i.value)}
              className="flex w-full items-center justify-between gap-3 px-3 py-1.5 text-left text-sm hover:bg-surface-2">
              <span>{i.label}</span>
              <span className="flex items-center gap-2 text-xs text-muted">
                {i.hint}
                {i.value === value ? <Check className="size-4 text-primary" /> : null}
              </span>
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}

function CategoryList({ categories, include, exclude, onInclude, onExclude }: {
  categories: { category: string; apps: number }[]; include: string; exclude: string;
  onInclude: (c: string) => void; onExclude: (c: string) => void;
}) {
  const [query, setQuery] = useState("");
  const shown = categories.filter((c) => c.category.toLowerCase().includes(query.toLowerCase()));
  const count = new Intl.NumberFormat("de-DE", { notation: "compact", maximumFractionDigits: 1 });
  return (
    <div>
      <div className="border-b border-border p-2">
        <input autoFocus value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Kategorie suchen …"
          className="h-8 w-full rounded-lg bg-surface-2 px-2.5 text-sm outline-none" />
      </div>
      <ul className="max-h-80 overflow-y-auto py-1">
        {include || exclude ? (
          <li>
            <button type="button" onClick={() => onInclude("")} className="w-full px-3 py-1.5 text-left text-xs text-muted hover:bg-surface-2">
              Auswahl entfernen
            </button>
          </li>
        ) : null}
        {shown.map((c) => (
          <li key={c.category} className="group flex items-center hover:bg-surface-2">
            <button type="button" onClick={() => onInclude(c.category)} className="flex flex-1 items-center justify-between gap-2 px-3 py-1.5 text-left text-sm">
              <span className={c.category === include ? "font-medium text-primary" : c.category === exclude ? "text-muted line-through" : ""}>
                {c.category}
              </span>
              <span className="text-xs text-muted">{count.format(c.apps)}</span>
            </button>
            <button type="button" onClick={() => onExclude(c.category)} title={`${c.category} ausschließen`}
              className="mr-2 rounded px-1.5 py-0.5 text-xs text-muted hover:bg-surface hover:text-bad sm:opacity-0 sm:group-hover:opacity-100">
              ausschließen
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
