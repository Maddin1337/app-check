/** Daily series as an area chart with an optional P10-P90 band; server-rendered SVG, no client code. */
export function AreaChart({ points, format, height = 160, emptyText }: {
  points: { day: Date; value: number | null; low?: number | null; high?: number | null }[];
  format: (value: number) => string;
  height?: number;
  emptyText: string;
}) {
  const data = points.filter((p): p is { day: Date; value: number; low?: number | null; high?: number | null } => p.value != null);
  if (data.length < 2) {
    return (
      <div style={{ height }} className="grid place-items-center rounded-xl border border-dashed border-border text-center text-xs text-muted">
        <span className="max-w-64 px-4">{emptyText}</span>
      </div>
    );
  }
  const width = 600;
  const values = data.flatMap((p) => [p.value, p.low ?? p.value, p.high ?? p.value]).map(Number);
  const min = Math.min(...values);
  const max = Math.max(...values);
  const span = max - min || Math.abs(max) || 1;
  const x = (i: number) => (i / (data.length - 1)) * width;
  const y = (v: number) => height - 8 - ((Number(v) - min) / span) * (height - 24);
  const line = data.map((p, i) => `${x(i).toFixed(1)},${y(p.value).toFixed(1)}`).join(" ");
  const area = `0,${height} ${line} ${width},${height}`;
  const hasBand = data.some((p) => p.low != null && p.high != null);
  const band = hasBand
    ? `${data.map((p, i) => `${x(i).toFixed(1)},${y(p.high ?? p.value).toFixed(1)}`).join(" ")} ${
        [...data].reverse().map((p, i) => `${x(data.length - 1 - i).toFixed(1)},${y(p.low ?? p.value).toFixed(1)}`).join(" ")}`
    : null;
  const day = new Intl.DateTimeFormat("de-DE", { day: "2-digit", month: "2-digit" });
  return (
    <div>
      <div className="mb-1 flex justify-between text-xs text-muted">
        <span>{format(max)}</span>
        <span className="tabular-nums">{format(data[data.length - 1].value)} aktuell</span>
      </div>
      <svg viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="none" className="h-auto w-full" style={{ height }} aria-hidden>
        <defs>
          <linearGradient id="area-fill" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stopColor="#9d8cff" stopOpacity="0.35" />
            <stop offset="100%" stopColor="#9d8cff" stopOpacity="0" />
          </linearGradient>
        </defs>
        {band ? <polygon points={band} fill="#9d8cff" opacity="0.12" /> : null}
        <polygon points={area} fill="url(#area-fill)" />
        <polyline points={line} fill="none" stroke="#b9adff" strokeWidth="2" vectorEffect="non-scaling-stroke" strokeLinejoin="round" />
      </svg>
      <div className="mt-1 flex justify-between text-xs text-muted tabular-nums">
        <span>{day.format(data[0].day)}</span>
        <span>{day.format(data[data.length - 1].day)}</span>
      </div>
    </div>
  );
}
