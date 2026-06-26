'use client';

// First-load capture of `utm_*` params. Mounted in the root layout so any entry
// page (landing, assessment, deep link) persists campaign tags the moment it
// loads — keeping attribution alive across the homepage → /assessment hop, where
// the "Start" links drop the query string. Renders nothing. See lib/analytics/utm.
import { useEffect } from 'react';
import { captureUtm } from '@/lib/analytics/utm';

export function UtmCapture() {
  useEffect(() => {
    captureUtm();
  }, []);
  return null;
}
