// SectionRhythm — page-rhythm primitive enforcing one primary visual per page.
// `primary` slot: largest visual weight, full width.
// `secondary` slot: 2-column row on desktop, stacked on mobile/tablet.
// `tertiary` slot: collapses to single column on tablet/mobile.
// Spec 007, research.md Decision 6.
import { type ReactNode } from 'react';

interface SectionRhythmProps {
  primary: ReactNode;
  secondary?: ReactNode;
  tertiary?: ReactNode;
}

export function SectionRhythm({ primary, secondary, tertiary }: SectionRhythmProps) {
  return (
    <div className="flex flex-col gap-space-5">
      <div>{primary}</div>
      {secondary && (
        <div className="grid grid-cols-2 gap-space-4 max-md:grid-cols-1">{secondary}</div>
      )}
      {tertiary && <div>{tertiary}</div>}
    </div>
  );
}
