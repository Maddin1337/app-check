import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";

import { ParamMenu, ParamSegmented } from "@/components/url-controls";
import { AppIcon, Card, Skeleton } from "@/components/ui";
import { CHARTS, countryName, genreName } from "@/lib/catalog";
import { displayName, formatCompact, formatDate } from "@/lib/format";
import { chartFacets, chartList } from "@/lib/queries";

export const metadata: Metadata = { title: "Rankings" };

export default function ChartsPage({ searchParams }: PageProps<"/charts">) {
  return (
    <div className="mx-auto max-w-5xl space-y-5">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight">Rankings</h1>
        <p className="mt-1 text-sm text-muted">
          App-Store-Charts, täglich erfasst: Top Free und Top Paid aus Apples Chart-Seiten (200 Plätze), Top Grossing
          aus Apples RSS-Feed (100 Plätze). Google Play veröffentlicht keine Chart-Listen
          außerhalb seiner gesperrten internen Schnittstelle; dort messen wir stattdessen die exakten Installationen.
        </p>
      </header>
      <Suspense fallback={<Card><Skeleton rows={12} /></Card>}>
        <Charts searchParams={searchParams} />
      </Suspense>
    </div>
  );
}

async function Charts({ searchParams }: { searchParams: PageProps<"/charts">["searchParams"] }) {
  const params = await searchParams;
  const value = (key: string, fallback: string) => {
    const raw = params[key];
    return (Array.isArray(raw) ? raw[0] : raw) || fallback;
  };
  const { countries, genres } = await chartFacets();
  if (countries.length === 0) {
    return <Card><p className="px-4 py-10 text-center text-sm text-muted">Noch keine Charts erfasst.</p></Card>;
  }
  const country = countries.includes(value("country", "de")) ? value("country", "de") : countries[0];
  const chart = Object.keys(CHARTS).includes(value("chart", "top-free")) ? value("chart", "top-free") : "top-free";
  const genre = genres.includes(value("genre", "36")) ? value("genre", "36") : "36";
  const device = ["iphone", "ipad", "mac"].includes(value("device", "iphone")) ? value("device", "iphone") : "iphone";
  const rows = await chartList(country, chart, genre, device);
  const sortedGenres = [...genres].sort((a, b) => genreName(a).localeCompare(genreName(b), "de"));

  return (
    <>
      <div className="flex flex-wrap items-center gap-2 rounded-2xl border border-border bg-surface p-3 shadow-sm">
        <ParamSegmented label="Chart" name="chart" value={chart} fallback="top-free" options={Object.entries(CHARTS).map(([value, label]) => ({ value, label }))} />
        <ParamSegmented label="Gerät" name="device" value={device} fallback="iphone" options={[{ value: "iphone", label: "iPhone", icon: "iphone" }, { value: "ipad", label: "iPad", icon: "ipad" }, { value: "mac", label: "Mac", icon: "mac" }]} />
        <ParamMenu label="Land" name="country" value={country} fallback="de" icon="globe" searchable
          options={countries.map((c) => ({ value: c, label: countryName(c), hint: c.toUpperCase() }))} />
        <ParamMenu label="Kategorie" name="genre" value={genre} fallback="36" searchable
          options={sortedGenres.map((g) => ({ value: g, label: genreName(g) }))} />
      </div>

      <Card
        title={`${CHARTS[chart]} · ${genreName(genre)} · ${countryName(country)}`}
        aside={rows[0] ? <span className="text-xs text-muted">Stand {formatDate(rows[0].captured_on)}</span> : null}
      >
        {rows.length === 0 ? (
          <p className="px-4 py-10 text-center text-sm text-muted">
            Für diese Auswahl gibt es keine erfassten Daten{chart === "top-grossing" ? " (Top Grossing gibt es nur für iPhone und iPad, 100 Plätze tief)" : ""}.
          </p>
        ) : (
          <ol className="divide-y divide-border">
            {rows.map((app) => {
              const name = displayName(app.name, app.slug, app.store_id);
              return (
                <li key={app.rank}>
                  <Link href={`/app/ios/${app.store_id}`} className="flex items-center gap-3 px-4 py-2 hover:bg-surface-2">
                    <span className="w-8 text-right font-mono text-sm font-semibold text-rank">{app.rank}</span>
                    <AppIcon url={app.icon_url} name={name} size={36} />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-medium">{name}</span>
                      <span className="block truncate text-xs text-muted">{app.developer_name ?? (app.status === "active" ? "–" : "Metadaten folgen")}</span>
                    </span>
                    <span className="hidden text-xs text-muted sm:block">{app.category ?? ""}</span>
                    <span className="w-24 text-right text-xs tabular-nums text-muted">
                      {app.rating_count != null ? `${formatCompact(app.rating_count)} Bew.` : ""}
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
