import type { Metadata } from "next";
import Link from "next/link";
import { Suspense, type ReactNode } from "react";

import { ParamMenu, ParamSegmented } from "@/components/url-controls";
import { AppIcon, Card, PlatformBadge, Skeleton, Sparkline } from "@/components/ui";
import { CHARTS, countryName, genreName } from "@/lib/catalog";
import { displayName, formatCompact, formatDate, formatNumber, formatPercent } from "@/lib/format";
import {
  chartFacets,
  chartMovers,
  PAGE_SIZE,
  parseRisingFilters,
  RELATIVE_MIN_BASE,
  risingApps,
  trendCategories,
  trendSeries,
  type RisingFilters,
} from "@/lib/queries";

export const metadata: Metadata = { title: "Aufsteiger" };

const CHART_DAYS = 7;

export default function RisingPage({ searchParams }: PageProps<"/rising">) {
  return (
    <div className="mx-auto max-w-6xl space-y-5">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight">Aufsteiger</h1>
        <p className="mt-1 text-sm text-muted">
          Was gerade wächst, gemessen an unseren eigenen täglichen Zeitreihen: bei Android die exakte Zahl der
          Installationen, bei iOS die Zahl der Bewertungen in einem Store. Bewertungen sind ein Signal für Downloads,
          keine Download-Zahl. Dazu die größten Sprünge in den App-Store-Charts.
        </p>
      </header>
      <Suspense fallback={<Card><Skeleton rows={12} /></Card>}>
        <Rising searchParams={searchParams} />
      </Suspense>
    </div>
  );
}

async function Rising({ searchParams }: { searchParams: PageProps<"/rising">["searchParams"] }) {
  const f = parseRisingFilters(await searchParams);
  return (
    <>
      <nav className="flex gap-1 rounded-xl border border-border bg-surface p-1 text-sm">
        <Tab active={f.view === "growth"} href="/rising">Wachstum</Tab>
        <Tab active={f.view === "charts"} href="/rising?view=charts">Chart-Aufsteiger</Tab>
      </nav>
      {f.view === "charts" ? <ChartMovers f={f} /> : <Growth f={f} />}
    </>
  );
}

function Tab({ active, href, children }: { active: boolean; href: string; children: ReactNode }) {
  return (
    <Link
      href={href}
      aria-current={active ? "page" : undefined}
      className={`flex-1 rounded-lg px-3 py-1.5 text-center font-medium ${active ? "bg-primary-soft text-primary" : "text-muted hover:bg-surface-2 hover:text-text"}`}
    >
      {children}
    </Link>
  );
}

async function Growth({ f }: { f: RisingFilters }) {
  const [{ rows, total, computed }, categoryList] = await Promise.all([risingApps(f), trendCategories(f.platform, f.window)]);
  const series = await trendSeries(rows);
  const unit = f.platform === "android" ? "Installationen" : "Bewertungen";
  const pages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const href = (page: number) => {
    const params = new URLSearchParams({ platform: f.platform, window: String(f.window), sort: f.sort });
    if (f.category) params.set("category", f.category);
    if (page > 1) params.set("page", String(page));
    return `/rising?${params}`;
  };

  return (
    <>
      <div className="flex flex-wrap items-center gap-2 rounded-2xl border border-border bg-surface p-3 shadow-sm">
        <ParamSegmented label="Plattform" name="platform" value={f.platform} fallback="ios" reset={["category"]}
          options={[{ value: "ios", label: "App Store", icon: "ios" }, { value: "android", label: "Google Play", icon: "android" }]} />
        <ParamSegmented label="Zeitraum" name="window" value={String(f.window)} fallback="30"
          options={[{ value: "30", label: "30 Tage" }, { value: "7", label: "7 Tage" }]} />
        <ParamMenu label="Kategorie" name="category" value={f.category} searchable
          options={[{ value: "", label: "Alle Kategorien" }, ...categoryList.map((c) => ({ value: c.category, label: c.category, hint: formatCompact(c.apps) }))]} />
        <div className="ml-auto">
          <ParamMenu label="Sortierung" name="sort" value={f.sort} fallback="absolute" icon="sort" align="right"
            options={[{ value: "absolute", label: "Zuwachs pro Tag" }, { value: "relative", label: `Zuwachs in % (ab ${formatNumber(RELATIVE_MIN_BASE[f.platform])})` }]} />
        </div>
      </div>

      <Card
        title={`${formatNumber(total)} wachsende Apps`}
        aside={computed ? <span className="text-xs text-muted">berechnet {formatDate(computed)}</span> : null}
      >
        {rows.length === 0 ? (
          <p className="px-4 py-10 text-center text-sm text-muted">
            {computed
              ? "Keine wachsenden Apps für diese Auswahl."
              : "Noch keine Trends berechnet. Dafür braucht jede App Messwerte von mindestens zwei Tagen; der Job `appcrawl trends` läuft täglich."}
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[820px] text-sm">
              <thead className="text-left text-xs text-muted">
                <tr className="border-b border-border">
                  <th className="w-10 px-4 py-2 text-right font-medium">#</th>
                  <th className="px-3 py-2 font-medium">App</th>
                  <th className="px-3 py-2 font-medium">Kategorie</th>
                  <th className="px-3 py-2 text-right font-medium">{unit}</th>
                  <th className="px-3 py-2 text-right font-medium">Zuwachs</th>
                  <th className="px-3 py-2 text-right font-medium">pro Tag</th>
                  <th className="px-4 py-2 font-medium">Verlauf</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((app, i) => {
                  const name = displayName(app.name, app.slug, app.store_id);
                  return (
                    <tr key={app.id} className="border-b border-border last:border-0 hover:bg-surface-2">
                      <td className="px-4 py-2 text-right font-mono text-xs text-muted">{(f.page - 1) * PAGE_SIZE + i + 1}</td>
                      <td className="px-3 py-2">
                        <Link href={`/app/${app.platform}/${encodeURIComponent(app.store_id)}`} className="flex items-center gap-3">
                          <AppIcon url={app.icon_url} name={name} size={36} />
                          <span className="min-w-0">
                            <span className="flex items-center gap-2">
                              <span className="truncate font-medium">{name}</span>
                              <PlatformBadge platform={app.platform} />
                            </span>
                            <span className="block truncate text-xs text-muted">
                              {app.developer_name ?? "–"}
                              {app.platform === "ios" ? ` · Store ${app.country.toUpperCase()}` : ""}
                            </span>
                          </span>
                        </Link>
                      </td>
                      <td className="px-3 py-2 text-muted">{app.category ?? "–"}</td>
                      <td className="px-3 py-2 text-right tabular-nums">{formatCompact(app.end_value)}</td>
                      <td className="px-3 py-2 text-right tabular-nums">
                        <span className="text-good">+{formatCompact(app.delta)}</span>
                        <span className="ml-1.5 text-xs text-muted">{formatPercent(app.growth)}</span>
                      </td>
                      <td className="px-3 py-2 text-right tabular-nums">+{formatCompact(Math.round(app.per_day))}</td>
                      <td className="px-4 py-2" title={`${formatDate(app.start_day)} bis ${formatDate(app.end_day)}, ${app.points} Messpunkte`}>
                        <Sparkline values={series.get(Number(app.id)) ?? []} />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
        {pages > 1 ? (
          <nav className="flex items-center justify-between border-t border-border px-4 py-3 text-sm">
            {f.page > 1 ? <Link href={href(f.page - 1)} className="text-primary hover:underline">← Zurück</Link> : <span />}
            <span className="text-xs text-muted">Seite {f.page} von {pages}</span>
            {f.page < pages ? <Link href={href(f.page + 1)} className="text-primary hover:underline">Weiter →</Link> : <span />}
          </nav>
        ) : null}
      </Card>
    </>
  );
}

async function ChartMovers({ f }: { f: RisingFilters }) {
  const { countries, genres } = await chartFacets();
  const country = countries.includes(f.country) ? f.country : (countries[0] ?? "de");
  const genre = genres.includes(f.genre) ? f.genre : "36";
  const { rows, latest, before } = await chartMovers({ ...f, country, genre }, CHART_DAYS);
  const sortedGenres = [...genres].sort((a, b) => genreName(a).localeCompare(genreName(b), "de"));

  return (
    <>
      <div className="flex flex-wrap items-center gap-2 rounded-2xl border border-border bg-surface p-3 shadow-sm">
        <ParamSegmented label="Chart" name="chart" value={f.chart} fallback="top-free" options={Object.entries(CHARTS).map(([value, label]) => ({ value, label }))} />
        <ParamSegmented label="Gerät" name="device" value={f.device} fallback="iphone" options={[{ value: "iphone", label: "iPhone", icon: "iphone" }, { value: "ipad", label: "iPad", icon: "ipad" }, { value: "mac", label: "Mac", icon: "mac" }]} />
        <ParamMenu label="Land" name="country" value={country} fallback="de" icon="globe" searchable
          options={countries.map((c) => ({ value: c, label: countryName(c), hint: c.toUpperCase() }))} />
        <ParamMenu label="Kategorie" name="genre" value={genre} fallback="36" searchable
          options={sortedGenres.map((g) => ({ value: g, label: genreName(g) }))} />
      </div>

      <Card
        title={`${CHARTS[f.chart]} · ${genreName(genre)} · ${countryName(country)}`}
        aside={latest && before ? <span className="text-xs text-muted">{formatDate(latest)} gegenüber {formatDate(before)}</span> : null}
      >
        {!before ? (
          <p className="px-4 py-10 text-center text-sm text-muted">
            Für einen Vergleich über {CHART_DAYS} Tage fehlt noch Chart-Historie
            {latest ? ` (erster Tag: ${formatDate(latest)})` : ""}. Die Charts werden täglich erfasst.
          </p>
        ) : rows.length === 0 ? (
          <p className="px-4 py-10 text-center text-sm text-muted">Keine Daten für diese Auswahl.</p>
        ) : (
          <ol className="divide-y divide-border">
            {rows.map((app) => {
              const name = displayName(app.name, app.slug, app.store_id);
              const change = app.before_rank == null ? null : app.before_rank - app.rank;
              return (
                <li key={app.rank}>
                  <Link href={`/app/ios/${app.store_id}`} className="flex items-center gap-3 px-4 py-2 hover:bg-surface-2">
                    <span className="w-8 text-right font-mono text-sm font-semibold text-rank">{app.rank}</span>
                    <AppIcon url={app.icon_url} name={name} size={36} />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-medium">{name}</span>
                      <span className="block truncate text-xs text-muted">{app.developer_name ?? "–"}</span>
                    </span>
                    <span className="w-28 text-right text-xs tabular-nums">
                      {change == null ? (
                        <span className="rounded-md bg-primary-soft px-1.5 py-0.5 font-medium text-primary">neu</span>
                      ) : change > 0 ? (
                        <span className="text-good">+{change} <span className="text-muted">von {app.before_rank}</span></span>
                      ) : change < 0 ? (
                        <span className="text-bad">−{-change} <span className="text-muted">von {app.before_rank}</span></span>
                      ) : (
                        <span className="text-muted">gleich</span>
                      )}
                    </span>
                  </Link>
                </li>
              );
            })}
          </ol>
        )}
      </Card>
    </>
  );
}
