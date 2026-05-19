// Funnel step visualisation (spec 005, US2 / task T034). Proportional CSS bars
// — consistent with the app's existing ElementBreakdown pattern (the results
// page reserves Chart.js for the radar chart only).
import type { FunnelStepRow } from '@/types/admin';

const STEP_LABELS: Record<FunnelStepRow['step'], string> = {
  visitors: 'Visitors',
  started: 'Started',
  completed: 'Completed',
  lead_captured: 'Lead Captured',
};

function pct(value: number): string {
  return `${(value * 100).toFixed(1)}%`;
}

export function FunnelChart({ funnel }: { funnel: FunnelStepRow[] }) {
  return (
    <div className="flex flex-col gap-space-4 rounded-md border border-theme-border bg-theme-bg-2 p-space-5">
      {funnel.map((row) => (
        <div key={row.step} className="flex flex-col gap-space-1">
          <div className="flex items-baseline justify-between">
            <span className="text-text-sm font-medium text-theme-text">
              {STEP_LABELS[row.step]}
            </span>
            <span className="text-text-sm tabular-nums text-theme-text-muted">
              {row.count.toLocaleString()}
              {row.rateFromPrevious !== null && (
                <span className="ml-space-2 text-theme-text-muted/70">
                  {pct(row.rateFromPrevious)} of previous step
                </span>
              )}
            </span>
          </div>
          <div className="h-3 w-full overflow-hidden rounded-full bg-theme-text/[0.08]">
            <div
              className="h-full rounded-full bg-accent-500 transition-all"
              style={{
                width: `${
                  row.count > 0 ? Math.max(row.rateFromVisitors * 100, 2) : 0
                }%`,
              }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}
