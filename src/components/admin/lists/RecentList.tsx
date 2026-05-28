'use client';

// RecentList — chronological N-row preview list (spec 007).
// Used in the Leads overview for the recent-10 preview. Optional `href` per
// row wraps the row in a <DrilldownLink> preserving URL state.
import { type ReactNode } from 'react';
import { DrilldownLink } from '@/components/admin/drilldown/DrilldownLink';

export interface RecentListRow {
  key: string;
  primary: string;
  secondary?: string;
  timestamp: string;
  trailing?: ReactNode;
  href?: string;
}

interface RecentListProps {
  title: string;
  rows: RecentListRow[];
  emptyMessage?: string;
}

function RowBody({ row }: { row: RecentListRow }) {
  return (
    <div className="flex items-center justify-between gap-space-3 px-space-3 py-space-2">
      <div className="flex min-w-0 flex-col gap-[2px]">
        <span className="truncate text-text-sm font-medium text-theme-text">
          {row.primary}
        </span>
        {row.secondary && (
          <span className="truncate text-text-sm text-theme-text-muted">{row.secondary}</span>
        )}
      </div>
      <div className="flex shrink-0 items-center gap-space-3">
        {row.trailing}
        <span className="text-text-sm tabular-nums text-theme-text-muted">{row.timestamp}</span>
      </div>
    </div>
  );
}

export function RecentList({
  title,
  rows,
  emptyMessage = 'No recent activity in this range.',
}: RecentListProps) {
  return (
    <div className="flex flex-col gap-space-3 rounded-md border border-theme-border bg-theme-bg-2 p-space-5">
      <h3 className="text-text-sm font-medium uppercase tracking-[0.15em] text-theme-text-muted">
        {title}
      </h3>
      {rows.length === 0 ? (
        <p className="text-text-sm text-theme-text-muted">{emptyMessage}</p>
      ) : (
        <ul className="-mx-space-3 flex flex-col">
          {rows.map((row) => (
            <li
              key={row.key}
              className="border-b border-theme-border/40 last:border-b-0"
            >
              {row.href ? (
                <DrilldownLink
                  href={row.href}
                  className="block rounded-sm transition-colors hover:bg-theme-bg/60"
                >
                  <RowBody row={row} />
                </DrilldownLink>
              ) : (
                <RowBody row={row} />
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
