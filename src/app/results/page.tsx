'use client';

import { useEffect, useState } from 'react';
import { ResultsView } from '@/components/results/ResultsView';
import { ResultsEmptyState } from '@/components/results/ResultsEmptyState';
import type { StoredResult } from '@/lib/results/data';

// Post-submit landing. The assessment flow now redirects to /results/<id>
// (server-loaded, shareable). This sessionStorage path is kept as a fallback
// for any direct navigation to the bare /results URL.
export default function ResultsPage() {
  const [result, setResult] = useState<StoredResult | null>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    const raw = sessionStorage.getItem('worshipWheelResult');
    if (raw) {
      try {
        setResult(JSON.parse(raw));
      } catch {
        // Invalid JSON — treat as empty state
      }
    }
    setLoaded(true);
  }, []);

  if (!loaded) {
    return null;
  }

  if (!result) {
    return <ResultsEmptyState />;
  }

  return <ResultsView result={result} />;
}
