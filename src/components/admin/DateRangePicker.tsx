'use client';

// Date-range control for dashboard views (spec 005, US2 / task T032).
// Pushes the selected range to the URL; the Server Component page re-renders.
import { useRouter, usePathname } from 'next/navigation';
import { ALL_TIME_FROM, addDays, todayInReportingTz } from '@/lib/analytics/date-range';

const PRESETS = [
  { label: 'Last 7 days', days: 7 },
  { label: 'Last 30 days', days: 30 },
  { label: 'Last 90 days', days: 90 },
];

interface DateRangePickerProps {
  from: string;
  to: string;
  includeInternal: boolean;
}

export function DateRangePicker({ from, to, includeInternal }: DateRangePickerProps) {
  const router = useRouter();
  const pathname = usePathname();
  const today = todayInReportingTz();

  function navigate(next: { from?: string; to?: string; includeInternal?: boolean }) {
    const params = new URLSearchParams();
    params.set('from', next.from ?? from);
    params.set('to', next.to ?? to);
    if (next.includeInternal ?? includeInternal) params.set('includeInternal', 'true');
    router.push(`${pathname}?${params.toString()}`);
  }

  const inputClass =
    'rounded-sm border border-theme-border bg-theme-bg px-space-2 py-space-1 text-text-sm text-theme-text outline-none focus:border-accent-500 cursor-pointer';

  const isAllTime = from === ALL_TIME_FROM && to === today;

  return (
    <div className="flex flex-wrap items-center gap-space-2">
      {PRESETS.map((preset) => (
        <button
          key={preset.label}
          type="button"
          onClick={() => navigate({ from: addDays(today, -(preset.days - 1)), to: today })}
          className="cursor-pointer rounded-sm border border-theme-border px-space-3 py-space-1 text-text-sm font-medium text-theme-text-muted transition-colors hover:text-theme-text"
        >
          {preset.label}
        </button>
      ))}

      <button
        type="button"
        onClick={() => navigate({ from: ALL_TIME_FROM, to: today })}
        aria-pressed={isAllTime}
        className={`cursor-pointer rounded-sm border px-space-3 py-space-1 text-text-sm font-medium transition-colors ${
          isAllTime
            ? 'border-accent-500 bg-accent-500 text-white'
            : 'border-theme-border text-theme-text-muted hover:text-theme-text'
        }`}
      >
        All time
      </button>

      <input
        type="date"
        value={from}
        max={to}
        onChange={(e) => navigate({ from: e.target.value })}
        className={inputClass}
        aria-label="Range start"
      />
      <span className="text-theme-text-muted">→</span>
      <input
        type="date"
        value={to}
        min={from}
        max={today}
        onChange={(e) => navigate({ to: e.target.value })}
        className={inputClass}
        aria-label="Range end"
      />

      <label className="flex cursor-pointer items-center gap-space-1 text-text-sm text-theme-text-muted">
        <input
          type="checkbox"
          checked={includeInternal}
          onChange={(e) => navigate({ includeInternal: e.target.checked })}
          className="cursor-pointer accent-accent-500"
        />
        Include internal
      </label>
    </div>
  );
}
