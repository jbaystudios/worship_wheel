import type { ReactNode } from 'react';

// Shared "frame" chrome — a titled card, the visual unit of the canvas.
export function Frame({
  title,
  badge,
  accent = 'neutral',
  children,
  bodyClassName = '',
}: {
  title: string;
  badge?: string;
  accent?: 'neutral' | 'instagram' | 'campaign';
  children: ReactNode;
  bodyClassName?: string;
}) {
  const accentBar =
    accent === 'instagram'
      ? 'bg-accent-500'
      : accent === 'campaign'
        ? 'bg-success-500'
        : 'bg-neutral-600';

  return (
    <div className="overflow-hidden rounded-md border border-neutral-700 bg-neutral-900 shadow-xl">
      <div className="flex items-center justify-between gap-space-3 border-b border-neutral-700 bg-neutral-800 px-space-4 py-space-2">
        <div className="flex items-center gap-space-2">
          <span className={`h-2.5 w-2.5 rounded-full ${accentBar}`} />
          <span className="text-text-sm font-bold text-neutral-100">{title}</span>
        </div>
        {badge && (
          <span className="rounded-sm bg-neutral-800 px-space-2 py-0.5 font-mono text-[11px] text-neutral-400">
            {badge}
          </span>
        )}
      </div>
      <div className={bodyClassName}>{children}</div>
    </div>
  );
}
