// Shared dashboard stat card (spec 005). Mirrors the results-page StatCard
// styling for visual consistency, with an optional prior-period delta (FR-042).

interface StatCardProps {
  label: string;
  value: string | number;
  sub?: string;
  /** Signed fractional change vs the prior period, e.g. 0.12 = +12%. */
  delta?: number | null;
}

function DeltaBadge({ delta }: { delta: number }) {
  const positive = delta >= 0;
  const pct = `${positive ? '+' : ''}${(delta * 100).toFixed(1)}%`;
  return (
    <span
      className={`text-text-sm font-medium ${
        positive ? 'text-success-500' : 'text-error-500'
      }`}
    >
      {pct} <span className="text-theme-text-muted">vs prior</span>
    </span>
  );
}

export function StatCard({ label, value, sub, delta }: StatCardProps) {
  return (
    <div className="flex flex-1 flex-col gap-space-2 rounded-md border border-theme-border bg-theme-bg-2 px-space-5 py-space-4">
      <span className="text-text-sm font-medium uppercase tracking-[0.15em] text-theme-text-muted">
        {label}
      </span>
      <span className="text-h4 max-md:text-h5 font-bold text-accent-500">
        {value}
      </span>
      {sub && <span className="text-text-sm text-theme-text-muted">{sub}</span>}
      {delta !== undefined && delta !== null && <DeltaBadge delta={delta} />}
    </div>
  );
}
