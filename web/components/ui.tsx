import { Apple, Play } from "lucide-react";
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
  const Icon = platform === "ios" ? Apple : Play;
  return (
    <span title={platform === "ios" ? "App Store" : "Google Play"}
      className="inline-flex items-center gap-1 rounded-md bg-surface-2 px-1.5 py-0.5 text-[11px] font-medium text-muted">
      <Icon className="size-3" aria-hidden />
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
    <section className="card overflow-hidden">
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
    <div className="card px-4 py-3">
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

/** Tiny line chart of a daily series; scaled to its own min/max, so it shows shape, not size. */
export function Sparkline({ values, width = 96, height = 28 }: { values: number[]; width?: number; height?: number }) {
  if (values.length < 2) return <span className="text-xs text-muted">–</span>;
  const min = Math.min(...values);
  const span = Math.max(...values) - min || 1;
  const points = values
    .map((v, i) => `${((i / (values.length - 1)) * (width - 2) + 1).toFixed(1)},${(height - 1 - ((v - min) / span) * (height - 2)).toFixed(1)}`)
    .join(" ");
  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} className="text-good" aria-hidden>
      <polyline points={points} fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinejoin="round" strokeLinecap="round" />
    </svg>
  );
}

const CONFIDENCE_LABEL = { high: "hoch", medium: "mittel", low: "niedrig" } as const;

/** Every v0 number is an early, uncalibrated estimate; the badge says so next to the value. */
export function ConfidenceBadge({ confidence }: { confidence: "low" | "medium" | "high" | null }) {
  if (!confidence) return null;
  return (
    <span
      title={`Schätzung, Modell v0 (früh) · Konfidenz ${CONFIDENCE_LABEL[confidence]}`}
      className={`rounded px-1 py-px text-[10px] font-medium ${confidence === "low" ? "bg-surface-2 text-muted" : "bg-primary-soft text-primary"}`}
    >
      {confidence === "low" ? "grob" : "früh"}
    </span>
  );
}

/** Page head: small violet eyebrow, large title with an optional gradient accent, a short lead. */
export function PageHeader({ eyebrow, title, accent, children }: {
  eyebrow: string; title: string; accent?: string; children?: ReactNode;
}) {
  return (
    <header className="pt-2 pb-1">
      <div className="text-xs font-semibold tracking-[0.18em] text-primary uppercase">{eyebrow}</div>
      <h1 className="mt-2 text-3xl font-semibold tracking-tight md:text-4xl">
        {title}
        {accent ? <> <span className="text-gradient">{accent}</span></> : null}
      </h1>
      {children ? <div className="mt-2 max-w-3xl text-sm leading-relaxed text-muted">{children}</div> : null}
    </header>
  );
}
