import type { Metadata } from "next";
import Form from "next/form";
import Link from "next/link";
import { Suspense } from "react";

import { AutoSubmitSelect } from "@/components/auto-submit";
import { AppIcon, Card, Skeleton } from "@/components/ui";
import { displayName, formatCompact, formatEstimate, formatNumber, formatUsd } from "@/lib/format";
import { PAGE_SIZE, publisherCategories, publisherRanking } from "@/lib/queries";

export const metadata: Metadata = { title: "Publisher" };

export default function PublishersPage({ searchParams }: PageProps<"/publishers">) {
  return (
    <div className="mx-auto max-w-6xl space-y-5">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight">Publisher</h1>
        <p className="mt-1 text-sm text-muted">
          Studios und Entwickler nach geschätztem Monatsumsatz ihrer Apps (Summe der Modell-Mediane, brutto). iOS: nur
          US App Store, Android: weltweit. Gezählt werden nur Apps mit Schätzung; Werbeeinnahmen fehlen.
        </p>
      </header>
      <Suspense fallback={<Card><Skeleton rows={12} /></Card>}>
        <Publishers searchParams={searchParams} />
      </Suspense>
    </div>
  );
}

async function Publishers({ searchParams }: { searchParams: PageProps<"/publishers">["searchParams"] }) {
  const params = await searchParams;
  const value = (key: string) => {
    const raw = params[key];
    return (Array.isArray(raw) ? raw[0] : raw) ?? "";
  };
  const platform = value("platform") === "android" ? "android" : "ios";
  const category = value("category").slice(0, 100);
  const page = Math.max(1, Number.parseInt(value("page"), 10) || 1);
  const [{ rows, total }, categoryList] = await Promise.all([
    publisherRanking(platform, category, page),
    publisherCategories(platform),
  ]);
  const pages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const href = (target: number) => {
    const query = new URLSearchParams({ platform });
    if (category) query.set("category", category);
    if (target > 1) query.set("page", String(target));
    return `/publishers?${query}`;
  };

  return (
    <>
      <Form action="/publishers" className="flex flex-wrap items-end gap-2 rounded-xl border border-border bg-surface p-3">
        <label className="flex flex-col gap-1 text-xs text-muted">
          Plattform
          <AutoSubmitSelect name="platform" defaultValue={platform} className="field">
            <option value="ios">iOS (US App Store)</option>
            <option value="android">Android (weltweit)</option>
          </AutoSubmitSelect>
        </label>
        <label className="flex flex-col gap-1 text-xs text-muted">
          Kategorie
          <AutoSubmitSelect name="category" defaultValue={category} className="field max-w-64">
            <option value="">Alle</option>
            {categoryList.map((c) => (
              <option key={c.category} value={c.category}>{c.category} ({formatCompact(c.apps)})</option>
            ))}
          </AutoSubmitSelect>
        </label>
      </Form>

      <Card title={`${formatNumber(total)} Publisher mit geschätztem Umsatz`}>
        {rows.length === 0 ? (
          <p className="px-4 py-10 text-center text-sm text-muted">Noch keine Schätzungen für diese Auswahl.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[820px] text-sm">
              <thead className="text-left text-xs text-muted">
                <tr className="border-b border-border">
                  <th className="w-10 px-4 py-2 text-right font-medium">#</th>
                  <th className="px-3 py-2 font-medium">Publisher</th>
                  <th className="px-3 py-2 font-medium">Stärkste Apps</th>
                  <th className="px-3 py-2 text-right font-medium">Apps</th>
                  <th className="px-3 py-2 text-right font-medium">Downloads/Tag</th>
                  <th className="px-4 py-2 text-right font-medium">Umsatz/Monat</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row, i) => (
                  <tr key={row.developer_id} className="border-b border-border last:border-0 hover:bg-surface-2">
                    <td className="px-4 py-2 text-right font-mono text-xs text-muted">{(page - 1) * PAGE_SIZE + i + 1}</td>
                    <td className="px-3 py-2">
                      <Link href={`/explore?platform=${platform}&developer=${encodeURIComponent(row.developer_id)}&sort=revenue`}
                        className="font-medium hover:text-primary">
                        {row.developer_name ?? row.developer_id}
                      </Link>
                    </td>
                    <td className="px-3 py-2">
                      <span className="flex items-center gap-1.5">
                        {row.top_apps.map((app) => (
                          <Link key={app.store_id} href={`/app/${platform}/${encodeURIComponent(app.store_id)}`}
                            title={`${displayName(app.name, null, app.store_id)} · ${formatUsd(app.revenue)}/Monat`}>
                            <AppIcon url={app.icon_url} name={displayName(app.name, null, app.store_id)} size={28} />
                          </Link>
                        ))}
                      </span>
                    </td>
                    <td className="px-3 py-2 text-right tabular-nums" title={`${row.apps_with_revenue} mit Umsatzschätzung`}>
                      {formatNumber(row.apps)}
                    </td>
                    <td className="px-3 py-2 text-right tabular-nums">{formatEstimate(row.downloads)}</td>
                    <td className="px-4 py-2 text-right font-medium tabular-nums">{formatUsd(row.revenue)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        {pages > 1 ? (
          <nav className="flex items-center justify-between border-t border-border px-4 py-3 text-sm">
            {page > 1 ? <Link href={href(page - 1)} className="text-primary hover:underline">← Zurück</Link> : <span />}
            <span className="text-xs text-muted">Seite {page} von {pages}</span>
            {page < pages ? <Link href={href(page + 1)} className="text-primary hover:underline">Weiter →</Link> : <span />}
          </nav>
        ) : null}
      </Card>
    </>
  );
}
