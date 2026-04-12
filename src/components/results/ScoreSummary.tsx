interface ScoreSummaryProps {
  overallScore: number;
  overallPercentage: number;
  balanceValue: number;
  archetypeName: string;
}

function StatCard({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-space-2 rounded-md bg-theme-bg-2 p-space-5 max-md:p-space-4 text-center">
      <span className="text-text-sm font-medium uppercase tracking-[0.15em] text-theme-text-muted">
        {label}
      </span>
      {children}
    </div>
  );
}

export function ScoreSummary({
  overallScore,
  overallPercentage,
  balanceValue,
  archetypeName,
}: ScoreSummaryProps) {
  // Strip "The " prefix for cleaner stat card display
  const shortName = archetypeName.replace(/^The\s+/i, '');

  return (
    <div className="flex w-full gap-space-4 max-md:flex-col max-md:gap-space-3">
      <StatCard label="Overall Score">
        <span className="text-h4 max-md:text-h5 font-bold text-accent-500">
          {overallScore}/80
        </span>
        <span className="text-text-sm text-theme-text-muted">
          {overallPercentage.toFixed(2)}%
        </span>
      </StatCard>

      <StatCard label="Balance">
        <span className="text-h4 max-md:text-h5 font-bold text-accent-500">
          {balanceValue.toFixed(1)}
        </span>
        <span className="text-text-sm text-theme-text-muted">out of 10</span>
      </StatCard>

      <StatCard label="Profile">
        <span className="text-h6 max-md:text-text-base font-bold text-accent-500 leading-tight">
          {shortName}
        </span>
      </StatCard>
    </div>
  );
}
