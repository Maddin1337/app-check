import type { ReactNode } from "react";

/** Store icons in a size that fits the list instead of the 512px originals. */
export function iconSrc(url: string | null, size: number) {
  if (!url) return null;
  if (url.includes("mzstatic.com")) return url.replace(/\/\d+x\d+bb\.(jpg|png|webp)$/, `/${size}x${size}bb.$1`);
  if (url.includes("googleusercontent.com")) return `${url.split("=")[0]}=w${size}-h${size}`;
  return url;
}

export function AppIcon({ url, size = 40, name }: { url: string | null; size?: number; name: string }) {
  const src = iconSrc(url, size * 2);
  if (!src) {
    return (
      <span
        style={{ width: size, height: size }}
        className="grid shrink-0 place-items-center rounded-[22%] bg-surface-2 text-xs font-semibold text-muted"
      >
        {name.slice(0, 1).toUpperCase()}
      </span>
    );
  }
  // eslint-disable-next-line @next/next/no-img-element -- store CDNs already serve sized icons
  return <img src={src} alt="" width={size} height={size} loading="lazy" className="shrink-0 rounded-[22%] border border-border" />;
}

export function PlatformBadge({ platform }: { platform: string }) {
  return (
    <span className="rounded-md bg-surface-2 px-1.5 py-0.5 text-[11px] font-medium text-muted">
      {platform === "ios" ? "iOS" : "Android"}
    </span>
  );
}

export function RankBadge({ rank, entries }: { rank: number | null; entries?: number | null }) {
  if (rank == null) return <span className="text-muted">–</span>;
  return (
    <span className="inline-flex items-center gap-1.5 whitespace-nowrap">
      <span className="rounded-md bg-rank-soft px-1.5 py-0.5 font-mono text-xs font-semibold text-rank">#{rank}</span>
      {entries ? <span className="text-xs text-muted">in {entries} Charts</span> : null}
    </span>
  );
}

export function Card({ title, children, aside }: { title?: string; children: ReactNode; aside?: ReactNode }) {
  return (
    <section className="rounded-xl border border-border bg-surface">
      {title ? (
        <header className="flex items-center justify-between gap-4 border-b border-border px-4 py-3">
          <h2 className="text-sm font-semibold">{title}</h2>
          {aside}
        </header>
      ) : null}
      {children}
    </section>
  );
}

export function Stat({ label, value, hint }: { label: string; value: ReactNode; hint?: string }) {
  return (
    <div className="rounded-xl border border-border bg-surface px-4 py-3">
      <div className="text-xs text-muted">{label}</div>
      <div className="mt-1 text-lg font-semibold tracking-tight">{value}</div>
      {hint ? <div className="mt-0.5 text-xs text-muted">{hint}</div> : null}
    </div>
  );
}

export function Skeleton({ rows = 8 }: { rows?: number }) {
  return (
    <div className="animate-pulse space-y-2 p-4">
      {Array.from({ length: rows }, (_, i) => (
        <div key={i} className="h-10 rounded-lg bg-surface-2" />
      ))}
    </div>
  );
}
