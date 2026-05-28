// Skeleton blocks shaped to match final layouts. Used by route-level loading.tsx
// files to keep page rhythm intact during data fetch — no spinners, no layout
// shift on arrival. Respects prefers-reduced-motion.
import { type ReactNode } from 'react';

interface BoxProps {
  className?: string;
  children?: ReactNode;
}

function SkeletonBox({ className = '' }: BoxProps) {
  return (
    <div
      className={`animate-pulse rounded-md bg-theme-bg-2 motion-reduce:animate-none ${className}`}
      aria-hidden="true"
    />
  );
}

function Tile() {
  return (
    <div className="flex flex-1 flex-col gap-space-2 rounded-md border border-theme-border bg-theme-bg-2 px-space-5 py-space-4">
      <SkeletonBox className="h-3 w-1/3" />
      <SkeletonBox className="h-8 w-1/2" />
      <SkeletonBox className="h-3 w-2/5" />
    </div>
  );
}

function Chart({ height = 240 }: { height?: number }) {
  return (
    <div
      className="rounded-md border border-theme-border bg-theme-bg-2 p-space-4"
      style={{ height }}
    >
      <SkeletonBox className="h-full w-full" />
    </div>
  );
}

function Row() {
  return (
    <div className="flex items-center gap-space-3 rounded-sm border border-theme-border px-space-4 py-space-3">
      <SkeletonBox className="h-4 w-1/4" />
      <SkeletonBox className="h-4 w-1/3" />
      <SkeletonBox className="h-4 w-1/6" />
      <SkeletonBox className="ml-auto h-4 w-12" />
    </div>
  );
}

function List({ rows = 5 }: { rows?: number }) {
  return (
    <div className="flex flex-col gap-space-2">
      {Array.from({ length: rows }, (_, i) => (
        <Row key={i} />
      ))}
    </div>
  );
}

function Header() {
  return (
    <div className="flex flex-col gap-space-2 border-b border-theme-border pb-space-4">
      <SkeletonBox className="h-6 w-40" />
      <SkeletonBox className="h-4 w-72" />
    </div>
  );
}

export const Skeleton = { Box: SkeletonBox, Tile, Chart, Row, List, Header };
