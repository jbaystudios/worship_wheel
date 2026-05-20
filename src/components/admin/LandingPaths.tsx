// Top landing paths for incoming traffic (spec 005, US3 / task T039).

export function LandingPaths({
  paths,
}: {
  paths: { path: string; visits: number }[];
}) {
  const maxVisits = Math.max(1, ...paths.map((p) => p.visits));

  return (
    <div className="flex flex-col gap-space-3 rounded-md border border-theme-border bg-theme-bg-2 p-space-5">
      <h3 className="text-text-sm font-medium uppercase tracking-[0.15em] text-theme-text-muted">
        Top landing paths
      </h3>
      {paths.length === 0 ? (
        <p className="text-text-sm text-theme-text-muted">
          No landing paths recorded for this range.
        </p>
      ) : (
      <div className="flex flex-col gap-space-2">
        {paths.map((p) => (
          <div key={p.path} className="flex flex-col gap-space-1">
            <div className="flex items-baseline justify-between gap-space-3">
              <span className="truncate font-mono text-text-sm text-theme-text">
                {p.path}
              </span>
              <span className="shrink-0 tabular-nums text-text-sm text-theme-text-muted">
                {p.visits.toLocaleString()}
              </span>
            </div>
            <div className="h-1.5 w-full overflow-hidden rounded-full bg-theme-text/[0.08]">
              <div
                className="h-full rounded-full bg-accent-500"
                style={{ width: `${(p.visits / maxVisits) * 100}%` }}
              />
            </div>
          </div>
        ))}
      </div>
      )}
    </div>
  );
}
