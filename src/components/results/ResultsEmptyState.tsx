import Image from 'next/image';
import Link from 'next/link';

/** Shown when no result is available — empty sessionStorage on /results, or an
 *  unknown/expired id on /results/[resultId]. */
export function ResultsEmptyState() {
  return (
    <main className="flex min-h-screen flex-col">
      <nav className="flex items-center justify-center px-space-8 py-space-1 bg-neutral-0">
        <Image src="/logo.svg" alt="Worship Guitar Skills" width={62} height={62} priority />
      </nav>
      <section className="relative flex flex-1 flex-col items-center justify-center px-site-margin py-section-md max-md:py-space-6">
        <div className="absolute inset-0 z-0">
          <Image src="/hero-bg.webp" alt="" fill className="object-cover" />
          <div className="absolute inset-0 bg-neutral-950/70" />
        </div>
        <div className="relative z-10 flex max-w-[600px] flex-col items-center gap-space-5 text-center">
          <h1 className="text-h3 max-md:text-h4 font-bold text-theme-text">
            No results found
          </h1>
          <p className="text-text-base text-theme-text-muted">
            It looks like you haven&apos;t taken the assessment yet, or your results have expired. Take the assessment to see your Worship Wheel.
          </p>
          <Link
            href="/assessment"
            className="inline-flex items-center justify-center rounded-sm bg-btn-primary px-space-5 py-[12px] text-text-base font-bold text-btn-primary-text hover:bg-btn-primary-hover hover:text-btn-primary-hover-text transition-colors cursor-pointer"
          >
            Take the Assessment →
          </Link>
        </div>
      </section>
    </main>
  );
}
