// Keap sync-health panel (spec 005, US5 / task T050, FR-040).
// Shows failed + retrying syncs with their last error. The dashboard only
// observes — never triggers or repairs a Keap sync.
import type { LeadRow } from '@/types/admin';

interface SyncHealthPanelProps {
  /** Pre-filtered to keapSyncStatus in {failed, retrying}. */
  rows: LeadRow[];
  /** Whether the underlying data load failed (renders neutral, not "healthy"). */
  unavailable?: boolean;
}

function formatDateTime(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleString('en-ZA', {
    month: 'short',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function SyncHealthPanel({ rows, unavailable }: SyncHealthPanelProps) {
  if (unavailable) {
    return (
      <section
        aria-labelledby="sync-health-heading"
        className="rounded-md border border-theme-border bg-theme-bg-2 px-space-5 py-space-4"
      >
        <h2 id="sync-health-heading" className="text-text-base font-bold text-theme-text">
          Keap sync health
        </h2>
        <p className="mt-space-1 text-text-sm text-theme-text-muted">
          Sync status is unavailable right now.
        </p>
      </section>
    );
  }

  if (rows.length === 0) {
    return (
      <section
        aria-labelledby="sync-health-heading"
        className="rounded-md border border-success-500/30 bg-success-500/[0.06] px-space-5 py-space-4"
      >
        <div className="flex items-center gap-space-2">
          <svg
            className="h-4 w-4 text-success-400"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={2}
            stroke="currentColor"
            aria-hidden="true"
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
          </svg>
          <h2 id="sync-health-heading" className="text-text-base font-bold text-success-400">
            All leads synced to Keap
          </h2>
        </div>
        <p className="mt-space-1 text-text-sm text-theme-text-muted">
          No failed or retrying syncs in the selected range.
        </p>
      </section>
    );
  }

  return (
    <section
      aria-labelledby="sync-health-heading"
      className="rounded-md border border-error-500/40 bg-error-500/[0.04]"
    >
      <header className="border-b border-theme-border px-space-5 py-space-3">
        <h2 id="sync-health-heading" className="text-text-base font-bold text-error-400">
          {rows.length} {rows.length === 1 ? 'sync needs attention' : 'syncs need attention'}
        </h2>
        <p className="mt-space-1 text-text-sm text-theme-text-muted">
          Failed and retrying Keap syncs. The dashboard observes only — fix at the source.
        </p>
      </header>
      <ul className="divide-y divide-theme-border/40">
        {rows.map((r) => (
          <li
            key={r.resultId}
            className="flex flex-wrap items-start justify-between gap-space-2 px-space-5 py-space-3"
          >
            <div className="min-w-0">
              <p className="truncate text-text-sm font-medium text-theme-text">{r.email}</p>
              <p className="mt-space-1 text-text-sm text-theme-text-muted">
                Completed {formatDateTime(r.completedAt)} ·{' '}
                <span className="uppercase tracking-wider text-error-400">
                  {r.keapSyncStatus}
                </span>
              </p>
              {r.keapSyncError && (
                <p className="mt-space-1 break-words text-text-sm text-error-400/90">
                  {r.keapSyncError}
                </p>
              )}
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}
