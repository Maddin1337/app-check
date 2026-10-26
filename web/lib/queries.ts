import { sql } from "./db";

export type ExploreFilters = {
  q: string;
  platform: "" | "ios" | "android";
  category: string;
  released: "" | "30" | "90" | "365";
  minRatings: number;
  price: "" | "free" | "paid";
  charted: boolean;
  all: boolean; // include apps not refreshed yet (only an ID and slug)
  sort: "ratings" | "rank" | "newest" | "updated" | "name";
  page: number;
};

export const PAGE_SIZE = 50;

type Params = Record<string, string | string[] | undefined>;

const one = (value: string | string[] | undefined) => (Array.isArray(value) ? value[0] : value) ?? "";

export function parseFilters(params: Params): ExploreFilters {
  const pick = <T extends string>(value: string, allowed: readonly T[], fallback: T): T =>
    (allowed as readonly string[]).includes(value) ? (value as T) : fallback;
  return {
    q: one(params.q).trim().slice(0, 100),
    platform: pick(one(params.platform), ["", "ios", "android"] as const, ""),
    category: one(params.category).slice(0, 100),
    released: pick(one(params.released), ["", "30", "90", "365"] as const, ""),
    minRatings: Math.max(0, Number.parseInt(one(params.minRatings), 10) || 0),
    price: pick(one(params.price), ["", "free", "paid"] as const, ""),
    charted: one(params.charted) === "1",
    all: one(params.all) === "1",
    sort: pick(one(params.sort), ["ratings", "rank", "newest", "updated", "name"] as const, "ratings"),
    page: Math.max(1, Number.parseInt(one(params.page), 10) || 1),
  };
}

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

/** Best chart position per app on the latest captured day. */
const bestRanks = sql`
  SELECT app_id, MIN(rank)::int AS best_rank, COUNT(*)::int AS chart_entries
  FROM chart_ranks
  WHERE captured_on = (SELECT MAX(captured_on) FROM chart_ranks)
  GROUP BY app_id`;

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
    ${f.charted ? sql`AND b.app_id IS NOT NULL` : sql``}`;
}

function orderBy(sort: ExploreFilters["sort"]) {
  switch (sort) {
    case "rank":
      return sql`ORDER BY b.best_rank NULLS LAST, a.rating_count DESC NULLS LAST`;
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

export async function exploreApps(f: ExploreFilters) {
  const rows = await sql<AppRow[]>`
    WITH b AS (${bestRanks})
    SELECT a.id, a.platform, a.store_id, a.name, a.slug, a.developer_name, a.category, a.icon_url, a.price, a.currency,
           a.rating_avg, a.rating_count, a.installs_exact, a.released_at, a.store_updated_at, a.status,
           b.best_rank, b.chart_entries
    FROM apps a LEFT JOIN b ON b.app_id = a.id
    ${where(f)}
    ${orderBy(f.sort)}
    LIMIT ${PAGE_SIZE} OFFSET ${(f.page - 1) * PAGE_SIZE}`;
  const [{ total }] = await sql<{ total: number }[]>`
    WITH b AS (${bestRanks})
    SELECT COUNT(*)::int AS total FROM apps a LEFT JOIN b ON b.app_id = a.id ${where(f)}`;
  return { rows, total };
}

export async function overview() {
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

export async function categories() {
  return sql<{ category: string; apps: number }[]>`
    SELECT category, COUNT(*)::int AS apps FROM apps
    WHERE status = 'active' AND category IS NOT NULL
    GROUP BY category ORDER BY apps DESC LIMIT 80`;
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
  return { app, ranks, metrics, siblings };
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
