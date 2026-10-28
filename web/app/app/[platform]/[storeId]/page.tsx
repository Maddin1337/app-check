import {
  ArrowLeft, ArrowUpRight, BarChart3, CalendarClock, Download, Info, Megaphone, Receipt, Rss, Star, Table2,
  TrendingUp, Trophy, type LucideIcon,
} from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense, type ReactNode } from "react";

import { AreaChart } from "@/components/area-chart";
import { EVENT_LABEL, EventText } from "@/components/event-text";
import { AppIcon, Card, ConfidenceBadge, PlatformBadge, RankBadge, Skeleton } from "@/components/ui";
import { CHARTS, DEVICES, countryName, genreName } from "@/lib/catalog";
import { displayName, formatCompact, formatDate, formatEstimate, formatNumber, formatPrice, formatUsd, storeUrl } from "@/lib/format";
import { appDetail, appEvents } from "@/lib/queries";

type Detail = NonNullable<Awaited<ReturnType<typeof appDetail>>>;
type Events = Awaited<ReturnType<typeof appEvents>>[number][];

const TABS = [
  { id: "overview", label: "Übersicht", icon: TrendingUp },
  { id: "charts", label: "Charts", icon: BarChart3 },
  { id: "ads", label: "Werbung", icon: Megaphone },
  { id: "pricing", label: "Preise", icon: Receipt },
  { id: "events", label: "Ereignisse", icon: Rss },
  { id: "data", label: "Messwerte", icon: Table2 },
  { id: "details", label: "Details", icon: Info },
] as const;
type TabId = (typeof TABS)[number]["id"];

export default function AppPage({ params, searchParams }: PageProps<"/app/[platform]/[storeId]">) {
  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <Link href="/explore" className="inline-flex items-center gap-1.5 text-sm text-muted hover:text-text">
        <ArrowLeft className="size-4" /> App-Explorer
      </Link>
      <Suspense fallback={<Card><Skeleton rows={6} /></Card>}>
        <AppDetail params={params} searchParams={searchParams} />
      </Suspense>
    </div>
  );
}

async function AppDetail({ params, searchParams }: {
  params: PageProps<"/app/[platform]/[storeId]">["params"];
  searchParams: PageProps<"/app/[platform]/[storeId]">["searchParams"];
}) {
  const { platform, storeId } = await params;
  if (platform !== "ios" && platform !== "android") notFound();
  const detail = await appDetail(platform, decodeURIComponent(storeId));
  if (!detail) notFound();
  const events = await appEvents(detail.app.id);
  const rawTab = (await searchParams).tab;
  const tab: TabId = TABS.some((t) => t.id === rawTab) ? (rawTab as TabId) : "overview";
  const base = `/app/${platform}/${encodeURIComponent(detail.app.store_id)}`;
  const counts: Partial<Record<TabId, number>> = {
    charts: detail.ranks.length, ads: detail.appleAds?.ads ?? 0, pricing: detail.iaps.length, events: events.length,
  };

  return (
    <>
      <Hero detail={detail} />
      <Screenshots detail={detail} />
      <nav className="card flex gap-1 overflow-x-auto p-1 text-sm" aria-label="Bereiche">
        {TABS.map((t) => {
          const Icon = t.icon;
          const active = t.id === tab;
          return (
            <Link key={t.id} href={t.id === "overview" ? base : `${base}?tab=${t.id}`} scroll={false}
              aria-current={active ? "page" : undefined}
              className={`inline-flex shrink-0 items-center gap-1.5 rounded-xl px-3.5 py-2 font-medium whitespace-nowrap transition-colors ${
                active ? "bg-primary-soft text-primary shadow-[inset_0_0_0_1px_rgb(157_140_255/0.3)]" : "text-muted hover:bg-surface-2 hover:text-text"}`}>
              <Icon className="size-4" />
              {t.label}
              {counts[t.id] ? <span className="rounded-full bg-surface-2 px-1.5 text-[11px] text-muted">{formatCompact(counts[t.id]!)}</span> : null}
            </Link>
          );
        })}
      </nav>
      {tab === "overview" ? <Overview detail={detail} events={events} base={base} /> : null}
      {tab === "charts" ? <ChartsTab detail={detail} /> : null}
      {tab === "ads" ? <AdsTab detail={detail} /> : null}
      {tab === "pricing" ? <PricingTab detail={detail} /> : null}
      {tab === "events" ? <EventsTab events={events} /> : null}
      {tab === "data" ? <DataTab detail={detail} /> : null}
      {tab === "details" ? <DetailsTab detail={detail} /> : null}
    </>
  );
}

function Hero({ detail }: { detail: Detail }) {
  const { app, ranks, siblings, estimate, monetization, kpis } = detail;
  const name = displayName(app.name, app.slug, app.store_id);
  const tags = [app.category, app.content_rating, monetization ? MODEL_LABEL[monetization.model] : null,
    app.price != null ? formatPrice(app.price, app.currency) : null].filter(Boolean) as string[];
  const best = ranks[0];
  return (
    <section className="card relative overflow-hidden p-5 md:p-7">
      <div aria-hidden className="pointer-events-none absolute -top-24 right-0 h-64 w-[36rem] rounded-full bg-[radial-gradient(closest-side,rgb(124_92_255/0.28),transparent)]" />
      <div className="relative flex flex-wrap items-start gap-5">
        <div className="rounded-[26%] shadow-[0_0_40px_-8px_rgb(124_92_255/0.7)]">
          <AppIcon url={app.icon_url} name={name} size={88} />
        </div>
        <div className="min-w-0 flex-1 basis-56">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-2xl font-semibold tracking-tight break-words sm:text-3xl md:text-4xl">{name}</h1>
            <PlatformBadge platform={app.platform} />
            {app.status !== "active" ? (
              <span className="rounded-md bg-surface-2 px-1.5 py-0.5 text-[11px] text-muted">
                {app.status === "not_found" ? "im Store nicht gefunden" : "Metadaten folgen"}
              </span>
            ) : null}
          </div>
          <p className="mt-1 text-sm">
            {app.developer_name && app.developer_id ? (
              <Link href={`/explore?platform=${app.platform}&developer=${encodeURIComponent(app.developer_id)}&sort=revenue`}
                className="text-primary hover:underline">{app.developer_name}</Link>
            ) : <span className="text-muted">{app.developer_name ?? "Noch keine Metadaten abgerufen"}</span>}
          </p>
          <div className="mt-3 flex flex-wrap gap-1.5">
            {tags.map((tag) => <span key={tag} className="rounded-full border border-border bg-surface-2 px-2.5 py-0.5 text-xs text-muted">{tag}</span>)}
            {siblings.map((s) => (
              <Link key={s.store_id} href={`/app/${s.platform}/${encodeURIComponent(s.store_id)}`}
                className="rounded-full border border-primary/30 bg-primary-soft px-2.5 py-0.5 text-xs text-primary hover:border-primary">
                Auch auf {s.platform === "ios" ? "iOS" : "Android"} →
              </Link>
            ))}
          </div>
        </div>
        <a href={storeUrl(app.platform, app.store_id)} target="_blank" rel="noreferrer"
          className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-gradient-to-r sm:w-auto from-[#b9adff] to-[#7c5cff] px-4 py-2 text-sm font-semibold text-[#0a0812] shadow-[0_0_24px_-6px_rgb(124_92_255/0.9)] hover:brightness-110">
          Im Store öffnen <ArrowUpRight className="size-4" />
        </a>
      </div>

      <div className="relative mt-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Kpi icon={Download} label="Downloads pro Tag"
          value={estimate?.downloads_p50 != null ? formatEstimate(estimate.downloads_p50) : "–"}
          sub={estimate?.downloads_p50 != null ? `${formatEstimate(estimate.downloads_p10)} – ${formatEstimate(estimate.downloads_p90)}` : "noch keine Schätzung"}
          badge={estimate?.downloads_p50 != null ? <ConfidenceBadge confidence={estimate.confidence} /> : null} />
        <Kpi icon={Receipt} label="Umsatz pro Monat" accent
          value={estimate?.revenue_p50 != null ? formatUsd(estimate.revenue_p50) : "–"}
          sub={estimate?.revenue_p50 != null ? `${formatUsd(estimate.revenue_p10)} – ${formatUsd(estimate.revenue_p90)}, brutto` : "noch keine Schätzung"}
          badge={estimate?.revenue_p50 != null ? <ConfidenceBadge confidence={estimate.confidence} /> : null} />
        <Kpi icon={Star} label="Bewertungen" value={formatCompact(app.rating_count)}
          sub={`${app.rating_avg ? `Ø ${app.rating_avg.toFixed(2)} · ` : ""}${app.platform === "ios" && app.refresh_country ? `Store ${app.refresh_country.toUpperCase()}` : "weltweit"}`} />
        {app.platform === "android" ? (
          <Kpi icon={Download} label="Installationen (exakt)" value={formatCompact(app.installs_exact)}
            sub={app.installs_bucket ? `Store zeigt ${formatCompact(app.installs_bucket)}+` : "Google Play"} />
        ) : (
          <Kpi icon={Trophy} label="Bester Chart-Platz" value={best ? `#${best.rank}` : "–"}
            sub={best ? `${CHARTS[best.chart] ?? best.chart} · ${countryName(best.country)} · ${kpis.countries_today} Länder` : "nicht in den Charts"} />
        )}
      </div>
    </section>
  );
}

function Kpi({ icon: Icon, label, value, sub, badge, accent = false }: {
  icon: LucideIcon; label: string; value: string; sub: string; badge?: ReactNode; accent?: boolean;
}) {
  return (
    <div className={`rounded-2xl border p-4 ${accent ? "border-primary/40 bg-primary-soft/60" : "border-border bg-surface-2/60"}`}>
      <div className="flex items-center gap-1.5 text-xs text-muted"><Icon className="size-3.5" />{label}</div>
      <div className="mt-2 flex items-center gap-2">
        <span className={`text-2xl font-semibold tracking-tight md:text-3xl ${accent ? "text-gradient" : ""}`}>{value}</span>
        {badge}
      </div>
      <div className="mt-1 truncate text-xs text-muted">{sub}</div>
    </div>
  );
}

function Screenshots({ detail }: { detail: Detail }) {
  const shots = detail.storePage?.screenshots ?? [];
  if (!shots.length) return null;
  return (
    <div className="-mx-1 flex gap-3 overflow-x-auto px-1 pb-1">
      {shots.map((shot, i) => {
        const width = 170;
        const height = shot.width && shot.height ? Math.round((width * shot.height) / shot.width) : 370;
        const src = shot.template.replace("{w}", String(width * 2)).replace("{h}", String(height * 2))
          .replace("{c}", "bb").replace("{f}", "jpg");
        return (
          // eslint-disable-next-line @next/next/no-img-element -- Apple's CDN serves the requested size
          <img key={i} src={src} alt={`Screenshot ${i + 1}`} width={width} height={height} loading="lazy"
            className="shrink-0 rounded-2xl border border-border bg-surface-2 shadow-[0_10px_30px_-15px_rgb(0_0_0/0.9)]" />
        );
      })}
    </div>
  );
}

function Overview({ detail, events, base }: { detail: Detail; events: Events; base: string }) {
  const { app, estimate, estimateHistory, metricHistory, storePage, kpis } = detail;
  const installs = app.platform === "android";
  return (
    <div className="grid gap-5 lg:grid-cols-2">
      <Card title="Umsatz pro Monat (Schätzung)" aside={<span className="text-xs text-muted">P10–P90 als Band</span>}>
        <div className="p-4">
          <AreaChart format={formatUsd} emptyText="Der Verlauf entsteht mit jedem Tag, an dem die App geschätzt wird."
            points={estimateHistory.map((e) => ({ day: e.day, value: e.revenue_p50, low: e.revenue_p10, high: e.revenue_p90 }))} />
        </div>
      </Card>
      <Card title={installs ? "Installationen" : "Bewertungen"}
        aside={<span className="text-xs text-muted">{installs ? "Google Play, weltweit" : `Store ${(app.refresh_country ?? "us").toUpperCase()}`}</span>}>
        <div className="p-4">
          <AreaChart format={(v) => formatCompact(v)} emptyText="Der Verlauf entsteht mit jedem Messtag."
            points={metricHistory.map((m) => ({ day: m.day, value: installs ? m.installs_exact : m.rating_count }))} />
        </div>
      </Card>

      <Card title="So entsteht die Schätzung"
        aside={estimate ? <span className="text-xs text-muted">Modell {estimate.model_version} · {formatDate(estimate.day)}</span> : null}>
        <div className="space-y-3 p-4 text-sm leading-relaxed text-muted">
          {!estimate ? (
            <p>Noch keine Schätzung. Dafür braucht die App einen Chart-Platz im US App Store oder Messwerte von mindestens zwei Tagen.</p>
          ) : (
            <>
              {estimate.download_method ? <p>{METHOD_TEXT[estimate.download_method] ?? estimate.download_method}</p> : null}
              <p>
                {estimate.revenue_method && REVENUE_METHOD_TEXT[estimate.revenue_method]
                  ? REVENUE_METHOD_TEXT[estimate.revenue_method]
                  : estimate.monetization ? MONETIZATION_TEXT[estimate.monetization] : "Monetarisierung noch unbekannt."}
              </p>
              <p>
                {estimate.scope === "us" ? "Gilt für den US App Store." : "Weltweit."} Netto nach Store-Gebühr ≈{" "}
                {formatUsd(estimate.revenue_net_p50)}. Werbeeinnahmen sind nicht enthalten.{" "}
                <Link href="/methodik" className="text-primary hover:underline">Zur Methodik</Link>
              </p>
            </>
          )}
          <div className="grid grid-cols-2 gap-3 border-t border-border pt-3">
            <MiniStat icon={Trophy} label="Tage in den Top 100" value={formatNumber(kpis.days_top100)} />
            <MiniStat icon={BarChart3} label="Länder mit Chartplatz" value={formatNumber(kpis.countries_today)} />
            <MiniStat icon={TrendingUp} label="Spitzenumsatz pro Tag" value={kpis.peak_revenue_day == null ? "–" : formatUsd(kpis.peak_revenue_day)} />
            <MiniStat icon={CalendarClock} label="Letztes Update" value={formatDate(app.store_updated_at)} />
          </div>
        </div>
      </Card>

      {storePage?.rating_counts ? <RatingHistogram counts={storePage.rating_counts.map(Number)} /> : (
        <Card title="Neueste Ereignisse">
          <EventList events={events.slice(0, 6)} />
        </Card>
      )}
      {storePage?.rating_counts ? (
        <div className="lg:col-span-2">
          <Card title="Neueste Ereignisse" aside={<Link href={`${base}?tab=events`} scroll={false} className="text-xs text-primary hover:underline">Alle ansehen</Link>}>
            <EventList events={events.slice(0, 6)} />
          </Card>
        </div>
      ) : null}
    </div>
  );
}

function MiniStat({ icon: Icon, label, value }: { icon: LucideIcon; label: string; value: string }) {
  return (
    <div>
      <div className="flex items-center gap-1.5 text-xs"><Icon className="size-3.5" />{label}</div>
      <div className="mt-0.5 font-semibold text-text">{value}</div>
    </div>
  );
}

function EventList({ events }: { events: Events }) {
  if (events.length === 0) return <p className="px-4 py-6 text-sm text-muted">Noch keine Ereignisse erfasst.</p>;
  return (
    <ul className="divide-y divide-border">
      {events.map((event) => (
        <li key={`${event.day.toISOString()}-${event.kind}-${event.country}-${event.chart}`} className="flex gap-3 px-4 py-2.5 text-sm">
          <span className="w-20 shrink-0 tabular-nums text-muted">{formatDate(event.day)}</span>
          <span className="min-w-0 flex-1"><span className="font-medium">{EVENT_LABEL[event.kind]}:</span> <EventText event={event} /></span>
        </li>
      ))}
    </ul>
  );
}

function ChartsTab({ detail }: { detail: Detail }) {
  const { ranks } = detail;
  return (
    <Card title="Chart-Platzierungen" aside={<span className="text-xs text-muted">letzter erfasster Tag</span>}>
      {ranks.length === 0 ? <p className="px-4 py-6 text-sm text-muted">In keinem der erfassten Charts.</p> : (
        <table className="w-full text-sm">
          <tbody>
            {ranks.map((r) => (
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
  );
}

function AdsTab({ detail }: { detail: Detail }) {
  const ads = detail.appleAds;
  return (
    <Card title="Apple-Anzeigen in der EU"
      aside={<span className="text-xs text-muted">Apple Ad Repository{ads?.data_end ? `, Daten bis ${formatDate(ads.data_end)}` : ""}</span>}>
      {!ads ? <p className="px-4 py-6 text-sm text-muted">Noch nicht abgefragt. Apps mit Schätzung oder Chartplatz werden wöchentlich geprüft.</p>
        : ads.ads === 0 ? <p className="px-4 py-6 text-sm text-muted">Keine Apple-Search-Ads-Anzeigen in den letzten 90 Tagen.</p> : (
          <dl className="grid gap-x-6 gap-y-4 p-4 text-sm sm:grid-cols-2">
            <DetailItem label="Anzeigen (je Land gezählt)" value={formatNumber(ads.ads)} />
            <DetailItem label="Zeitraum" value={`${formatDate(ads.first_impression)} bis ${formatDate(ads.last_impression)}`} />
            <DetailItem label="Platzierungen" value={ads.placements.map((p) => PLACEMENT_LABEL[p] ?? p).join(", ")} />
            <DetailItem label="Formate" value={ads.formats.join(", ") || "–"} />
            <div className="sm:col-span-2">
              <dt className="text-xs text-muted">Länder ({ads.countries.length})</dt>
              <dd className="mt-1.5 flex flex-wrap gap-1.5">
                {[...ads.countries].sort().map((c) => (
                  <span key={c} className="rounded-full border border-border bg-surface-2 px-2 py-0.5 text-xs">{countryName(c)}</span>
                ))}
              </dd>
            </div>
          </dl>
        )}
    </Card>
  );
}

function PricingTab({ detail }: { detail: Detail }) {
  const { monetization, iaps } = detail;
  return (
    <Card title="In-App-Käufe"
      aside={monetization ? <span className="text-xs text-muted">{monetization.country === "ww" ? "Google Play" : `Store ${monetization.country.toUpperCase()}`} · {formatDate(monetization.fetched_at)}</span> : null}>
      {!monetization ? <p className="px-4 py-6 text-sm text-muted">Noch nicht erfasst. Die Preisliste wird für wichtige Apps wöchentlich gelesen.</p> : (
        <div className="p-4">
          <p className="pb-3 text-sm">
            <span className="font-medium">{MODEL_LABEL[monetization.model] ?? monetization.model}</span>
            {monetization.sub_annual_price ? <span className="text-muted"> · Abo ≈ {formatPrice(monetization.sub_annual_price, monetization.currency)} pro Jahr</span> : null}
            {monetization.country === "ww" && monetization.iap_min ? <span className="text-muted"> · {formatPrice(monetization.iap_min, monetization.currency)} – {formatPrice(monetization.iap_max, monetization.currency)} pro Artikel</span> : null}
          </p>
          {iaps.length ? (
            <div className="grid gap-2 sm:grid-cols-2">
              {iaps.map((iap) => (
                <div key={iap.position} className="flex items-center justify-between rounded-xl border border-border bg-surface-2/60 px-3 py-2 text-sm">
                  <span className="truncate pr-3">{iap.name}</span>
                  <span className="font-semibold tabular-nums">{formatPrice(iap.price, iap.currency)}</span>
                </div>
              ))}
            </div>
          ) : null}
        </div>
      )}
    </Card>
  );
}

function EventsTab({ events }: { events: Events }) {
  return <Card title="Ereignisse" aside={<span className="text-xs text-muted">letzte 30</span>}><EventList events={events} /></Card>;
}

function DataTab({ detail }: { detail: Detail }) {
  const { app, metrics } = detail;
  return (
    <Card title="Tägliche Messwerte" aside={<span className="text-xs text-muted">Historie wächst jeden Tag</span>}>
      {metrics.length === 0 ? <p className="px-4 py-6 text-sm text-muted">Noch keine Messwerte.</p> : (
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
  );
}

function DetailsTab({ detail }: { detail: Detail }) {
  const { app } = detail;
  return (
    <Card title="Details">
      <dl className="grid gap-x-6 gap-y-4 p-4 text-sm sm:grid-cols-2 lg:grid-cols-3">
        <DetailItem label="Store-ID" value={app.store_id} mono />
        {app.bundle_id ? <DetailItem label="Bundle-ID" value={app.bundle_id} mono /> : null}
        <DetailItem label="Veröffentlicht" value={formatDate(app.released_at)} />
        <DetailItem label="Letztes Update" value={`${formatDate(app.store_updated_at)}${app.version ? ` · Version ${app.version}` : ""}`} />
        <DetailItem label="Größe" value={app.size_bytes ? `${formatNumber(Math.round(app.size_bytes / 1e6))} MB` : "–"} />
        <DetailItem label="Mindest-OS" value={app.min_os ?? "–"} />
        <DetailItem label="Sprachen" value={app.languages?.length ? `${app.languages.length} (${app.languages.slice(0, 6).join(", ")}${app.languages.length > 6 ? " …" : ""})` : "–"} />
        {app.platform === "android" ? (
          <>
            <DetailItem label="Enthält Werbung" value={app.contains_ads == null ? "–" : app.contains_ads ? "Ja" : "Nein"} />
            <DetailItem label="In-App-Käufe" value={app.offers_iap == null ? "–" : app.offers_iap ? app.iap_price_range ?? "Ja" : "Nein"} />
          </>
        ) : null}
        <DetailItem label="Im Katalog seit" value={`${formatDate(app.first_seen_at)} (${app.discovered_via})`} />
        <DetailItem label="Zuletzt abgerufen" value={app.refreshed_at ? `${formatDate(app.refreshed_at)} · Tier T${app.tier}` : `noch nie · Tier T${app.tier}`} />
      </dl>
    </Card>
  );
}

function RatingHistogram({ counts }: { counts: number[] }) {
  const total = counts.reduce((a, b) => a + b, 0);
  const max = Math.max(...counts, 1);
  return (
    <Card title="Verteilung der Bewertungen" aside={<span className="text-xs text-muted">{formatNumber(total)} Bewertungen, US-Store</span>}>
      <div className="space-y-2.5 p-4">
        {counts.map((count, i) => (
          <div key={i} className="flex items-center gap-3 text-sm">
            <span className="w-16 shrink-0 text-muted">{5 - i} Sterne</span>
            <span className="h-2.5 flex-1 overflow-hidden rounded-full bg-surface-2">
              <span className="block h-full rounded-full bg-gradient-to-r from-[#7c5cff] to-[#b9adff]" style={{ width: `${(count / max) * 100}%` }} />
            </span>
            <span className="w-12 shrink-0 text-right tabular-nums text-muted">{total ? `${Math.round((count / total) * 100)} %` : "–"}</span>
          </div>
        ))}
      </div>
    </Card>
  );
}

function DetailItem({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="min-w-0">
      <dt className="text-xs text-muted">{label}</dt>
      <dd className={`mt-0.5 truncate ${mono ? "font-mono text-xs" : ""}`}>{value}</dd>
    </div>
  );
}

const METHOD_TEXT: Record<string, string> = {
  chart: "Downloads aus dem Platz in den US-Gesamtcharts (Top Free/Paid, Median der letzten 3 Tage) über eine Rangkurve.",
  "chart-category": "Downloads aus dem Platz in einem US-Kategorie-Chart, skaliert über Apps, die zugleich in den Gesamtcharts stehen.",
  ratings: "Downloads aus dem Zuwachs der Bewertungen im US-Store, umgerechnet mit dem Verhältnis Downloads je Bewertung der Chart-Apps.",
  installs: "Downloads gemessen: tägliche Zunahme der exakten Installationszahl auf Google Play.",
};

const PLACEMENT_LABEL: Record<string, string> = {
  APPSTORE_SEARCH_RESULTS: "Suchergebnisse",
  APPSTORE_SEARCH_TAB: "Such-Tab",
  APPSTORE_TODAY_TAB: "Heute-Tab",
  APPSTORE_PRODUCT_PAGE: "Produktseiten",
};

const REVENUE_METHOD_TEXT: Record<string, string> = {
  grossing: "Umsatz aus dem Platz im US-Top-Grossing-Chart über eine Rangkurve, geeicht an berichteten Umsätzen börsennotierter App-Firmen.",
  "grossing-category": "Umsatz aus dem Platz in einem US-Top-Grossing-Kategorie-Chart, skaliert über Apps im Gesamtchart.",
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
  free: "Ohne Käufe",
};
