// Funnel step visualisation (spec 005, refactored in spec 007 onto shared
// ChartCard/ChartBar primitives). Proportional CSS bars.
import type { FunnelStepRow } from '@/types/admin';
import { ChartBar, ChartCard } from './chartPrimitives';

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
    <ChartCard>
      {funnel.map((row) => {
        const sub =
          row.rateFromPrevious !== null
            ? `${row.count.toLocaleString()} · ${pct(row.rateFromPrevious)} of previous`
            : row.count.toLocaleString();
        return (
          <ChartBar
            key={row.step}
            label={STEP_LABELS[row.step]}
            valueText={sub}
            fraction={row.count > 0 ? Math.max(row.rateFromVisitors, 0.02) : 0}
            thickness="thick"
          />
        );
      })}
    </ChartCard>
  );
}
