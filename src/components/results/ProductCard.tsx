'use client';

// Product CTA Card (spec 009) — a campaign-driven offer rendered below the
// archetype section on results. All copy is product-owned (admin-authored);
// tokens like {overallScore} are interpolated per viewer. The video uses a
// click-to-load Vimeo facade so no third-party JS loads until the user plays
// (research R7). Engagement tracking is wired in US5.
import { useEffect, useRef, useState } from 'react';
import { renderCopy } from '@/lib/products/tokens';
import { trackProductCtaShown, trackProductCtaClicked } from '@/lib/events/tracker';
import type { Product, ProductCopyTokens } from '@/lib/products/types';

interface ProductCardProps {
  product: Product;
  tokens: ProductCopyTokens;
  /** Admin preview leaves unknown {tokens} visible to help authors spot typos. */
  preview?: boolean;
}

/** Extract a Vimeo numeric id from any common Vimeo URL form. */
function vimeoId(url: string | null): string | null {
  if (!url) return null;
  const m = url.match(/(?:vimeo\.com\/(?:video\/)?|player\.vimeo\.com\/video\/)(\d+)/);
  return m ? m[1] : null;
}

export function ProductCard({ product, tokens, preview = false }: ProductCardProps) {
  const [playing, setPlaying] = useState(false);
  const shownRef = useRef(false);

  // Fire the impression once (guard against React strict-mode double-mount).
  useEffect(() => {
    if (preview || shownRef.current) return;
    shownRef.current = true;
    trackProductCtaShown(product.code);
  }, [preview, product.code]);

  const opts = { keepUnknown: preview };
  const headline = renderCopy(product.headline, tokens, opts);
  const subHeadline = product.subHeadline
    ? renderCopy(product.subHeadline, tokens, opts)
    : null;
  const ctaHeadline = renderCopy(product.ctaHeadline, tokens, opts);
  const ctaCopy = renderCopy(product.ctaCopy, tokens, opts);

  const vid = vimeoId(product.videoUrl);

  return (
    <section className="flex w-full justify-center px-site-margin py-section-md max-md:py-space-8">
      <div className="flex w-full max-w-[1344px] flex-col items-center gap-space-6 max-md:gap-space-5">
        {/* Headline + sub-headline */}
        <div className="flex flex-col items-center gap-space-3 text-center">
          <h2 className="text-h2 max-md:text-h3 font-bold text-theme-text">{headline}</h2>
          {subHeadline && (
            <p className="max-w-[700px] text-text-lg max-md:text-text-base text-theme-text-muted">
              {subHeadline}
            </p>
          )}
        </div>

        {/* Video — click-to-load Vimeo facade */}
        {vid && (
          <div className="aspect-video w-full max-w-[1024px] overflow-hidden rounded-sm border border-accent-500/40 bg-neutral-900">
            {playing ? (
              <iframe
                src={`https://player.vimeo.com/video/${vid}?autoplay=1&dnt=1`}
                title={headline}
                className="h-full w-full"
                allow="autoplay; fullscreen; picture-in-picture"
                allowFullScreen
              />
            ) : (
              <button
                type="button"
                onClick={() => setPlaying(true)}
                aria-label="Play video"
                className="group flex h-full w-full cursor-pointer items-center justify-center bg-neutral-950/40 transition-colors hover:bg-neutral-950/20"
              >
                <span className="flex h-[64px] w-[64px] items-center justify-center rounded-full border border-accent-500 bg-accent-500/20 transition-transform motion-safe:group-hover:scale-110">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                    <path d="M8 5V19L19 12L8 5Z" fill="currentColor" className="text-accent-500" />
                  </svg>
                </span>
              </button>
            )}
          </div>
        )}

        {/* Offer box */}
        <div
          className="flex w-full flex-col items-center gap-space-4 rounded-md border border-accent-700/60 p-space-8 max-md:p-space-5 text-center"
          style={{
            background:
              'radial-gradient(circle at top, rgba(66, 57, 35, 1) 0%, rgba(38, 34, 22, 1) 45%, rgba(16, 15, 14, 1) 100%)',
          }}
        >
          <span className="text-text-sm font-medium uppercase tracking-[0.2em] text-accent-400">
            {product.eyebrow}
          </span>
          <h3 className="text-h3 max-md:text-h4 font-bold text-theme-text">{ctaHeadline}</h3>
          <p className="max-w-[600px] text-text-sm text-theme-text-muted">{ctaCopy}</p>
          <a
            href={product.ctaButtonUrl}
            onClick={() => trackProductCtaClicked(product.code)}
            className="mt-space-3 inline-flex items-center justify-center rounded-sm bg-btn-primary px-space-6 py-[14px] text-text-base font-bold text-btn-primary-text transition-colors hover:bg-btn-primary-hover hover:text-btn-primary-hover-text cursor-pointer"
          >
            {product.ctaButtonLabel}
          </a>
        </div>
      </div>
    </section>
  );
}
