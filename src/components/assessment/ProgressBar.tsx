'use client';

import { useEffect, useRef, useState } from 'react';

interface ProgressBarProps {
  current: number;
  total: number;
  elementName: string;
}

const ELEMENTS = [
  'Fretboard',
  'Harmony',
  'Melody',
  'Rhythm',
  'Tone',
  'Theory',
  'Technique',
  'Aural',
];

const QUESTIONS_PER_ELEMENT = 2;

export function ProgressBar({ current, total, elementName }: ProgressBarProps) {
  const percent = Math.round((current / total) * 100);
  const [displayPercent, setDisplayPercent] = useState(0);
  const prevPercentRef = useRef(0);
  const rafRef = useRef<number | null>(null);

  // Animated count-up for the percentage number
  useEffect(() => {
    const from = prevPercentRef.current;
    const to = percent;
    const duration = 400;
    const start = performance.now();

    if (rafRef.current) cancelAnimationFrame(rafRef.current);

    function tick(now: number) {
      const elapsed = now - start;
      const progress = Math.min(elapsed / duration, 1);
      // Ease-out cubic
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplayPercent(Math.round(from + (to - from) * eased));

      if (progress < 1) {
        rafRef.current = requestAnimationFrame(tick);
      } else {
        prevPercentRef.current = to;
      }
    }

    rafRef.current = requestAnimationFrame(tick);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [percent]);

  // Which element index is active (0-based)
  const activeElementIndex = ELEMENTS.indexOf(elementName);

  return (
    <div className="flex w-full flex-col gap-space-3">
      {/* Top row: percentage + element badge + question count */}
      <div className="flex items-end justify-between">
        {/* Percentage — hero element */}
        <div className="flex items-baseline gap-space-1">
          <span className="text-h4 font-bold tabular-nums text-accent-500 leading-none">
            {displayPercent}
          </span>
          <span className="text-text-sm font-medium text-accent-500/60 leading-none">
            %
          </span>
        </div>

        {/* Right side: element badge + count */}
        <div className="flex flex-col items-end gap-space-1">
          <span className="rounded-sm bg-accent-500/15 px-space-2 py-[3px] text-[0.6875rem] font-bold uppercase tracking-[0.2em] text-accent-400">
            {elementName}
          </span>
          <span className="text-[0.75rem] font-medium text-theme-text-muted/50 tabular-nums">
            {current} / {total}
          </span>
        </div>
      </div>

      {/* Segmented progress track — one segment per element */}
      <div className="flex gap-[3px]">
        {ELEMENTS.map((el, i) => {
          const segmentStart = i * QUESTIONS_PER_ELEMENT;
          // How much of this segment is filled (0 to 1)
          const segmentProgress = Math.min(
            Math.max((current - segmentStart) / QUESTIONS_PER_ELEMENT, 0),
            1
          );
          const isActive = i === activeElementIndex;

          return (
            <div
              key={el}
              className="relative h-[5px] flex-1 overflow-hidden rounded-full bg-theme-text/[0.08]"
            >
              <div
                className="absolute inset-y-0 left-0 rounded-full transition-all duration-500 ease-out"
                style={{
                  width: `${segmentProgress * 100}%`,
                  backgroundColor: segmentProgress > 0 ? undefined : 'transparent',
                }}
              >
                {/* Filled portion with gold gradient */}
                <div
                  className={`h-full w-full rounded-full bg-accent-500 ${
                    isActive && segmentProgress > 0 && segmentProgress < 1
                      ? 'shadow-[0_0_8px_rgba(177,155,100,0.4)]'
                      : ''
                  }`}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
