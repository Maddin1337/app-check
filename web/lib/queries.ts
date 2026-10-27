import { cacheLife } from "next/cache";

import { sql } from "./db";
import type { ExploreFilters } from "./explore-params";

export { parseFilters, type ExploreFilters } from "./explore-params";

export const PAGE_SIZE = 50;

type Params = Record<string, string | string[] | undefined>;

const one = (value: string | string[] | undefined) => (Array.isArray(value) ? value[0] : value) ?? "";

export type AppRow = {
  id: number;
  platform: string;
  store_id: string;
  name: string | null;
  slug: string | null;
  developer_name: string | null;
  category: string | null;
  icon_url: string | null;
  price: string | null;
  currency: string | null;
  rating_avg: number | null;
  rating_count: number | null;
  installs_exact: number | null;
  released_at: Date | null;
  store_updated_at: Date | null;
  status: string;
  best_rank: number | null;
  chart_entries: number | null;
};

export type EstimateFields = {
  downloads_p10: number | null;
  downloads_p50: number | null;
  downloads_p90: number | null;
  revenue_p10: number | null;
  revenue_p50: number | null;
  revenue_p90: number | null;
  confidence: "low" | "medium" | "high" | null;
  scope: "us" | "ww" | null;
};

/** Model estimates of the latest computed day (crawler job `estimates`). */
const latestEstimates = sql`
  SELECT app_id, downloads_p10, downloads_p50, downloads_p90, revenue_p10, revenue_p50, revenue_p90, confidence, scope
  FROM app_estimates_daily
  WHERE day = (SELECT MAX(day) FROM app_estimates_daily)`;

/** Best chart position per app on the latest captured day, precomputed by the crawler (app_chart_summary). */
const bestRanks = sql`SELECT app_id, best_rank, chart_entries FROM app_chart_summary`;

function where(f: ExploreFilters) {
  return sql`
    WHERE TRUE
    ${f.all ? sql`` : sql`AND a.status = 'active'`}
    ${f.platform ? sql`AND a.platform = ${f.platform}` : sql``}
    ${f.q ? sql`AND (a.name ILIKE ${"%" + f.q + "%"} OR a.slug ILIKE ${"%" + f.q.replace(/\s+/g, "-") + "%"} OR a.store_id = ${f.q})` : sql``}
    ${f.category ? sql`AND a.category = ${f.category}` : sql``}
    ${f.released ? sql`AND a.released_at >= current_date - ${Number(f.released)}::int` : sql``}
    ${f.minRatings ? sql`AND a.rating_count >= ${f.minRatings}` : sql``}
    ${f.price === "free" ? sql`AND a.price = 0` : f.price === "paid" ? sql`AND a.price > 0` : sql``}
    ${f.charted ? sql`AND b.app_id IS NOT NULL` : sql``}
    ${f.minRevenue ? sql`AND e.revenue_p50 >= ${f.minRevenue}` : sql``}
    ${f.developer ? sql`AND a.developer_id = ${f.developer}` : sql``}
    ${f.excludeCategory ? sql`AND a.category IS DISTINCT FROM ${f.excludeCategory}` : sql``}
    ${f.language ? sql`AND a.languages @> ARRAY[${f.language}]::text[]` : sql``}
    ${f.minRating ? sql`AND a.rating_avg >= ${f.minRating}` : sql``}
    ${f.iap === "yes" ? sql`AND (m.model IN ('subscription', 'iap') OR a.offers_iap)`
      : f.iap === "no" ? sql`AND (m.model IN ('paid', 'free') OR a.offers_iap = false)` : sql``}
    ${f.sort === "growth" ? sql`AND t.per_day > 0` : sql``}
    ${f.appleAds ? sql`AND EXISTS (SELECT 1 FROM apple_ads_fetch af WHERE af.app_id = a.id AND af.ads > 0)` : sql``}
    ${f.sort === "revenue" ? sql`AND e.revenue_p50 IS NOT NULL` : f.sort === "downloads" ? sql`AND e.app_id IS NOT NULL` : sql``}
    ${f.sort === "rank" ? sql`AND b.app_id IS NOT NULL` : sql``}`;
}

function orderBy(sort: ExploreFilters["sort"]) {
  switch (sort) {
    case "rank":
      return sql`ORDER BY b.best_rank NULLS LAST, a.rating_count DESC NULLS LAST`;
    case "revenue":
      return sql`ORDER BY e.revenue_p50 DESC NULLS LAST, a.id`;
    case "downloads":
      return sql`ORDER BY e.downloads_p50 DESC NULLS LAST, a.id`;
    case "growth":
      return sql`ORDER BY t.per_day DESC NULLS LAST, a.id`;
    case "newest":
      return sql`ORDER BY a.released_at DESC NULLS LAST`;
    case "updated":
      return sql`ORDER BY a.store_updated_at DESC NULLS LAST`;
    case "name":
      return sql`ORDER BY COALESCE(a.name, a.slug) NULLS LAST`;
    default:
      return sql`ORDER BY a.rating_count DESC NULLS LAST`;
  }
}

export type GrowthFields = {
  growth: number | null; // 30-day relative growth of ratings (iOS) or installs (Android)
  growth_per_day: number | null;
  growth_metric: "ratings" | "installs" | null;
  growth_country: string | null;
  growth_start_day: Date | null;
};

const exploreFrom = sql`
  FROM apps a
  LEFT JOIN b ON b.app_id = a.id
  LEFT JOIN e ON e.app_id = a.id
  LEFT JOIN app_trends t ON t.app_id = a.id AND t.window_days = 30
  LEFT JOIN app_monetization m ON m.app_id = a.id`;

export const COUNT_CAP = 10_000;

export async function exploreApps(f: ExploreFilters) {
  const rows = await sql<(AppRow & EstimateFields & GrowthFields)[]>`
    WITH b AS (${bestRanks}), e AS (${latestEstimates})
    SELECT a.id, a.platform, a.store_id, a.name, a.slug, a.developer_name, a.category, a.icon_url, a.price, a.currency,
           a.rating_avg, a.rating_count, a.installs_exact, a.released_at, a.store_updated_at, a.status,
           b.best_rank, b.chart_entries,
           e.downloads_p10, e.downloads_p50, e.downloads_p90, e.revenue_p10, e.revenue_p50, e.revenue_p90, e.confidence, e.scope,
           t.growth, t.per_day AS growth_per_day, t.metric AS growth_metric, t.country AS growth_country,
           t.start_day AS growth_start_day
    ${exploreFrom}
    ${where(f)}
    ${orderBy(f.sort)}
    LIMIT ${PAGE_SIZE} OFFSET ${(f.page - 1) * PAGE_SIZE}`;
  // Counting stops after COUNT_CAP matches: an exact count over a million active apps costs seconds per request.
  const [{ total }] = await sql<{ total: number }[]>`
    WITH b AS (${bestRanks}), e AS (${latestEstimates})
    SELECT COUNT(*)::int AS total FROM (SELECT 1 ${exploreFrom} ${where(f)} LIMIT ${COUNT_CAP + 1}) capped`;
  return { rows, total, capped: total > COUNT_CAP };
}

/** Catalog totals: whole-table counts, cached for an hour because they change once a day. */
export async function overview() {
  "use cache";
  cacheLife("hours");
  const [counts] = await sql<
    { ios: number; android: number; active: number; chart_days: number; latest: Date | null; charted: number }[]
  >`
    SELECT
      (SELECT COUNT(*)::int FROM apps WHERE platform = 'ios') AS ios,
      (SELECT COUNT(*)::int FROM apps WHERE platform = 'android') AS android,
      (SELECT COUNT(*)::int FROM apps WHERE status = 'active') AS active,
      (SELECT COUNT(DISTINCT captured_on)::int FROM chart_ranks) AS chart_days,
      (SELECT MAX(captured_on) FROM chart_ranks) AS latest,
      (SELECT COUNT(DISTINCT app_id)::int FROM chart_ranks WHERE captured_on = (SELECT MAX(captured_on) FROM chart_ranks)) AS charted`;
  return counts;
}

/** Categories with app counts; App Store and Google Play name their categories differently, so per platform. */
export async function categories(platform: "" | "ios" | "android" = "") {
  "use cache";
  cacheLife("hours");
  return sql<{ category: string; apps: number }[]>`
    SELECT category, COUNT(*)::int AS apps FROM apps
    WHERE status = 'active' AND category IS NOT NULL ${platform ? sql`AND platform = ${platform}` : sql``}
    GROUP BY category ORDER BY apps DESC LIMIT 120`;
}

export type AppDetail = AppRow & {
  developer_id: string | null;
  bundle_id: string | null;
  version: string | null;
  content_rating: string | null;
  size_bytes: number | null;
  min_os: string | null;
  languages: string[] | null;
  installs_bucket: number | null;
  review_count: number | null;
  iap_price_range: string | null;
  contains_ads: boolean | null;
  offers_iap: boolean | null;
  refresh_country: string | null;
  refreshed_at: Date | null;
  first_seen_at: Date;
  tier: number;
  discovered_via: string;
};

export async function appDetail(platform: string, storeId: string) {
  const [app] = await sql<AppDetail[]>`SELECT * FROM apps WHERE platform = ${platform} AND store_id = ${storeId}`;
  if (!app) return null;
  const ranks = await sql<{ country: string; device: string; chart: string; genre_id: string; rank: number }[]>`
    SELECT country, device, chart, genre_id, rank FROM chart_ranks
    WHERE app_id = ${app.id} AND captured_on = (SELECT MAX(captured_on) FROM chart_ranks WHERE app_id = ${app.id})
    ORDER BY rank, country LIMIT 200`;
  const metrics = await sql<
    { day: Date; country: string; rating_count: number | null; rating_avg: number | null; installs_exact: number | null }[]
  >`
    SELECT day, country, rating_count, rating_avg, installs_exact FROM app_metrics_daily
    WHERE app_id = ${app.id} ORDER BY day DESC, country LIMIT 60`;
  const siblings = app.bundle_id
    ? await sql<{ platform: string; store_id: string; name: string | null }[]>`
        SELECT platform, store_id, name FROM apps
        WHERE id <> ${app.id} AND (store_id = ${app.bundle_id} OR bundle_id = ${app.bundle_id}) LIMIT 3`
    : app.platform === "android"
      ? await sql<{ platform: string; store_id: string; name: string | null }[]>`
          SELECT platform, store_id, name FROM apps WHERE platform = 'ios' AND bundle_id = ${app.store_id} LIMIT 3`
      : [];
  const [estimate] = await sql<(EstimateFields & {
    day: Date; revenue_net_p50: number | null; download_method: string | null; revenue_method: string | null;
    monetization: string | null; model_version: string;
  })[]>`
    SELECT * FROM app_estimates_daily WHERE app_id = ${app.id} ORDER BY day DESC LIMIT 1`;
  const [monetization] = await sql<{
    model: string; country: string; fetched_at: Date; iap_count: number; sub_annual_price: string | null;
    iap_typical: string | null; iap_min: string | null; iap_max: string | null; currency: string | null;
  }[]>`SELECT * FROM app_monetization WHERE app_id = ${app.id}`;
  const iaps = await sql<{ position: number; name: string; price: string; currency: string }[]>`
    SELECT position, name, price, currency FROM iap_products
    WHERE app_id = ${app.id} AND country = ${monetization?.country ?? "us"} ORDER BY position`;
  const [kpis] = await sql<{
    days_top100: number; first_chart_day: Date | null; countries_today: number; peak_revenue_day: number | null;
    peak_day: Date | null; versions_seen: number; observed_days: number;
  }[]>`
    SELECT
      (SELECT COUNT(DISTINCT captured_on)::int FROM chart_ranks
        WHERE app_id = ${app.id} AND genre_id = '36' AND rank <= 100) AS days_top100,
      (SELECT MIN(captured_on) FROM chart_ranks WHERE app_id = ${app.id}) AS first_chart_day,
      (SELECT COUNT(DISTINCT country)::int FROM chart_ranks
        WHERE app_id = ${app.id} AND captured_on = (SELECT MAX(captured_on) FROM chart_ranks WHERE app_id = ${app.id})
       ) AS countries_today,
      p.peak_revenue_day, p.peak_day,
      (SELECT COUNT(DISTINCT version)::int FROM app_metrics_daily WHERE app_id = ${app.id} AND version IS NOT NULL) AS versions_seen,
      (SELECT COUNT(DISTINCT day)::int FROM app_metrics_daily WHERE app_id = ${app.id}) AS observed_days
    FROM (SELECT MAX(revenue_p50) / 30 AS peak_revenue_day,
                 (ARRAY_AGG(day ORDER BY revenue_p50 DESC NULLS LAST))[1] AS peak_day
          FROM app_estimates_daily WHERE app_id = ${app.id} AND revenue_p50 IS NOT NULL) p`;
  const [storePage] = await sql<{
    fetched_at: Date; rating_counts: string[] | null; screenshots: { template: string; width: number | null; height: number | null }[] | null;
  }[]>`SELECT fetched_at, rating_counts, screenshots FROM app_store_page WHERE app_id = ${app.id}`;
  const [appleAds] = await sql<{
    ads: number; countries: string[]; first_impression: Date | null; last_impression: Date | null;
    placements: string[]; formats: string[]; fetched_at: Date | null; data_end: Date | null;
  }[]>`
    SELECT COUNT(d.ad_id)::int AS ads, COALESCE(array_agg(DISTINCT d.country) FILTER (WHERE d.country IS NOT NULL), '{}') AS countries,
           MIN(d.first_impression) AS first_impression, MAX(d.last_impression) AS last_impression,
           COALESCE(array_agg(DISTINCT d.placement) FILTER (WHERE d.placement IS NOT NULL), '{}') AS placements,
           COALESCE(array_agg(DISTINCT d.format) FILTER (WHERE d.format IS NOT NULL), '{}') AS formats,
           f.fetched_at, f.data_end
    FROM apple_ads_fetch f LEFT JOIN apple_ads d ON d.app_id = f.app_id
    WHERE f.app_id = ${app.id}
    GROUP BY f.fetched_at, f.data_end`;
  return { app, ranks, metrics, siblings, estimate, monetization, iaps, kpis, storePage, appleAds };
}

export async function chartFacets() {
  const countries = await sql<{ country: string }[]>`
    SELECT DISTINCT country FROM chart_ranks WHERE captured_on = (SELECT MAX(captured_on) FROM chart_ranks) ORDER BY country`;
  const genres = await sql<{ genre_id: string }[]>`
    SELECT DISTINCT genre_id FROM chart_ranks WHERE captured_on = (SELECT MAX(captured_on) FROM chart_ranks)`;
  return { countries: countries.map((r) => r.country), genres: genres.map((r) => r.genre_id) };
}

export async function chartList(country: string, chart: string, genre: string, device: string) {
  return sql<(AppRow & { rank: number; captured_on: Date })[]>`
    SELECT c.rank, c.captured_on, a.id, a.platform, a.store_id, a.name, a.slug, a.developer_name, a.category, a.icon_url,
           a.price, a.currency, a.rating_avg, a.rating_count, a.released_at, a.status
    FROM chart_ranks c JOIN apps a ON a.id = c.app_id
    WHERE c.captured_on = (SELECT MAX(captured_on) FROM chart_ranks WHERE country = ${country})
      AND c.country = ${country} AND c.chart = ${chart} AND c.genre_id = ${genre} AND c.device = ${device}
    ORDER BY c.rank`;
}

export type RisingFilters = {
  view: "growth" | "charts";
  platform: "ios" | "android";
  window: 7 | 30;
  sort: "absolute" | "relative";
  category: string;
  page: number;
  // chart movers
  country: string;
  chart: string;
  genre: string;
  device: string;
};

export function parseRisingFilters(params: Params): RisingFilters {
  const pick = <T extends string>(value: string, allowed: readonly T[], fallback: T): T =>
    (allowed as readonly string[]).includes(value) ? (value as T) : fallback;
  return {
    view: pick(one(params.view), ["growth", "charts"] as const, "growth"),
    platform: pick(one(params.platform), ["ios", "android"] as const, "ios"),
    window: one(params.window) === "7" ? 7 : 30,
    sort: pick(one(params.sort), ["absolute", "relative"] as const, "absolute"),
    category: one(params.category).slice(0, 100),
    page: Math.max(1, Number.parseInt(one(params.page), 10) || 1),
    country: one(params.country).slice(0, 2).toLowerCase() || "de",
    chart: pick(one(params.chart), ["top-free", "top-paid", "top-grossing"] as const, "top-free"),
    genre: one(params.genre).slice(0, 10) || "36",
    device: pick(one(params.device), ["iphone", "ipad", "mac"] as const, "iphone"),
  };
}

/** Smallest start value for relative growth, so 2 → 4 ratings does not top the list with +100 %. */
export const RELATIVE_MIN_BASE = { ios: 100, android: 1000 } as const;

export type TrendRow = AppRow & {
  metric: "ratings" | "installs";
  country: string;
  start_day: Date;
  end_day: Date;
  start_value: number;
  end_value: number;
  delta: number;
  per_day: number;
  growth: number | null;
  points: number;
};

export async function risingApps(f: RisingFilters) {
  const filter = sql`
    WHERE t.window_days = ${f.window} AND t.platform = ${f.platform} AND t.delta > 0
    ${f.category ? sql`AND a.category = ${f.category}` : sql``}
    ${f.sort === "relative" ? sql`AND t.start_value >= ${RELATIVE_MIN_BASE[f.platform]}` : sql``}`;
  const rows = await sql<TrendRow[]>`
    SELECT a.id, a.platform, a.store_id, a.name, a.slug, a.developer_name, a.category, a.icon_url, a.price, a.currency,
           a.rating_avg, a.rating_count, a.installs_exact, a.released_at, a.store_updated_at, a.status,
           NULL::int AS best_rank, NULL::int AS chart_entries,
           t.metric, t.country, t.start_day, t.end_day, t.start_value, t.end_value, t.delta, t.per_day, t.growth, t.points
    FROM app_trends t JOIN apps a ON a.id = t.app_id
    ${filter}
    ORDER BY ${f.sort === "relative" ? sql`t.growth DESC NULLS LAST` : sql`t.per_day DESC`}, t.app_id
    LIMIT ${PAGE_SIZE} OFFSET ${(f.page - 1) * PAGE_SIZE}`;
  const [{ total, computed }] = await sql<{ total: number; computed: Date | null }[]>`
    SELECT COUNT(*)::int AS total, MAX(t.computed_at) AS computed
    FROM app_trends t JOIN apps a ON a.id = t.app_id ${filter}`;
  return { rows, total, computed };
}

export async function trendCategories(platform: string, window: number) {
  return sql<{ category: string; apps: number }[]>`
    SELECT a.category, COUNT(*)::int AS apps FROM app_trends t JOIN apps a ON a.id = t.app_id
    WHERE t.window_days = ${window} AND t.platform = ${platform} AND t.delta > 0 AND a.category IS NOT NULL
    GROUP BY a.category ORDER BY apps DESC LIMIT 80`;
}

/** Daily values behind each trend row, for the sparklines: app_id -> values in day order. */
export async function trendSeries(rows: Pick<TrendRow, "id" | "country" | "metric" | "start_day">[]) {
  if (rows.length === 0) return new Map<number, number[]>();
  const series = await sql<{ app_id: number; value: number }[]>`
    SELECT m.app_id, CASE WHEN r.metric = 'installs' THEN m.installs_exact ELSE m.rating_count END::float8 AS value
    FROM unnest(${rows.map((r) => r.id)}::bigint[], ${rows.map((r) => r.country)}::text[],
                ${rows.map((r) => r.metric)}::text[],
                ${rows.map((r) => r.start_day.toISOString().slice(0, 10))}::date[]) AS r(app_id, country, metric, start_day)
    JOIN app_metrics_daily m ON m.app_id = r.app_id AND m.country = r.country AND m.day >= r.start_day
    WHERE CASE WHEN r.metric = 'installs' THEN m.installs_exact ELSE m.rating_count END IS NOT NULL
    ORDER BY m.app_id, m.day`;
  const byApp = new Map<number, number[]>();
  for (const { app_id, value } of series) {
    const id = Number(app_id);
    byApp.set(id, [...(byApp.get(id) ?? []), value]);
  }
  return byApp;
}

export type ChartMoverRow = AppRow & { rank: number; before_rank: number | null };

/** Rank changes in one chart between the latest day and the latest day at least `days` earlier. */
export async function chartMovers(f: RisingFilters, days: number) {
  const [range] = await sql<{ latest: Date | null; before: Date | null }[]>`
    WITH l AS (SELECT MAX(captured_on) AS latest FROM chart_ranks WHERE country = ${f.country})
    SELECT l.latest,
           (SELECT MAX(captured_on) FROM chart_ranks WHERE country = ${f.country} AND captured_on <= l.latest - ${days}::int) AS before
    FROM l`;
  if (!range?.latest || !range.before) return { rows: [] as ChartMoverRow[], ...range };
  const rows = await sql<ChartMoverRow[]>`
    SELECT c.rank, p.rank AS before_rank, a.id, a.platform, a.store_id, a.name, a.slug, a.developer_name, a.category,
           a.icon_url, a.price, a.currency, a.rating_avg, a.rating_count, a.installs_exact, a.released_at,
           a.store_updated_at, a.status, NULL::int AS best_rank, NULL::int AS chart_entries
    FROM chart_ranks c
    JOIN apps a ON a.id = c.app_id
    LEFT JOIN chart_ranks p ON p.captured_on = ${range.before} AND p.platform = c.platform AND p.country = c.country
      AND p.device = c.device AND p.chart = c.chart AND p.genre_id = c.genre_id AND p.app_id = c.app_id
    WHERE c.captured_on = ${range.latest} AND c.country = ${f.country} AND c.chart = ${f.chart}
      AND c.genre_id = ${f.genre} AND c.device = ${f.device}
    ORDER BY COALESCE(p.rank, 201) - c.rank DESC, c.rank
    LIMIT ${PAGE_SIZE}`;
  return { rows, ...range };
}

export type PublisherRow = {
  developer_id: string;
  developer_name: string | null;
  platform: string;
  apps: number;
  apps_with_revenue: number;
  revenue: number | null;
  downloads: number | null;
  top_apps: { store_id: string; name: string | null; icon_url: string | null; revenue: number | null }[];
};

/** Publishers ranked by the sum of their apps' estimated revenue (model medians, latest estimate day). */
export async function publisherRanking(platform: "ios" | "android", category: string, page: number) {
  const filter = sql`
    WHERE a.platform = ${platform} AND a.developer_id IS NOT NULL
    ${category ? sql`AND a.category = ${category}` : sql``}`;
  const rows = await sql<PublisherRow[]>`
    WITH e AS (${latestEstimates})
    SELECT a.developer_id, MAX(a.developer_name) AS developer_name, a.platform,
           COUNT(*)::int AS apps, COUNT(e.revenue_p50)::int AS apps_with_revenue,
           SUM(e.revenue_p50)::float8 AS revenue, SUM(e.downloads_p50)::float8 AS downloads,
           (ARRAY_AGG(json_build_object('store_id', a.store_id, 'name', a.name, 'icon_url', a.icon_url,
                                        'revenue', e.revenue_p50)
                      ORDER BY e.revenue_p50 DESC NULLS LAST))[1:4] AS top_apps
    FROM e JOIN apps a ON a.id = e.app_id
    ${filter}
    GROUP BY a.developer_id, a.platform
    HAVING SUM(e.revenue_p50) > 0
    ORDER BY revenue DESC NULLS LAST, a.developer_id
    LIMIT ${PAGE_SIZE} OFFSET ${(page - 1) * PAGE_SIZE}`;
  const [{ total }] = await sql<{ total: number }[]>`
    WITH e AS (${latestEstimates})
    SELECT COUNT(*)::int AS total FROM (
      SELECT 1 FROM e JOIN apps a ON a.id = e.app_id ${filter}
      GROUP BY a.developer_id HAVING SUM(e.revenue_p50) > 0) t`;
  return { rows, total };
}

export async function publisherCategories(platform: string) {
  return sql<{ category: string; apps: number }[]>`
    WITH e AS (${latestEstimates})
    SELECT a.category, COUNT(*)::int AS apps FROM e JOIN apps a ON a.id = e.app_id
    WHERE a.platform = ${platform} AND a.category IS NOT NULL AND e.revenue_p50 > 0
    GROUP BY a.category ORDER BY apps DESC LIMIT 80`;
}

export const EVENT_KINDS = ["top100_entry", "rank_up", "rank_down", "ratings_spike", "installs_spike", "price_change",
  "new_version"] as const;
export type EventKind = (typeof EVENT_KINDS)[number];

export type EventRow = {
  day: Date;
  previous_day: Date | null;
  kind: EventKind;
  country: string;
  chart: string;
  old_value: string | null;
  new_value: string | null;
  magnitude: number;
  app_id: number;
  platform: string;
  store_id: string;
  name: string | null;
  slug: string | null;
  icon_url: string | null;
  developer_name: string | null;
  revenue_p50: number | null;
};

export type FeedFilters = { kind: EventKind | ""; country: string; relevant: boolean; platform: "" | "ios" | "android"; page: number };

export function parseFeedFilters(params: Params): FeedFilters {
  const kind = one(params.kind);
  return {
    kind: (EVENT_KINDS as readonly string[]).includes(kind) ? (kind as EventKind) : "",
    country: one(params.country).slice(0, 2).toLowerCase() || "us",
    relevant: one(params.all) !== "1",
    platform: one(params.platform) === "ios" || one(params.platform) === "android" ? (one(params.platform) as "ios" | "android") : "",
    page: Math.max(1, Number.parseInt(one(params.page), 10) || 1),
  };
}

/** Events of the latest event day; "relevant" keeps apps with an estimate or at least 1,000 ratings. */
export async function feedEvents(f: FeedFilters) {
  const filter = sql`
    WHERE ev.day = (SELECT MAX(day) FROM app_events)
      AND (ev.country = ${f.country} OR ev.country IN ('ww', ''))
      ${f.kind ? sql`AND ev.kind = ${f.kind}` : sql``}
      ${f.platform ? sql`AND a.platform = ${f.platform}` : sql``}
      ${f.relevant ? sql`AND (e.app_id IS NOT NULL OR a.rating_count >= 1000)` : sql``}`;
  const rows = await sql<EventRow[]>`
    WITH e AS (${latestEstimates})
    SELECT ev.day, ev.previous_day, ev.kind, ev.country, ev.chart, ev.old_value, ev.new_value, ev.magnitude,
           a.id AS app_id, a.platform, a.store_id, a.name, a.slug, a.icon_url, a.developer_name, e.revenue_p50
    FROM app_events ev JOIN apps a ON a.id = ev.app_id LEFT JOIN e ON e.app_id = a.id
    ${filter}
    ORDER BY array_position(${[...EVENT_KINDS]}::text[], ev.kind), ev.magnitude DESC, a.id
    LIMIT ${PAGE_SIZE} OFFSET ${(f.page - 1) * PAGE_SIZE}`;
  const counts = await sql<{ kind: EventKind; n: number }[]>`
    WITH e AS (${latestEstimates})
    SELECT ev.kind, COUNT(*)::int AS n
    FROM app_events ev JOIN apps a ON a.id = ev.app_id LEFT JOIN e ON e.app_id = a.id
    WHERE ev.day = (SELECT MAX(day) FROM app_events)
      AND (ev.country = ${f.country} OR ev.country IN ('ww', ''))
      ${f.platform ? sql`AND a.platform = ${f.platform}` : sql``}
      ${f.relevant ? sql`AND (e.app_id IS NOT NULL OR a.rating_count >= 1000)` : sql``}
    GROUP BY ev.kind`;
  const countries = await sql<{ country: string }[]>`
    SELECT DISTINCT country FROM app_events WHERE day = (SELECT MAX(day) FROM app_events) AND length(country) = 2
      AND country <> 'ww' ORDER BY country`;
  return { rows, counts: Object.fromEntries(counts.map((c) => [c.kind, c.n])) as Partial<Record<EventKind, number>>,
           countries: countries.map((c) => c.country) };
}

export async function appEvents(appId: number) {
  return sql<Omit<EventRow, "app_id" | "platform" | "store_id" | "name" | "slug" | "icon_url" | "developer_name" | "revenue_p50">[]>`
    SELECT day, previous_day, kind, country, chart, old_value, new_value, magnitude FROM app_events
    WHERE app_id = ${appId} ORDER BY day DESC, magnitude DESC LIMIT 30`;
}

export type AnchorRow = {
  app: string;
  platform: string;
  store_id: string;
  period_start: Date;
  period_end: Date;
  reported_month_usd: number;
  us_low: number;
  us_high: number;
  truth_low: number;
  truth_high: number;
  source_url: string;
  note: string | null;
  grossing_rank: number | null;
  estimate: number | null;
};

/** Calibration state and every ground-truth anchor next to our current estimate, for the methodology page. */
export async function methodology() {
  const calibration = await sql<{ key: string; value: number; prior: number; anchors: number; spread: number | null; computed_at: Date }[]>`
    SELECT key, value, prior, anchors, spread, computed_at FROM model_calibration`;
  const anchors = await sql<AnchorRow[]>`
    WITH e AS (${latestEstimates})
    SELECT g.app, g.platform, g.store_id, g.period_start, g.period_end, g.reported_month_usd::float8 AS reported_month_usd,
           g.us_low, g.us_high,
           (g.reported_month_usd * g.us_low * g.ios_low * g.store_low)::float8 AS truth_low,
           (g.reported_month_usd * g.us_high * g.ios_high * g.store_high)::float8 AS truth_high,
           g.source_url, g.note,
           (SELECT MIN(c.rank)::int FROM chart_ranks c
             WHERE c.app_id = a.id AND c.country = 'us' AND c.device = 'iphone' AND c.chart = 'top-grossing'
               AND c.genre_id = '36' AND c.captured_on = (SELECT MAX(captured_on) FROM chart_ranks WHERE chart = 'top-grossing'))
             AS grossing_rank,
           e.revenue_p50 AS estimate
    FROM ground_truth g
    LEFT JOIN apps a ON a.platform = g.platform AND a.store_id = g.store_id
    LEFT JOIN e ON e.app_id = a.id
    ORDER BY grossing_rank NULLS LAST, g.app`;
  const [counts] = await sql<{ estimates: number; with_revenue: number; day: Date | null }[]>`
    WITH e AS (${latestEstimates})
    SELECT COUNT(*)::int AS estimates, COUNT(revenue_p50)::int AS with_revenue,
           (SELECT MAX(day) FROM app_estimates_daily) AS day FROM e`;
  return { calibration: Object.fromEntries(calibration.map((c) => [c.key, c])), anchors, counts };
}
