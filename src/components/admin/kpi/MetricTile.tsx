// MetricTile — KPI primitive for the admin dashboard (spec 007).
// `variant="primary"` is the page's headline metric: larger type, accent fill on the value.
// `variant="secondary"` is supporting context: neutral colour, demoted weight.
// Exactly one `primary` tile per page (research.md Decision 6 + US5 acceptance scenario 1).
import { type ReactNode } from 'react';

interface MetricTileProps {
  label: string;
  value: string | number;
  sub?: string;
  /** Signed fractional change vs the prior period, e.g. 0.12 = +12%. */
  delta?: number | null;
  variant?: 'primary' | 'secondary';
  trailing?: ReactNode;
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

export function MetricTile({
  label,
  value,
  sub,
  delta,
  variant = 'secondary',
  trailing,
}: MetricTileProps) {
  const valueClass =
    variant === 'primary'
      ? 'text-h4 max-md:text-h5 font-bold text-accent-500'
      : 'text-h5 max-md:text-h6 font-bold text-theme-text';
  return (
    <div className="flex flex-1 flex-col gap-space-2 rounded-md border border-theme-border bg-theme-bg-2 px-space-5 py-space-4">
      <span className="text-text-sm font-medium uppercase tracking-[0.15em] text-theme-text-muted">
        {label}
      </span>
      <span className={valueClass}>{value}</span>
      {sub && <span className="text-text-sm text-theme-text-muted">{sub}</span>}
      {delta !== undefined && delta !== null && <DeltaBadge delta={delta} />}
      {trailing}
    </div>
  );
}
