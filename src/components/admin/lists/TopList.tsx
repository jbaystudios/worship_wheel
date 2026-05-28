// TopList — overview primitive for top-N-by-X lists (spec 007).
// Used in Acquisition overview (top sources) and Outcomes overview (archetype mix).
import { type ReactNode } from 'react';

export interface TopListItem {
  key: string;
  label: string;
  primaryMetric: string;
  secondaryMetric?: string;
  link?: ReactNode; // wrap row in <DrilldownLink>
}

interface TopListProps {
  title: string;
  items: TopListItem[];
  emptyMessage?: string;
}

export function TopList({ title, items, emptyMessage = 'No data for this range.' }: TopListProps) {
  return (
    <div className="flex flex-col gap-space-3 rounded-md border border-theme-border bg-theme-bg-2 p-space-5">
      <h3 className="text-text-sm font-medium uppercase tracking-[0.15em] text-theme-text-muted">
        {title}
      </h3>
      {items.length === 0 ? (
        <p className="text-text-sm text-theme-text-muted">{emptyMessage}</p>
      ) : (
        <ol className="flex flex-col gap-space-2">
          {items.map((item, i) => (
            <li
              key={item.key}
              className="flex items-baseline justify-between gap-space-3 border-b border-theme-border/40 pb-space-2 last:border-b-0 last:pb-0"
            >
              <div className="flex min-w-0 items-baseline gap-space-2">
                <span className="w-4 shrink-0 text-text-sm tabular-nums text-theme-text-muted">
                  {i + 1}
                </span>
                <span className="truncate text-text-sm text-theme-text">{item.label}</span>
              </div>
              <div className="flex shrink-0 flex-col items-end gap-space-1">
                <span className="text-text-sm font-medium tabular-nums text-theme-text">
                  {item.primaryMetric}
                </span>
                {item.secondaryMetric && (
                  <span className="text-text-sm tabular-nums text-theme-text-muted">
                    {item.secondaryMetric}
                  </span>
                )}
              </div>
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}
