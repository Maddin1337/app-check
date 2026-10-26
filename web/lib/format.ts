const compact = new Intl.NumberFormat("de-DE", { notation: "compact", maximumFractionDigits: 1 });
const whole = new Intl.NumberFormat("de-DE");
const day = new Intl.DateTimeFormat("de-DE", { day: "2-digit", month: "2-digit", year: "numeric" });

export const formatCompact = (value: number | null) => (value == null ? "–" : compact.format(value));
export const formatNumber = (value: number | null) => (value == null ? "–" : whole.format(value));
export const formatDate = (value: Date | null) => (value == null ? "–" : day.format(value));

export function formatPrice(price: string | number | null, currency: string | null) {
  if (price == null) return "–";
  const amount = Number(price);
  if (amount === 0) return "Kostenlos";
  return new Intl.NumberFormat("de-DE", { style: "currency", currency: currency ?? "USD" }).format(amount);
}

export function storeUrl(platform: string, storeId: string) {
  return platform === "ios"
    ? `https://apps.apple.com/app/id${storeId}`
    : `https://play.google.com/store/apps/details?id=${storeId}`;
}

/** Name to show: store name once refreshed, otherwise the URL slug from the sitemap. */
export function displayName(name: string | null, slug: string | null, storeId: string) {
  if (name) return name;
  if (slug) return slug.replace(/-/g, " ");
  return storeId;
}
