// Shared CSS-chart primitives for the admin dashboard. Pulled out so every
// bar chart shares the same rail / fill / typography treatment.
// Spec 007, research.md Decision 4 (adapted: admin uses CSS bars, not Chart.js).
import { type ReactNode } from 'react';

interface CardProps {
  title?: string;
  children: ReactNode;
}

export function ChartCard({ title, children }: CardProps) {
  return (
    <div className="flex flex-col gap-space-3 rounded-md border border-theme-border bg-theme-bg-2 p-space-5">
      {title && (
        <h3 className="text-text-sm font-medium uppercase tracking-[0.15em] text-theme-text-muted">
          {title}
        </h3>
      )}
      <div className="flex flex-col gap-space-2">{children}</div>
    </div>
  );
}

interface BarProps {
  label: string;
  valueText: string;
  fraction: number; // 0..1
  thickness?: 'thin' | 'thick'; // thin for distribution bars, thick for funnel
}

export function ChartBar({ label, valueText, fraction, thickness = 'thin' }: BarProps) {
  const railClass = thickness === 'thick' ? 'h-3' : 'h-1.5';
  const pct = Math.min(Math.max(fraction * 100, 0), 100);
  return (
    <div className="flex flex-col gap-space-1">
      <div className="flex items-baseline justify-between gap-space-3">
        <span className="truncate text-text-sm text-theme-text">{label}</span>
        <span className="shrink-0 tabular-nums text-text-sm text-theme-text-muted">
          {valueText}
        </span>
      </div>
      <div
        className={`w-full overflow-hidden rounded-full bg-theme-text/[0.08] ${railClass}`}
      >
        <div
          className="h-full rounded-full bg-accent-500 transition-all motion-reduce:transition-none"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

export function ChartEmpty() {
  return <p className="text-text-sm text-theme-text-muted">No data for this range.</p>;
}
