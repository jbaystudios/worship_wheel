interface ProgressBarProps {
  current: number;
  total: number;
  elementName: string;
}

export function ProgressBar({ current, total, elementName }: ProgressBarProps) {
  const percent = (current / total) * 100;

  return (
    <div className="flex w-full flex-col gap-space-3">
      <div className="flex items-center justify-between max-md:flex-col max-md:items-center max-md:gap-space-2">
        <span className="rounded-sm bg-accent-500 px-space-3 py-space-1 text-[0.75rem] font-bold uppercase tracking-[0.2em] text-neutral-950 md:order-2">
          {elementName}
        </span>
        <span className="text-text-sm font-medium text-theme-text-muted md:order-1">
          Question {current} of {total}
        </span>
      </div>
      <div className="h-1.5 w-full overflow-hidden rounded-full bg-theme-bg-2">
        <div
          className="h-full rounded-full bg-accent-500 transition-all duration-500 ease-out"
          style={{ width: `${percent}%` }}
        />
      </div>
    </div>
  );
}
