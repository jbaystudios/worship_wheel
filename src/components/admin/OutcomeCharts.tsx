// Audience & outcomes distribution charts (spec 005, US4 / task T044).
// Proportional CSS bars, consistent with the rest of the dashboard.
import type { OutcomesResponse } from '@/types/admin';

function pct(value: number): string {
  return `${(value * 100).toFixed(1)}%`;
}

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-space-3 rounded-md border border-theme-border bg-theme-bg-2 p-space-5">
      <h3 className="text-text-sm font-medium uppercase tracking-[0.15em] text-theme-text-muted">
        {title}
      </h3>
      <div className="flex flex-col gap-space-2">{children}</div>
    </div>
  );
}

function Bar({
  label,
  valueText,
  fraction,
}: {
  label: string;
  valueText: string;
  fraction: number;
}) {
  return (
    <div className="flex flex-col gap-space-1">
      <div className="flex items-baseline justify-between gap-space-3">
        <span className="truncate text-text-sm text-theme-text">{label}</span>
        <span className="shrink-0 tabular-nums text-text-sm text-theme-text-muted">
          {valueText}
        </span>
      </div>
      <div className="h-1.5 w-full overflow-hidden rounded-full bg-theme-text/[0.08]">
        <div
          className="h-full rounded-full bg-accent-500"
          style={{ width: `${Math.min(Math.max(fraction * 100, 0), 100)}%` }}
        />
      </div>
    </div>
  );
}

function NoData() {
  return <p className="text-text-sm text-theme-text-muted">No data for this range.</p>;
}

export function ArchetypeChart({
  items,
}: {
  items: OutcomesResponse['archetypeDistribution'];
}) {
  return (
    <Card title="Profile archetypes">
      {items.length === 0 ? (
        <NoData />
      ) : (
        items.map((a) => (
          <Bar
            key={a.archetype}
            label={a.name}
            valueText={`${a.count} · ${pct(a.share)}`}
            fraction={a.share}
          />
        ))
      )}
    </Card>
  );
}

export function ScoreBandChart({
  items,
}: {
  items: OutcomesResponse['scoreBandDistribution'];
}) {
  return (
    <Card title="Overall score bands">
      {items.map((b) => (
        <Bar
          key={b.band}
          label={b.band}
          valueText={`${b.count} · ${pct(b.share)}`}
          fraction={b.share}
        />
      ))}
    </Card>
  );
}

export function ElementAveragesChart({
  items,
}: {
  items: OutcomesResponse['elementAverages'];
}) {
  return (
    <Card title="Average score per element">
      {items.map((e) => (
        <Bar
          key={e.code}
          label={e.name}
          valueText={`${e.avgScore.toFixed(1)} / 10`}
          fraction={e.avgScore / 10}
        />
      ))}
    </Card>
  );
}

export function DeviceSplitChart({
  items,
}: {
  items: OutcomesResponse['deviceSplit'];
}) {
  const totalVisitors = items.reduce((sum, d) => sum + d.visitors, 0);
  return (
    <Card title="Device split">
      {items.length === 0 ? (
        <NoData />
      ) : (
        items.map((d) => (
          <Bar
            key={d.device}
            label={d.device.charAt(0).toUpperCase() + d.device.slice(1)}
            valueText={`${d.visitors} visitors · ${d.completers} completed`}
            fraction={totalVisitors > 0 ? d.visitors / totalVisitors : 0}
          />
        ))
      )}
    </Card>
  );
}
