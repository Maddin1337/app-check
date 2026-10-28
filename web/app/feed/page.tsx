import type { Metadata } from "next";
import Link from "next/link";
import { Suspense, type ReactNode } from "react";

import { ParamMenu, ParamSegmented } from "@/components/url-controls";
import { EVENT_LABEL, EventText } from "@/components/event-text";
import { AppIcon, Card, PageHeader, PlatformBadge, Skeleton } from "@/components/ui";
import { countryName } from "@/lib/catalog";
import { displayName, formatDate, formatNumber, formatUsd } from "@/lib/format";
import { EVENT_KINDS, feedEvents, PAGE_SIZE, parseFeedFilters, type FeedFilters } from "@/lib/queries";

export const metadata: Metadata = { title: "Feed" };

export default function FeedPage({ searchParams }: PageProps<"/feed">) {
  return (
    <div className="mx-auto max-w-5xl space-y-5">
      <PageHeader eyebrow="Feed" title="Was sich" accent="heute bewegt hat.">
        <p>
          Was sich seit der letzten Messung verändert hat: Sprünge in den Gesamtcharts (iPhone), neue Top-100-Einträge,
          auffällige Zuwächse bei Bewertungen und Installationen, Preis- und Versionswechsel. Täglich aus unseren eigenen
          Zeitreihen berechnet.
        </p>
      </PageHeader>
      <Suspense fallback={<Card><Skeleton rows={12} /></Card>}>
        <Feed searchParams={searchParams} />
      </Suspense>
    </div>
  );
}

function href(f: FeedFilters, changes: Partial<FeedFilters>) {
  const next = { ...f, ...changes };
  const query = new URLSearchParams();
  if (next.kind) query.set("kind", next.kind);
  if (next.country !== "us") query.set("country", next.country);
  if (!next.relevant) query.set("all", "1");
  if (next.platform) query.set("platform", next.platform);
  if (next.page > 1) query.set("page", String(next.page));
  return `/feed${query.size ? `?${query}` : ""}`;
}

async function Feed({ searchParams }: { searchParams: PageProps<"/feed">["searchParams"] }) {
  const f = parseFeedFilters(await searchParams);
  const { rows, counts, countries } = await feedEvents(f);
  const total = f.kind ? (counts[f.kind] ?? 0) : Object.values(counts).reduce((a, b) => a + (b ?? 0), 0);
  const pages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <>
      <nav className="card flex flex-wrap gap-1 p-1 text-sm">
        <Chip active={!f.kind} href={href(f, { kind: "", page: 1 })}>Alle</Chip>
        {EVENT_KINDS.map((kind) => (
          <Chip key={kind} active={f.kind === kind} href={href(f, { kind, page: 1 })}>
            {EVENT_LABEL[kind]} <span className="text-xs text-muted">{formatNumber(counts[kind] ?? 0)}</span>
          </Chip>
        ))}
      </nav>
      <div className="flex flex-wrap items-center gap-2 card p-3">
        <ParamSegmented label="Plattform" name="platform" value={f.platform}
          options={[{ value: "", label: "Alle", icon: "all" }, ...[{ value: "ios", label: "App Store", icon: "ios" }, { value: "android", label: "Google Play", icon: "android" }]]} />
        <ParamSegmented label="Apps" name="all" value={f.relevant ? "" : "1"}
          options={[{ value: "", label: "Relevante Apps" }, { value: "1", label: "Alle Apps" }]} />
        <ParamMenu label="Land" name="country" value={f.country} fallback="us" icon="globe" searchable
          options={(countries.length ? countries : ["us"]).map((c) => ({ value: c, label: countryName(c), hint: c.toUpperCase() }))} />
      </div>

      <Card
        title={`${formatNumber(total)} Ereignisse`}
        aside={rows[0] ? <span className="text-xs text-muted">{rows[0].previous_day ? `${formatDate(rows[0].previous_day)} → ` : ""}{formatDate(rows[0].day)}</span> : null}
      >
        {rows.length === 0 ? (
          <p className="px-4 py-10 text-center text-sm text-muted">
            Noch keine Ereignisse. Sie entstehen, sobald es zwei Messungen gibt; der Job `appcrawl events` läuft nachts.
          </p>
        ) : (
          <ul className="divide-y divide-border">
            {rows.map((event) => {
              const name = displayName(event.name, event.slug, event.store_id);
              return (
                <li key={`${event.app_id}-${event.kind}-${event.country}-${event.chart}`}>
                  <Link href={`/app/${event.platform}/${encodeURIComponent(event.store_id)}`}
                    className="flex items-center gap-3 px-4 py-2.5 hover:bg-surface-2">
                    <AppIcon url={event.icon_url} name={name} size={36} />
                    <span className="min-w-0 flex-1">
                      <span className="flex items-center gap-2">
                        <span className="truncate text-sm font-medium">{name}</span>
                        <PlatformBadge platform={event.platform} />
                      </span>
                      <span className="block truncate text-sm text-muted"><EventText event={event} /></span>
                    </span>
                    <span className="hidden w-32 text-right text-xs text-muted sm:block">
                      {EVENT_LABEL[event.kind]}
                      {event.revenue_p50 ? <span className="block">{formatUsd(event.revenue_p50)}/Monat</span> : null}
                    </span>
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
        {pages > 1 ? (
          <nav className="flex items-center justify-between border-t border-border px-4 py-3 text-sm">
            {f.page > 1 ? <Link href={href(f, { page: f.page - 1 })} className="text-primary hover:underline">← Zurück</Link> : <span />}
            <span className="text-xs text-muted">Seite {f.page} von {pages}</span>
            {f.page < pages ? <Link href={href(f, { page: f.page + 1 })} className="text-primary hover:underline">Weiter →</Link> : <span />}
          </nav>
        ) : null}
      </Card>
    </>
  );
}

function Chip({ active, href: target, children }: { active: boolean; href: string; children: ReactNode }) {
  return (
    <Link href={target} aria-current={active ? "page" : undefined}
      className={`rounded-lg px-3 py-1.5 font-medium ${active ? "bg-primary-soft text-primary" : "text-muted hover:bg-surface-2 hover:text-text"}`}>
      {children}
    </Link>
  );
}
