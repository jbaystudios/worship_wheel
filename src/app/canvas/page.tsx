import type { Metadata } from 'next';
import { CanvasBoard } from './CanvasBoard';

// Internal planning/scoping board. Never index it on production.
export const metadata: Metadata = {
  title: 'Planning Canvas · Worship Wheel (internal)',
  robots: { index: false, follow: false },
};

export default function CanvasPage() {
  return <CanvasBoard />;
}
