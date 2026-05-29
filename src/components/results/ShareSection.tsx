'use client';

import { useState } from 'react';

interface ShareSectionProps {
  /** The result id, used to build the canonical shareable URL. */
  resultId: string;
}

export function ShareSection({ resultId }: ShareSectionProps) {
  const [copied, setCopied] = useState(false);

  async function copyToClipboard() {
    // Always copy the canonical by-id URL (…/results/<id>) so the link works in
    // any session/device — not window.location.href, which on the bare
    // /results fallback carries no id.
    const url = `${window.location.origin}/results/${resultId}`;
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard access denied — silently ignore
    }
  }

  return (
    <section className="flex w-full flex-col items-center gap-space-4 px-site-margin py-section-sm max-md:py-space-6">
      {/* Divider */}
      <div className="h-[1.5px] w-full max-w-[1344px] bg-theme-border" />

      {/* Descriptive text */}
      <p className="text-text-sm font-medium text-theme-text-muted text-center">
        Share your Worship Wheel with your band or worship team
      </p>

      {/* Button */}
      <div className="flex gap-space-3 max-md:flex-col max-md:w-full max-md:max-w-[280px]">
        <button
          type="button"
          onClick={copyToClipboard}
          className="inline-flex items-center justify-center rounded-sm border border-theme-text bg-transparent px-space-5 py-[10px] text-text-base font-bold text-theme-text hover:bg-theme-text hover:text-neutral-950 transition-colors cursor-pointer min-w-[137px]"
        >
          {copied ? 'Copied!' : 'Copy Link'}
        </button>
      </div>
    </section>
  );
}
