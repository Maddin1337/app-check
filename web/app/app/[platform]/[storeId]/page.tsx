import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";

import { AppIcon, Card, ConfidenceBadge, PlatformBadge, RankBadge, Skeleton, Stat } from "@/components/ui";
import { CHARTS, DEVICES, countryName, genreName } from "@/lib/catalog";
import { displayName, formatCompact, formatDate, formatEstimate, formatNumber, formatPrice, formatUsd, storeUrl } from "@/lib/format";
import { appDetail } from "@/lib/queries";

export default function AppPage({ params }: PageProps<"/app/[platform]/[storeId]">) {
  return (
    <div className="mx-auto max-w-6xl space-y-5">
      <Link href="/explore" className="text-sm text-primary hover:underline">← App-Explorer</Link>
      <Suspense fallback={<Card><Skeleton rows={6} /></Card>}>
        <AppDetail params={params} />
      </Suspense>
    </div>
  );
}

async function AppDetail({ params }: { params: PageProps<"/app/[platform]/[storeId]">["params"] }) {
  const { platform, storeId } = await params;
  if (platform !== "ios" && platform !== "android") notFound();
  const detail = await appDetail(platform, decodeURIComponent(storeId));
  if (!detail) notFound();
  const { app, ranks, metrics, siblings, estimate, monetization, iaps } = detail;
  const name = displayName(app.name, app.slug, app.store_id);

  return (
    <>
      <header className="flex flex-wrap items-start gap-4">
        <AppIcon url={app.icon_url} name={name} size={72} />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-2xl font-semibold tracking-tight">{name}</h1>
            <PlatformBadge platform={app.platform} />
            {app.status !== "active" ? (
              <span className="rounded-md bg-surface-2 px-1.5 py-0.5 text-[11px] text-muted">
                {app.status === "not_found" ? "im Store nicht gefunden" : "Metadaten folgen"}
              </span>
            ) : null}
          </div>
          <p className="mt-1 text-sm text-muted">
            {[app.developer_name, app.category, app.content_rating].filter(Boolean).join(" · ") || "Noch keine Metadaten abgerufen"}
          </p>
          {siblings.length ? (
            <p className="mt-1 text-xs text-muted">
              Auch auf:{" "}
              {siblings.map((s) => (
                <Link key={s.store_id} href={`/app/${s.platform}/${encodeURIComponent(s.store_id)}`} className="text-primary hover:underline">
                  {s.platform === "ios" ? "iOS" : "Android"}
                </Link>
              ))}
            </p>
          ) : null}
        </div>
        <a href={storeUrl(app.platform, app.store_id)} target="_blank" rel="noreferrer"
          className="rounded-lg border border-border bg-surface px-3 py-2 text-sm font-medium hover:bg-surface-2">
          Im Store öffnen ↗
        </a>
      </header>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-6">
        <Stat label="Bewertungen" value={formatCompact(app.rating_count)}
          hint={app.platform === "ios" && app.refresh_country ? `Store ${app.refresh_country.toUpperCase()}` : "weltweit"} />
        <Stat label="Ø Bewertung" value={app.rating_avg ? `★ ${app.rating_avg.toFixed(2)}` : "–"} />
        {app.platform === "android" ? (
          <Stat label="Installationen (exakt)" value={formatNumber(app.installs_exact)}
            hint={app.installs_bucket ? `Store zeigt ${formatCompact(app.installs_bucket)}+` : undefined} />
        ) : (
          <Stat label="Bester Chart-Platz" value={<RankBadge rank={ranks[0]?.rank ?? null} />}
            hint={ranks.length ? `${ranks.length} Chart-Einträge` : "nicht in den Charts"} />
        )}
        <Stat label="Preis" value={formatPrice(app.price, app.currency)} hint={app.iap_price_range ?? undefined} />
        <Stat label="Veröffentlicht" value={formatDate(app.released_at)} />
        <Stat label="Letztes Update" value={formatDate(app.store_updated_at)} hint={app.version ? `Version ${app.version}` : undefined} />
      </div>

      <div className="grid gap-5 lg:grid-cols-2">
        <Card
          title="Downloads und Umsatz (Schätzung)"
          aside={estimate ? <span className="text-xs text-muted">Modell {estimate.model_version} · {formatDate(estimate.day)}</span> : null}
        >
          {!estimate ? (
            <p className="px-4 py-6 text-sm text-muted">
              Noch keine Schätzung. Dafür braucht die App einen Chart-Platz im US App Store oder Messwerte von mindestens
              zwei Tagen (iOS: Bewertungen im US-Store, Android: Installationen).
            </p>
          ) : (
            <div className="space-y-4 px-4 py-4">
              <div className="grid grid-cols-2 gap-3">
                <EstimateStat label="Downloads pro Tag" value={formatEstimate(estimate.downloads_p50)}
                  range={`${formatEstimate(estimate.downloads_p10)} – ${formatEstimate(estimate.downloads_p90)}`}
                  confidence={estimate.confidence} />
                <EstimateStat label="Umsatz pro Monat (brutto)"
                  value={estimate.revenue_p50 == null ? "–" : formatUsd(estimate.revenue_p50)}
                  range={estimate.revenue_p50 == null ? "Monetarisierung noch unbekannt"
                    : `${formatUsd(estimate.revenue_p10)} – ${formatUsd(estimate.revenue_p90)} · netto ≈ ${formatUsd(estimate.revenue_net_p50)}`}
                  confidence={estimate.revenue_p50 == null ? null : estimate.confidence} />
              </div>
              <p className="text-xs leading-relaxed text-muted">
                {METHOD_TEXT[estimate.download_method] ?? estimate.download_method}{" "}
                {estimate.scope === "us" ? "Gilt nur für den US App Store." : "Weltweit."}{" "}
                {estimate.monetization ? MONETIZATION_TEXT[estimate.monetization] : ""}{" "}
                Spanne = P10 bis P90. Werbeeinnahmen sind nicht enthalten. Methodik: docs/research/04-schaetzmodelle.md.
              </p>
            </div>
          )}
        </Card>

        <Card
          title="In-App-Käufe"
          aside={monetization ? <span className="text-xs text-muted">{monetization.country === "ww" ? "Google Play" : `Store ${monetization.country.toUpperCase()}`} · {formatDate(monetization.fetched_at)}</span> : null}
        >
          {!monetization ? (
            <p className="px-4 py-6 text-sm text-muted">Noch nicht erfasst. Die Preisliste wird für wichtige Apps wöchentlich gelesen.</p>
          ) : (
            <div className="px-4 py-3">
              <p className="pb-2 text-sm">
                <span className="font-medium">{MODEL_LABEL[monetization.model] ?? monetization.model}</span>
                {monetization.sub_annual_price ? <span className="text-muted"> · Abo ≈ {formatPrice(monetization.sub_annual_price, monetization.currency)} pro Jahr</span> : null}
                {monetization.country === "ww" && monetization.iap_min ? <span className="text-muted"> · {formatPrice(monetization.iap_min, monetization.currency)} – {formatPrice(monetization.iap_max, monetization.currency)} pro Artikel</span> : null}
              </p>
              {iaps.length ? (
                <table className="w-full text-sm">
                  <tbody>
                    {iaps.map((iap) => (
                      <tr key={iap.position} className="border-t border-border">
                        <td className="py-1.5 pr-3">{iap.name}</td>
                        <td className="py-1.5 text-right tabular-nums">{formatPrice(iap.price, iap.currency)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : null}
            </div>
          )}
        </Card>

        <Card title="Chart-Platzierungen" aside={<span className="text-xs text-muted">letzter erfasster Tag</span>}>
          {ranks.length === 0 ? (
            <p className="px-4 py-6 text-sm text-muted">In keinem der erfassten Charts.</p>
          ) : (
            <table className="w-full text-sm">
              <tbody>
                {ranks.slice(0, 25).map((r) => (
                  <tr key={`${r.country}-${r.device}-${r.chart}-${r.genre_id}`} className="border-b border-border last:border-0">
                    <td className="px-4 py-2"><RankBadge rank={r.rank} /></td>
                    <td className="px-3 py-2">{CHARTS[r.chart] ?? r.chart}</td>
                    <td className="px-3 py-2 text-muted">{genreName(r.genre_id)}</td>
                    <td className="px-4 py-2 text-right text-muted">{countryName(r.country)} · {DEVICES[r.device] ?? r.device}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </Card>

        <Card title="Tägliche Messwerte" aside={<span className="text-xs text-muted">Historie wächst jeden Tag</span>}>
          {metrics.length === 0 ? (
            <p className="px-4 py-6 text-sm text-muted">Noch keine Messwerte. Sie entstehen bei jeder Aktualisierung.</p>
          ) : (
            <table className="w-full text-sm">
              <thead className="text-left text-xs text-muted">
                <tr className="border-b border-border">
                  <th className="px-4 py-2 font-medium">Tag</th>
                  <th className="px-3 py-2 font-medium">Store</th>
                  <th className="px-3 py-2 text-right font-medium">Bewertungen</th>
                  <th className="px-4 py-2 text-right font-medium">{app.platform === "android" ? "Installationen" : "Ø"}</th>
                </tr>
              </thead>
              <tbody>
                {metrics.map((m) => (
                  <tr key={`${m.day.toISOString()}-${m.country}`} className="border-b border-border last:border-0">
                    <td className="px-4 py-2 tabular-nums">{formatDate(m.day)}</td>
                    <td className="px-3 py-2 text-muted">{m.country === "ww" ? "weltweit" : m.country.toUpperCase()}</td>
                    <td className="px-3 py-2 text-right tabular-nums">{formatNumber(m.rating_count)}</td>
                    <td className="px-4 py-2 text-right tabular-nums">
                      {app.platform === "android" ? formatNumber(m.installs_exact) : m.rating_avg?.toFixed(2) ?? "–"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </Card>
      </div>

      <Card title="Details">
        <dl className="grid gap-x-6 gap-y-3 px-4 py-4 text-sm sm:grid-cols-2 lg:grid-cols-3">
          <Detail label="Store-ID" value={app.store_id} mono />
          {app.bundle_id ? <Detail label="Bundle-ID" value={app.bundle_id} mono /> : null}
          <Detail label="Größe" value={app.size_bytes ? `${formatNumber(Math.round(app.size_bytes / 1e6))} MB` : "–"} />
          <Detail label="Mindest-OS" value={app.min_os ?? "–"} />
          <Detail label="Sprachen" value={app.languages?.length ? `${app.languages.length} (${app.languages.slice(0, 6).join(", ")}${app.languages.length > 6 ? " …" : ""})` : "–"} />
          {app.platform === "android" ? (
            <>
              <Detail label="Enthält Werbung" value={app.contains_ads == null ? "–" : app.contains_ads ? "Ja" : "Nein"} />
              <Detail label="In-App-Käufe" value={app.offers_iap == null ? "–" : app.offers_iap ? app.iap_price_range ?? "Ja" : "Nein"} />
            </>
          ) : null}
          <Detail label="Im Katalog seit" value={`${formatDate(app.first_seen_at)} (${app.discovered_via})`} />
          <Detail label="Zuletzt abgerufen" value={app.refreshed_at ? `${formatDate(app.refreshed_at)} · Tier T${app.tier}` : `noch nie · Tier T${app.tier}`} />
        </dl>
      </Card>
    </>
  );
}

const METHOD_TEXT: Record<string, string> = {
  chart: "Downloads aus dem Platz in den US-Gesamtcharts (Top Free/Paid, Median der letzten 3 Tage) über eine Rangkurve mit Literaturwerten.",
  "chart-category": "Downloads aus dem Platz in einem US-Kategorie-Chart, skaliert über Apps, die zugleich in den Gesamtcharts stehen.",
  ratings: "Downloads aus dem Zuwachs der Bewertungen im US-Store, umgerechnet mit dem Verhältnis Downloads je Bewertung der Chart-Apps.",
  installs: "Downloads gemessen: tägliche Zunahme der exakten Installationszahl auf Google Play.",
};

const MONETIZATION_TEXT: Record<string, string> = {
  subscription: "Umsatz über einen Erlös pro Download für Abo-Apps (Benchmark RevenueCat), angepasst an den Abo-Preis.",
  iap: "Umsatz über einen Erlös pro Download für In-App-Käufe, angepasst an das Preisniveau.",
  paid: "Umsatz = Downloads × Kaufpreis.",
  free: "Keine In-App-Käufe und kein Kaufpreis: kein Store-Umsatz.",
};

const MODEL_LABEL: Record<string, string> = {
  subscription: "Abo",
  iap: "In-App-Käufe",
  paid: "Kauf-App",
  free: "Kostenlos ohne In-App-Käufe",
};

function EstimateStat({ label, value, range, confidence }: {
  label: string; value: string; range: string; confidence: "low" | "medium" | "high" | null;
}) {
  return (
    <div className="rounded-lg bg-surface-2 px-3 py-2">
      <div className="text-xs text-muted">{label}</div>
      <div className="mt-0.5 flex items-center gap-2 text-xl font-semibold tracking-tight">
        {value}
        <ConfidenceBadge confidence={confidence} />
      </div>
      <div className="mt-0.5 text-xs text-muted">{range}</div>
    </div>
  );
}

function Detail({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="min-w-0">
      <dt className="text-xs text-muted">{label}</dt>
      <dd className={`mt-0.5 truncate ${mono ? "font-mono text-xs" : ""}`}>{value}</dd>
    </div>
  );
}
