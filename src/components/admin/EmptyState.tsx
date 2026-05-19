// Shared empty-state placeholder for dashboard charts and tables (spec 005, FR-043).

export function EmptyState({
  title = 'No data for this range',
  message = 'Try widening the date range, or check back once more assessments have been taken.',
}: {
  title?: string;
  message?: string;
}) {
  return (
    <div className="flex flex-col items-center justify-center gap-space-2 rounded-md border border-theme-border bg-theme-bg-2 px-space-5 py-space-6 text-center">
      <svg
        className="h-8 w-8 text-theme-text-muted"
        fill="none"
        viewBox="0 0 24 24"
        strokeWidth={1.5}
        stroke="currentColor"
        aria-hidden="true"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M3.75 3v11.25A2.25 2.25 0 0 0 6 16.5h12M3.75 3h-1.5m1.5 0h16.5m0 0h1.5m-1.5 0v11.25A2.25 2.25 0 0 1 18 16.5h-2.25m-7.5 0h7.5m-7.5 0-1 3m8.5-3 1 3m0 0 .5 1.5m-.5-1.5h-9.5m0 0-.5 1.5"
        />
      </svg>
      <p className="text-text-base font-bold text-theme-text">{title}</p>
      <p className="max-w-sm text-text-sm text-theme-text-muted">{message}</p>
    </div>
  );
}
