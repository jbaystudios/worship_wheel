'use client';

// "Download PDF" button (spec 006, T017 + T023).
// Hits GET /api/results/[resultId]/pdf, downloads the blob via a temporary
// <a download> click, and fires the pdf_downloaded tracking event on success.
// Placement: appears twice on the results page (top + bottom of report) — see
// spec FR-001, FR-002.
import { useState } from 'react';
import { trackPdfDownloaded } from '@/lib/events/tracker';

interface Props {
  resultId: string;
  firstName: string;
  placement: 'top' | 'bottom';
  className?: string;
}

export function DownloadPdfButton({ resultId, firstName, placement, className }: Props) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleDownload() {
    if (isLoading) return;
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/results/${resultId}/pdf`);
      if (!res.ok) {
        throw new Error(`HTTP ${res.status}`);
      }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const slug = firstName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '') || 'user';
      const today = new Date().toISOString().slice(0, 10);

      const a = document.createElement('a');
      a.href = url;
      a.download = `worship-wheel-${slug}-${today}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      // Fire-and-forget — tracking failure must not affect the download UX.
      trackPdfDownloaded();
    } catch (e) {
      console.error(`PDF download failed (placement=${placement}):`, e);
      setError("Couldn't generate PDF — please try again");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className={className}>
      <button
        type="button"
        onClick={handleDownload}
        disabled={isLoading}
        className={[
          'inline-flex items-center justify-center gap-2',
          'rounded-md px-4 py-2',
          'bg-accent-600 text-white font-medium text-sm',
          'hover:bg-accent-700 transition-colors',
          'disabled:opacity-60 disabled:cursor-not-allowed',
          'cursor-pointer',
        ].join(' ')}
        aria-busy={isLoading}
      >
        {isLoading ? (
          <>
            <svg
              className="animate-spin h-4 w-4"
              viewBox="0 0 24 24"
              fill="none"
              aria-hidden="true"
            >
              <circle cx="12" cy="12" r="10" stroke="currentColor" strokeOpacity="0.25" strokeWidth="4" />
              <path
                d="M4 12a8 8 0 0 1 8-8"
                stroke="currentColor"
                strokeWidth="4"
                strokeLinecap="round"
              />
            </svg>
            Preparing PDF…
          </>
        ) : (
          <>
            <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <path
                d="M12 3v12m0 0l-4-4m4 4l4-4M5 21h14"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            Download PDF
          </>
        )}
      </button>
      {error && (
        <p role="alert" className="text-warning-500 text-sm mt-2">
          {error}
        </p>
      )}
    </div>
  );
}
