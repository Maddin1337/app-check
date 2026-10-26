import type { Metadata } from "next";
import Form from "next/form";
import Link from "next/link";
import { Suspense, type ReactNode } from "react";

import { AutoSubmitSelect } from "@/components/auto-submit";
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
          App-Store-Charts aus Apples eigenen Chart-Seiten, täglich erfasst. Google Play veröffentlicht keine Chart-Listen
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
      <Form action="/charts" className="flex flex-wrap items-end gap-2 rounded-xl border border-border bg-surface p-3">
        <Field label="Land">
          <AutoSubmitSelect name="country" defaultValue={country} className="field">
            {countries.map((c) => <option key={c} value={c}>{countryName(c)}</option>)}
          </AutoSubmitSelect>
        </Field>
        <Field label="Chart">
          <AutoSubmitSelect name="chart" defaultValue={chart} className="field">
            {Object.entries(CHARTS).map(([id, label]) => <option key={id} value={id}>{label}</option>)}
          </AutoSubmitSelect>
        </Field>
        <Field label="Kategorie">
          <AutoSubmitSelect name="genre" defaultValue={genre} className="field">
            {sortedGenres.map((g) => <option key={g} value={g}>{genreName(g)}</option>)}
          </AutoSubmitSelect>
        </Field>
        <Field label="Gerät">
          <AutoSubmitSelect name="device" defaultValue={device} className="field">
            <option value="iphone">iPhone</option>
            <option value="ipad">iPad</option>
            <option value="mac">Mac</option>
          </AutoSubmitSelect>
        </Field>
      </Form>

      <Card
        title={`${CHARTS[chart]} · ${genreName(genre)} · ${countryName(country)}`}
        aside={rows[0] ? <span className="text-xs text-muted">Stand {formatDate(rows[0].captured_on)}</span> : null}
      >
        {rows.length === 0 ? (
          <p className="px-4 py-10 text-center text-sm text-muted">
            Für diese Auswahl gibt es keine erfassten Daten{chart === "top-grossing" ? " (Top Grossing ist ein Opt-in-Feed, siehe crawler/README.md)" : ""}.
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

function Field({ label, children }: { label: string; children: ReactNode }) {
  return <label className="flex flex-col gap-1 text-xs text-muted">{label}{children}</label>;
}
