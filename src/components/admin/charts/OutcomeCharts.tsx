// Audience & outcomes distribution charts (spec 005, refactored in spec 007
// onto shared ChartCard/ChartBar primitives).
import type { OutcomesResponse } from '@/types/admin';
import { ChartBar, ChartCard, ChartEmpty } from './chartPrimitives';

function pct(value: number): string {
  return `${(value * 100).toFixed(1)}%`;
}

export function ArchetypeChart({
  items,
}: {
  items: OutcomesResponse['archetypeDistribution'];
}) {
  return (
    <ChartCard title="Profile archetypes">
      {items.length === 0 ? (
        <ChartEmpty />
      ) : (
        items.map((a) => (
          <ChartBar
            key={a.archetype}
            label={a.name}
            valueText={`${a.count} · ${pct(a.share)}`}
            fraction={a.share}
          />
        ))
      )}
    </ChartCard>
  );
}

export function ScoreBandChart({
  items,
}: {
  items: OutcomesResponse['scoreBandDistribution'];
}) {
  return (
    <ChartCard title="Overall score bands">
      {items.map((b) => (
        <ChartBar
          key={b.band}
          label={b.band}
          valueText={`${b.count} · ${pct(b.share)}`}
          fraction={b.share}
        />
      ))}
    </ChartCard>
  );
}

export function ElementAveragesChart({
  items,
}: {
  items: OutcomesResponse['elementAverages'];
}) {
  return (
    <ChartCard title="Average score per element">
      {items.map((e) => (
        <ChartBar
          key={e.code}
          label={e.name}
          valueText={`${e.avgScore.toFixed(1)} / 10`}
          fraction={e.avgScore / 10}
        />
      ))}
    </ChartCard>
  );
}

export function DeviceSplitChart({
  items,
}: {
  items: OutcomesResponse['deviceSplit'];
}) {
  const totalVisitors = items.reduce((sum, d) => sum + d.visitors, 0);
  return (
    <ChartCard title="Device split">
      {items.length === 0 ? (
        <ChartEmpty />
      ) : (
        items.map((d) => (
          <ChartBar
            key={d.device}
            label={d.device.charAt(0).toUpperCase() + d.device.slice(1)}
            valueText={`${d.visitors} visitors · ${d.completers} completed`}
            fraction={totalVisitors > 0 ? d.visitors / totalVisitors : 0}
          />
        ))
      )}
    </ChartCard>
  );
}
