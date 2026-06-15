import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { CanvasBoard } from './CanvasBoard';

// Internal planning/scoping board. Never index it on production.
export const metadata: Metadata = {
  title: 'Planning Canvas · Worship Wheel (internal)',
  robots: { index: false, follow: false },
};

// Local-dev only: any production build (Vercel prod + preview, or `next start`)
// returns a normal 404 so the board is never reachable off a developer machine.
// `NODE_ENV` is 'development' only under `next dev`.
export default function CanvasPage() {
  if (process.env.NODE_ENV === 'production') notFound();
  return <CanvasBoard />;
}
