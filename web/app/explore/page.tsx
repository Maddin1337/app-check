import type { Metadata } from "next";
import Form from "next/form";
import Link from "next/link";
import { Suspense } from "react";

import { AutoSubmitCheckbox, AutoSubmitSelect } from "@/components/auto-submit";
import { AppIcon, Card, ConfidenceBadge, PlatformBadge, RankBadge, Skeleton } from "@/components/ui";
import { displayName, formatCompact, formatDate, formatEstimate, formatNumber, formatPrice, formatUsd } from "@/lib/format";
import { categories, exploreApps, overview, PAGE_SIZE, parseFilters, type ExploreFilters } from "@/lib/queries";

export const metadata: Metadata = { title: "App-Explorer" };

export default function ExplorePage({ searchParams }: PageProps<"/explore">) {
  return (
    <div className="mx-auto max-w-7xl space-y-5">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight">App-Explorer</h1>
        <Suspense fallback={<p className="mt-1 h-5 text-sm text-muted">Lade Überblick …</p>}>
          <Overview />
        </Suspense>
      </header>
      <Suspense fallback={<Card><Skeleton rows={12} /></Card>}>
        <Explorer searchParams={searchParams} />
      </Suspense>
    </div>
  );
}

async function Overview() {
  const o = await overview();
  return (
    <p className="mt-1 text-sm text-muted">
      {formatNumber(o.ios)} iOS- und {formatNumber(o.android)} Android-Apps im Katalog, davon{" "}
      {formatNumber(o.active)} mit Metadaten. {formatNumber(o.charted)} Apps in den Charts
      {o.latest ? ` vom ${formatDate(o.latest)}` : ""}, {o.chart_days} Tag(e) Chart-Historie.
    </p>
  );
}

async function Explorer({ searchParams }: { searchParams: PageProps<"/explore">["searchParams"] }) {
  const filters = parseFilters(await searchParams);
  const [{ rows, total }, categoryList] = await Promise.all([exploreApps(filters), categories()]);
  return (
    <>
      <Filters filters={filters} categoryList={categoryList} />
      <Card
        title={`${formatNumber(total)} Apps`}
        aside={<span className="text-xs text-muted">Seite {filters.page} von {Math.max(1, Math.ceil(total / PAGE_SIZE))}</span>}
      >
        <ResultTable rows={rows} showInstalls={filters.platform !== "ios"} />
        <p className="border-t border-border px-4 py-2 text-xs text-muted">
          Downloads und Umsatz sind Schätzungen (Modell v0, früh), gerundet; die Spanne P10–P90 steht im Tooltip. iOS: nur
          US App Store, Android: weltweit. Umsatz brutto pro Monat aus Store-Käufen, ohne Werbeeinnahmen.
        </p>
        <Pagination filters={filters} total={total} />
      </Card>
    </>
  );
}

function Filters({ filters, categoryList }: { filters: ExploreFilters; categoryList: { category: string; apps: number }[] }) {
  return (
    <Form action="/explore" className="flex flex-wrap items-end gap-2 rounded-xl border border-border bg-surface p-3">
      {filters.developer ? (
        <div className="flex w-full items-center gap-2 text-sm">
          <input type="hidden" name="developer" value={filters.developer} />
          <span className="rounded-md bg-primary-soft px-2 py-1 text-primary">Nur Apps eines Publishers ({filters.developer})</span>
          <Link href={`/explore?platform=${filters.platform}`} className="text-xs text-muted hover:text-text">Filter entfernen</Link>
        </div>
      ) : null}
      <label className="flex min-w-56 flex-1 flex-col gap-1 text-xs text-muted">
        Suche
        <input name="q" defaultValue={filters.q} placeholder="Name, Slug oder Store-ID" className="field" />
      </label>
      <Select label="Plattform" name="platform" value={filters.platform}
        options={[["", "Alle"], ["ios", "iOS"], ["android", "Android"]]} />
      <Select label="Kategorie" name="category" value={filters.category}
        options={[["", "Alle"], ...categoryList.map((c) => [c.category, `${c.category} (${formatCompact(c.apps)})`] as [string, string])]} />
      <Select label="Veröffentlicht" name="released" value={filters.released}
        options={[["", "Jederzeit"], ["30", "Letzte 30 Tage"], ["90", "Letzte 90 Tage"], ["365", "Letzte 12 Monate"]]} />
      <Select label="Bewertungen ab" name="minRatings" value={String(filters.minRatings || "")}
        options={[["", "Egal"], ["100", "100"], ["1000", "1.000"], ["10000", "10.000"], ["100000", "100.000"]]} />
      <Select label="Preis" name="price" value={filters.price}
        options={[["", "Alle"], ["free", "Kostenlos"], ["paid", "Kostenpflichtig"]]} />
      <Select label="Umsatz/Monat ab" name="minRevenue" value={String(filters.minRevenue || "")}
        options={[["", "Egal"], ["1000", "1.000 $"], ["10000", "10.000 $"], ["100000", "100.000 $"], ["1000000", "1 Mio. $"]]} />
      <Select label="Sortierung" name="sort" value={filters.sort}
        options={[["ratings", "Meiste Bewertungen"], ["revenue", "Höchster Umsatz (geschätzt)"], ["downloads", "Meiste Downloads (geschätzt)"], ["rank", "Bester Chart-Platz"], ["newest", "Neueste"], ["updated", "Zuletzt aktualisiert"], ["name", "Name"]]} />
      <div className="flex h-9 items-center gap-4 px-1 text-sm">
        <label className="flex items-center gap-2">
          <AutoSubmitCheckbox name="charted" value="1" defaultChecked={filters.charted} className="accent-primary" />
          Nur in Charts
        </label>
        <label className="flex items-center gap-2" title="Auch Apps, für die bisher nur ID und Slug aus der Sitemap bekannt sind">
          <AutoSubmitCheckbox name="all" value="1" defaultChecked={filters.all} className="accent-primary" />
          Inkl. ohne Metadaten
        </label>
      </div>
      <button type="submit" className="h-9 rounded-lg bg-primary px-4 text-sm font-medium text-white hover:bg-primary-strong">
        Anwenden
      </button>
    </Form>
  );
}

function Select({ label, name, value, options }: { label: string; name: string; value: string; options: [string, string][] }) {
  return (
    <label className="flex flex-col gap-1 text-xs text-muted">
      {label}
      <AutoSubmitSelect name={name} defaultValue={value} className="field max-w-56">
        {options.map(([optionValue, text]) => (
          <option key={optionValue} value={optionValue}>{text}</option>
        ))}
      </AutoSubmitSelect>
    </label>
  );
}

function ResultTable({ rows, showInstalls }: { rows: Awaited<ReturnType<typeof exploreApps>>["rows"]; showInstalls: boolean }) {
  if (rows.length === 0) {
    return <p className="px-4 py-10 text-center text-sm text-muted">Keine Apps für diese Filter.</p>;
  }
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[1080px] text-sm">
        <thead className="text-left text-xs text-muted">
          <tr className="border-b border-border">
            <th className="px-4 py-2 font-medium">App</th>
            <th className="px-3 py-2 font-medium">Kategorie</th>
            <th className="px-3 py-2 text-right font-medium">Bewertungen</th>
            {showInstalls ? <th className="px-3 py-2 text-right font-medium">Installationen</th> : null}
            <th className="px-3 py-2 text-right font-medium">Downloads/Tag</th>
            <th className="px-3 py-2 text-right font-medium">Umsatz/Monat</th>
            <th className="px-3 py-2 font-medium">Chart heute</th>
            <th className="px-3 py-2 font-medium">Veröffentlicht</th>
            <th className="px-4 py-2 text-right font-medium">Preis</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((app) => {
            const name = displayName(app.name, app.slug, app.store_id);
            return (
              <tr key={app.id} className="border-b border-border last:border-0 hover:bg-surface-2">
                <td className="px-4 py-2">
                  <Link href={`/app/${app.platform}/${encodeURIComponent(app.store_id)}`} className="flex items-center gap-3">
                    <AppIcon url={app.icon_url} name={name} size={36} />
                    <span className="min-w-0">
                      <span className="flex items-center gap-2">
                        <span className="truncate font-medium">{name}</span>
                        <PlatformBadge platform={app.platform} />
                      </span>
                      <span className="block truncate text-xs text-muted">
                        {app.status === "active" ? app.developer_name ?? "–" : "Metadaten folgen"}
                      </span>
                    </span>
                  </Link>
                </td>
                <td className="px-3 py-2 text-muted">{app.category ?? "–"}</td>
                <td className="px-3 py-2 text-right tabular-nums">
                  {formatCompact(app.rating_count)}
                  {app.rating_avg ? <span className="ml-1.5 text-xs text-muted">★ {app.rating_avg.toFixed(1)}</span> : null}
                </td>
                {showInstalls ? <td className="px-3 py-2 text-right tabular-nums">{formatCompact(app.installs_exact)}</td> : null}
                <td className="px-3 py-2 text-right tabular-nums"
                  title={app.downloads_p50 != null ? `${formatEstimate(app.downloads_p10)} – ${formatEstimate(app.downloads_p90)} pro Tag (${app.scope === "us" ? "US App Store" : "weltweit"})` : undefined}>
                  {formatEstimate(app.downloads_p50)}
                </td>
                <td className="px-3 py-2 text-right tabular-nums"
                  title={app.revenue_p50 != null ? `${formatUsd(app.revenue_p10)} – ${formatUsd(app.revenue_p90)} pro Monat, brutto` : undefined}>
                  <span className="inline-flex items-center gap-1.5">
                    {app.revenue_p50 != null ? formatUsd(app.revenue_p50) : "–"}
                    {app.revenue_p50 != null ? <ConfidenceBadge confidence={app.confidence} /> : null}
                  </span>
                </td>
                <td className="px-3 py-2"><RankBadge rank={app.best_rank} entries={app.chart_entries} /></td>
                <td className="px-3 py-2 tabular-nums text-muted">{formatDate(app.released_at)}</td>
                <td className="px-4 py-2 text-right text-muted">{formatPrice(app.price, app.currency)}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

function Pagination({ filters, total }: { filters: ExploreFilters; total: number }) {
  const pages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  if (pages <= 1) return null;
  const href = (page: number) => {
    const params = new URLSearchParams();
    for (const [key, value] of Object.entries(filters)) {
      if (key === "page" || value === "" || value === false || value === 0) continue;
      params.set(key, value === true ? "1" : String(value));
    }
    if (page > 1) params.set("page", String(page));
    return `/explore?${params}`;
  };
  return (
    <nav className="flex items-center justify-between border-t border-border px-4 py-3 text-sm">
      {filters.page > 1 ? <Link href={href(filters.page - 1)} className="text-primary hover:underline">← Zurück</Link> : <span />}
      <span className="text-xs text-muted">{formatNumber((filters.page - 1) * PAGE_SIZE + 1)}–{formatNumber(Math.min(total, filters.page * PAGE_SIZE))} von {formatNumber(total)}</span>
      {filters.page < pages ? <Link href={href(filters.page + 1)} className="text-primary hover:underline">Weiter →</Link> : <span />}
    </nav>
  );
}
