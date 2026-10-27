import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";

import { ExploreFilters as ExploreFiltersBar } from "@/components/explore-filters";
import { AppIcon, Card, ConfidenceBadge, PlatformBadge, RankBadge, Skeleton, Sparkline } from "@/components/ui";
import { LANGUAGES } from "@/lib/catalog";
import { displayName, formatCompact, formatDate, formatEstimate, formatNumber, formatPercent, formatPrice, formatUsd } from "@/lib/format";
import { filtersToQuery } from "@/lib/explore-params";
import { categories, COUNT_CAP, exploreApps, overview, PAGE_SIZE, parseFilters, trendSeries, type ExploreFilters } from "@/lib/queries";

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
  const [{ rows, total, capped }, categoryList] = await Promise.all([exploreApps(filters), categories(filters.platform)]);
  const series = await trendSeries(rows.flatMap((r) =>
    r.growth_metric && r.growth_country && r.growth_start_day
      ? [{ id: r.id, country: r.growth_country, metric: r.growth_metric, start_day: r.growth_start_day }] : []));
  return (
    <>
      <ExploreFiltersBar filters={filters} categories={categoryList} languages={LANGUAGES} />
      <Card
        title={capped ? `Über ${formatNumber(COUNT_CAP)} Apps` : `${formatNumber(total)} Apps`}
        aside={<span className="text-xs text-muted">Seite {filters.page}{capped ? "" : ` von ${Math.max(1, Math.ceil(total / PAGE_SIZE))}`}</span>}
      >
        <ResultTable rows={rows} series={series} showInstalls={filters.platform !== "ios"} />
        <p className="border-t border-border px-4 py-2 text-xs text-muted">
          Downloads und Umsatz sind Schätzungen (Modell v0, früh), gerundet; die Spanne P10–P90 steht im Tooltip. iOS: nur
          US App Store, Android: weltweit. Umsatz brutto pro Monat aus Store-Käufen, ohne Werbeeinnahmen.
        </p>
        <Pagination filters={filters} total={total} capped={capped} />
      </Card>
    </>
  );
}

function ResultTable({ rows, series, showInstalls }: {
  rows: Awaited<ReturnType<typeof exploreApps>>["rows"]; series: Map<number, number[]>; showInstalls: boolean;
}) {
  if (rows.length === 0) {
    return <p className="px-4 py-10 text-center text-sm text-muted">Keine Apps für diese Filter.</p>;
  }
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[1180px] text-sm">
        <thead className="text-left text-xs text-muted">
          <tr className="border-b border-border">
            <th className="px-4 py-2 font-medium">App</th>
            <th className="px-3 py-2 font-medium">Kategorie</th>
            <th className="px-3 py-2 text-right font-medium">Bewertungen</th>
            {showInstalls ? <th className="px-3 py-2 text-right font-medium">Installationen</th> : null}
            <th className="px-3 py-2 text-right font-medium">Downloads/Tag</th>
            <th className="px-3 py-2 text-right font-medium">Umsatz/Monat</th>
            <th className="px-3 py-2 font-medium">Wachstum 30 T</th>
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
                  {app.revenue_p50 === 0 ? (
                    <span className="text-muted" title="Weder Kaufpreis noch In-App-Käufe: kein Store-Umsatz (Werbung nicht erfasst)">0 $</span>
                  ) : (
                    <span className="inline-flex items-center gap-1.5">
                      {app.revenue_p50 != null ? formatUsd(app.revenue_p50) : "–"}
                      {app.revenue_p50 != null ? <ConfidenceBadge confidence={app.confidence} /> : null}
                    </span>
                  )}
                </td>
                <td className="px-3 py-2"
                  title={app.growth_per_day != null ? `+${formatNumber(Math.round(app.growth_per_day))} ${app.growth_metric === "installs" ? "Installationen" : "Bewertungen"} pro Tag` : undefined}>
                  {app.growth_per_day != null ? (
                    <span className="flex items-center gap-2">
                      <Sparkline values={series.get(Number(app.id)) ?? []} width={64} height={22} />
                      <span className="text-xs tabular-nums text-good">{formatPercent(app.growth)}</span>
                    </span>
                  ) : <span className="text-muted">–</span>}
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

function Pagination({ filters, total, capped }: { filters: ExploreFilters; total: number; capped: boolean }) {
  const pages = capped ? Number.POSITIVE_INFINITY : Math.max(1, Math.ceil(total / PAGE_SIZE));
  if (pages <= 1) return null;
  const href = (page: number) => {
    const query = filtersToQuery({ ...filters, page });
    return query ? `/explore?${query}` : "/explore";
  };
  return (
    <nav className="flex items-center justify-between border-t border-border px-4 py-3 text-sm">
      {filters.page > 1 ? <Link href={href(filters.page - 1)} className="text-primary hover:underline">← Zurück</Link> : <span />}
      <span className="text-xs text-muted">
        {formatNumber((filters.page - 1) * PAGE_SIZE + 1)}–{formatNumber(capped ? filters.page * PAGE_SIZE : Math.min(total, filters.page * PAGE_SIZE))}
        {capped ? ` von über ${formatNumber(COUNT_CAP)}` : ` von ${formatNumber(total)}`}
      </span>
      {filters.page < pages ? <Link href={href(filters.page + 1)} className="text-primary hover:underline">Weiter →</Link> : <span />}
    </nav>
  );
}
