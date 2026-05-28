// Searchable, paginated leads table (spec 005, US5 / task T050).
// Renders rows from GET /api/admin/leads. Search, date range, and page are
// URL-driven so the Server Component page re-renders on filter changes.
'use client';

import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import { useState, useTransition } from 'react';
import type { KeapSyncStatus, LeadRow } from '@/types/admin';

interface LeadsTableProps {
  rows: LeadRow[];
  page: number;
  pageSize: number;
  total: number;
  q: string;
  syncStatus: KeapSyncStatus | null;
  exportHref: string;
}

const SYNC_STYLES: Record<KeapSyncStatus, string> = {
  synced: 'bg-success-500/15 text-success-400',
  pending: 'bg-warning-500/15 text-warning-400',
  retrying: 'bg-info-500/15 text-info-400',
  failed: 'bg-error-500/15 text-error-400',
};

const SYNC_FILTERS: { label: string; value: KeapSyncStatus | '' }[] = [
  { label: 'All', value: '' },
  { label: 'Synced', value: 'synced' },
  { label: 'Pending', value: 'pending' },
  { label: 'Retrying', value: 'retrying' },
  { label: 'Failed', value: 'failed' },
];

function formatDateTime(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleString('en-ZA', {
    year: 'numeric',
    month: 'short',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function LeadsTable({
  rows,
  page,
  pageSize,
  total,
  q,
  syncStatus,
  exportHref,
}: LeadsTableProps) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const [searchInput, setSearchInput] = useState(q);
  const [isPending, startTransition] = useTransition();

  function navigate(patch: Record<string, string | null>) {
    const next = new URLSearchParams(params.toString());
    for (const [key, value] of Object.entries(patch)) {
      if (value === null || value === '') next.delete(key);
      else next.set(key, value);
    }
    // Any filter change resets pagination to page 1.
    if (!('page' in patch)) next.delete('page');
    startTransition(() => router.push(`${pathname}?${next.toString()}`));
  }

  function submitSearch(e: React.FormEvent) {
    e.preventDefault();
    navigate({ q: searchInput.trim() || null });
  }

  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const firstRow = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const lastRow = Math.min(total, page * pageSize);

  return (
    <div className="flex flex-col gap-space-4">
      <div className="flex flex-wrap items-center justify-between gap-space-3">
        <form onSubmit={submitSearch} className="flex items-center gap-space-2">
          <input
            type="search"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="Search name or email"
            className="w-64 rounded-sm border border-theme-border bg-theme-bg px-space-3 py-space-1 text-text-sm text-theme-text outline-none focus:border-accent-500"
            aria-label="Search leads"
          />
          <button
            type="submit"
            className="cursor-pointer rounded-sm border border-theme-border px-space-3 py-space-1 text-text-sm font-medium text-theme-text-muted transition-colors hover:text-theme-text"
          >
            Search
          </button>
          {q && (
            <button
              type="button"
              onClick={() => {
                setSearchInput('');
                navigate({ q: null });
              }}
              className="cursor-pointer text-text-sm text-theme-text-muted hover:text-theme-text"
            >
              Clear
            </button>
          )}
        </form>

        <div className="flex flex-wrap items-center gap-space-2">
          <label className="flex items-center gap-space-2 text-text-sm text-theme-text-muted">
            Sync status
            <select
              value={syncStatus ?? ''}
              onChange={(e) => navigate({ syncStatus: e.target.value || null })}
              className="cursor-pointer rounded-sm border border-theme-border bg-theme-bg px-space-2 py-space-1 text-text-sm text-theme-text outline-none focus:border-accent-500"
            >
              {SYNC_FILTERS.map((f) => (
                <option key={f.value} value={f.value}>
                  {f.label}
                </option>
              ))}
            </select>
          </label>
          <a
            href={exportHref}
            className="cursor-pointer rounded-sm bg-accent-500 px-space-3 py-space-1 text-text-sm font-bold text-neutral-950 transition-opacity hover:opacity-90"
          >
            Export CSV
          </a>
        </div>
      </div>

      <div className="overflow-x-auto rounded-md border border-theme-border bg-theme-bg-2">
        <table className="w-full border-collapse text-left text-text-sm">
          <thead>
            <tr className="border-b border-theme-border text-theme-text-muted">
              <th className="px-space-4 py-space-3 font-medium">Name</th>
              <th className="px-space-4 py-space-3 font-medium">Email</th>
              <th className="px-space-4 py-space-3 font-medium">Completed</th>
              <th className="px-space-4 py-space-3 font-medium">Score</th>
              <th className="px-space-4 py-space-3 font-medium">Archetype</th>
              <th className="px-space-4 py-space-3 font-medium">Source</th>
              <th className="px-space-4 py-space-3 font-medium">Sync</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td
                  colSpan={7}
                  className="px-space-4 py-space-6 text-center text-theme-text-muted"
                >
                  No leads match the current filters.
                </td>
              </tr>
            ) : (
              rows.map((r) => (
                <tr
                  key={r.resultId}
                  className="border-b border-theme-border/40 last:border-0"
                >
                  <td className="px-space-4 py-space-3 font-medium text-theme-text">
                    {r.firstName}
                  </td>
                  <td className="px-space-4 py-space-3 text-theme-text">{r.email}</td>
                  <td className="px-space-4 py-space-3 tabular-nums text-theme-text-muted">
                    {formatDateTime(r.completedAt)}
                  </td>
                  <td className="px-space-4 py-space-3 tabular-nums text-theme-text">
                    {r.overallScore}
                  </td>
                  <td className="px-space-4 py-space-3 text-theme-text">{r.archetypeName}</td>
                  <td className="px-space-4 py-space-3 text-theme-text-muted">
                    {r.trafficSource}
                  </td>
                  <td className="px-space-4 py-space-3">
                    <span
                      className={`rounded-sm px-space-2 py-[2px] text-[0.625rem] font-bold uppercase tracking-wider ${SYNC_STYLES[r.keapSyncStatus]}`}
                    >
                      {r.keapSyncStatus}
                    </span>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-space-3 text-text-sm text-theme-text-muted">
        <span aria-live="polite">
          {total === 0
            ? 'No results'
            : `Showing ${firstRow.toLocaleString()}–${lastRow.toLocaleString()} of ${total.toLocaleString()}`}
        </span>
        <div className="flex items-center gap-space-2">
          <button
            type="button"
            disabled={page <= 1 || isPending}
            onClick={() => navigate({ page: String(page - 1) })}
            className="cursor-pointer rounded-sm border border-theme-border px-space-3 py-space-1 font-medium text-theme-text-muted transition-colors hover:text-theme-text disabled:cursor-not-allowed disabled:opacity-40"
          >
            Previous
          </button>
          <span className="tabular-nums">
            Page {page} of {totalPages}
          </span>
          <button
            type="button"
            disabled={page >= totalPages || isPending}
            onClick={() => navigate({ page: String(page + 1) })}
            className="cursor-pointer rounded-sm border border-theme-border px-space-3 py-space-1 font-medium text-theme-text-muted transition-colors hover:text-theme-text disabled:cursor-not-allowed disabled:opacity-40"
          >
            Next
          </button>
        </div>
      </div>
    </div>
  );
}
