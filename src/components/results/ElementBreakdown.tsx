import type { ElementScore } from '@/types';

interface ElementBreakdownProps {
  elementScores: ElementScore[];
}

function ElementRow({ element }: { element: ElementScore }) {
  const isHigh = element.score >= 5;
  const borderClass = isHigh ? 'border-accent-500' : 'border-warning-400';
  const bandTextClass = isHigh ? 'text-accent-400' : 'text-warning-400';
  const scoreTextClass = isHigh ? 'text-accent-400' : 'text-warning-400';
  const barFillClass = isHigh ? 'bg-accent-600' : 'bg-warning-500';

  return (
    <div
      className={`flex items-center gap-space-4 rounded-sm border-[1.5px] bg-theme-bg-2 p-space-4 max-md:flex-col max-md:items-stretch max-md:gap-space-3 max-md:p-space-3 ${borderClass}`}
    >
      {/* Info block */}
      <div className="flex w-[110px] shrink-0 flex-col gap-[2px] max-md:w-full max-md:flex-row max-md:items-center max-md:justify-between">
        <span className="text-text-sm font-bold text-theme-text">
          {element.elementName}
        </span>
        <span className={`text-text-sm ${bandTextClass}`}>
          {element.band.label}
        </span>
      </div>

      {/* Score bar */}
      <div className="relative flex-1 h-[12px] rounded-full bg-theme-border">
        <div
          className={`absolute inset-y-0 left-0 rounded-full ${barFillClass}`}
          style={{ width: `${element.score * 10}%` }}
        />
      </div>

      {/* Score number */}
      <span className={`w-[32px] shrink-0 text-right text-h5 max-md:text-h6 font-bold ${scoreTextClass}`}>
        {element.score}
      </span>
    </div>
  );
}

export function ElementBreakdown({ elementScores }: ElementBreakdownProps) {
  return (
    <section className="flex w-full flex-col items-center gap-space-5 max-md:gap-space-4">
      <h2 className="text-h4 max-md:text-h5 font-bold text-theme-text text-center">
        Element Breakdown
      </h2>
      <div className="flex w-full flex-col gap-space-3 max-md:gap-space-2">
        {elementScores.map((element) => (
          <ElementRow key={element.elementCode} element={element} />
        ))}
      </div>
    </section>
  );
}
