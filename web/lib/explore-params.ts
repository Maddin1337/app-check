/**
 * Explorer filters: type, parsing from the URL and the canonical URL for a filter state. No server imports, so the
 * client filter bar can use it as well as the server page.
 */

export type ExploreFilters = {
  q: string;
  platform: "" | "ios" | "android";
  category: string;
  released: "" | "30" | "90" | "365";
  minRatings: number;
  price: "" | "free" | "paid";
  charted: boolean;
  all: boolean; // include apps not refreshed yet (only an ID and slug)
  minRevenue: number; // estimated gross USD per month (model median)
  developer: string; // developer_id, exact
  excludeCategory: string;
  language: string; // ISO code an iOS app lists, e.g. "DE"
  minRating: number; // average rating, 0 = any
  iap: "" | "yes" | "no";
  appleAds: boolean; // advertised with Apple Search Ads in the EU in the last 90 days
  sort: "ratings" | "rank" | "revenue" | "downloads" | "growth" | "newest" | "updated" | "name";
  page: number;
};

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
    minRevenue: Math.max(0, Number.parseInt(one(params.minRevenue), 10) || 0),
    developer: one(params.developer).slice(0, 200),
    excludeCategory: one(params.excludeCategory).slice(0, 100),
    language: one(params.language).slice(0, 3).toUpperCase().replace(/[^A-Z]/g, ""),
    minRating: [3, 4, 4.5].includes(Number(one(params.minRating))) ? Number(one(params.minRating)) : 0,
    iap: pick(one(params.iap), ["", "yes", "no"] as const, ""),
    appleAds: one(params.appleAds) === "1",
    sort: pick(one(params.sort), ["ratings", "rank", "revenue", "downloads", "growth", "newest", "updated", "name"] as const, "ratings"),
    page: Math.max(1, Number.parseInt(one(params.page), 10) || 1),
  };
}


export const DEFAULT_FILTERS: ExploreFilters = parseFilters({});

/** Query string with only the values that differ from the defaults, so URLs stay short and shareable. */
export function filtersToQuery(f: ExploreFilters): string {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(f) as [keyof ExploreFilters, ExploreFilters[keyof ExploreFilters]][]) {
    if (value === DEFAULT_FILTERS[key] || value === "" || value === false || value === 0) continue;
    params.set(key, value === true ? "1" : String(value));
  }
  return params.toString();
}

/** Number of filters behind the chips (search, platform toggle, sort and page do not count). */
export function activeFilterCount(f: ExploreFilters): number {
  const ignored = new Set(["q", "sort", "page", "all", "platform"]);
  return (Object.keys(f) as (keyof ExploreFilters)[]).filter((k) => !ignored.has(k) && f[k] !== DEFAULT_FILTERS[k]).length;
}
