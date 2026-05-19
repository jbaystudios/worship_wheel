// Traffic-source table with per-source conversion rates (spec 005, US3 / T039).
import type { AcquisitionSourceRow, SourceKind } from '@/types/admin';

const KIND_STYLES: Record<SourceKind, string> = {
  utm: 'bg-accent-500/15 text-accent-400',
  referrer: 'bg-info-500/15 text-info-400',
  direct: 'bg-theme-text/10 text-theme-text-muted',
};

function pct(value: number): string {
  return `${(value * 100).toFixed(1)}%`;
}

export function SourceTable({ sources }: { sources: AcquisitionSourceRow[] }) {
  const maxVisits = Math.max(1, ...sources.map((s) => s.visits));

  return (
    <div className="overflow-x-auto rounded-md border border-theme-border bg-theme-bg-2">
      <table className="w-full border-collapse text-left text-text-sm">
        <thead>
          <tr className="border-b border-theme-border text-theme-text-muted">
            <th className="px-space-4 py-space-3 font-medium">Source</th>
            <th className="px-space-4 py-space-3 font-medium">Visits</th>
            <th className="px-space-4 py-space-3 font-medium">Started</th>
            <th className="px-space-4 py-space-3 font-medium">Completed</th>
            <th className="px-space-4 py-space-3 font-medium">Lead capture</th>
          </tr>
        </thead>
        <tbody>
          {sources.map((s) => (
            <tr
              key={`${s.kind}:${s.source}`}
              className="border-b border-theme-border/40 last:border-0"
            >
              <td className="px-space-4 py-space-3">
                <div className="flex flex-wrap items-center gap-space-2">
                  <span className="font-medium text-theme-text">{s.source}</span>
                  <span
                    className={`rounded-sm px-space-2 py-[2px] text-[0.625rem] font-bold uppercase tracking-wider ${KIND_STYLES[s.kind]}`}
                  >
                    {s.kind}
                  </span>
                  {s.campaign && (
                    <span className="text-text-sm text-theme-text-muted/70">
                      {s.campaign}
                    </span>
                  )}
                </div>
              </td>
              <td className="px-space-4 py-space-3">
                <div className="flex items-center gap-space-2">
                  <div className="h-2 w-20 shrink-0 overflow-hidden rounded-full bg-theme-text/[0.08]">
                    <div
                      className="h-full rounded-full bg-accent-500"
                      style={{ width: `${(s.visits / maxVisits) * 100}%` }}
                    />
                  </div>
                  <span className="tabular-nums text-theme-text">
                    {s.visits.toLocaleString()}
                  </span>
                </div>
              </td>
              <td className="px-space-4 py-space-3 tabular-nums text-theme-text">
                {pct(s.startedRate)}
              </td>
              <td className="px-space-4 py-space-3 tabular-nums text-theme-text">
                {pct(s.completionRate)}
              </td>
              <td className="px-space-4 py-space-3 tabular-nums font-medium text-accent-500">
                {pct(s.leadRate)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
