import Image from 'next/image';
import { RadarChart } from '@/components/results/RadarChart';
import { ScoreSummary } from '@/components/results/ScoreSummary';
import { ElementBreakdown } from '@/components/results/ElementBreakdown';
import { ArchetypeCard } from '@/components/results/ArchetypeCard';
import { CtaBanner } from '@/components/results/CtaBanner';
import { ShareSection } from '@/components/results/ShareSection';
import { DownloadPdfButton } from '@/components/results/DownloadPdfButton';
import { FEATURES } from '@/lib/features';
import type { StoredResult } from '@/lib/results/data';

interface ResultsViewProps {
  result: StoredResult;
}

/** Presentational results UI. Source-agnostic — renders the same whether the
 *  result came from sessionStorage (post-submit) or a Supabase by-id load
 *  (shared link / Keap follow-up email). */
export function ResultsView({ result }: ResultsViewProps) {
  return (
    <main className="flex min-h-screen flex-col bg-theme-bg">
      {/* Navbar */}
      <nav className="flex items-center justify-center px-space-8 py-space-1 bg-neutral-0">
        <Image src="/logo.svg" alt="Worship Guitar Skills" width={62} height={62} priority />
      </nav>

      {/* Hero + Radar Chart */}
      <section className="relative flex w-full flex-col items-center px-site-margin py-section-md max-md:py-space-8">
        <div className="absolute inset-0 z-0">
          <Image src="/hero-bg.webp" alt="" fill className="object-cover" />
          <div className="absolute inset-0 bg-neutral-950/70" />
        </div>
        <div className="relative z-10 flex w-full max-w-[1344px] flex-col items-center gap-space-6 max-md:gap-space-5">
          <div className="flex flex-col items-center gap-space-3 text-center">
            <h1 className="text-h2 max-md:text-h3 font-bold text-theme-text">
              Your Worship Wheel
            </h1>
            <p className="max-w-[600px] text-text-lg max-md:text-text-base text-theme-text-muted">
              Here&apos;s how your musical skills stack up across the 8 elements of worship guitar.
            </p>
            <DownloadPdfButton
              resultId={result.sessionId}
              firstName={result.firstName}
              placement="top"
              className="mt-space-2"
            />
          </div>
          <RadarChart elementScores={result.elementScores} />
        </div>
      </section>

      {/* Score Summary */}
      <section className="flex w-full justify-center px-site-margin py-space-5 max-md:py-space-4">
        <div className="w-full max-w-[1344px]">
          <ScoreSummary
            overallScore={result.overallScore}
            overallPercentage={result.overallPercentage}
            balanceValue={result.balance.value}
            archetypeName={result.archetype.name}
          />
        </div>
      </section>

      {/* Element Breakdown */}
      <section className="flex w-full justify-center px-site-margin py-section-md max-md:py-space-8">
        <div className="w-full max-w-[1344px]">
          <ElementBreakdown elementScores={result.elementScores} />
        </div>
      </section>

      {/* Archetype */}
      <section className="flex w-full justify-center px-site-margin pb-section-md max-md:pb-space-8">
        <div className="w-full max-w-[1344px]">
          <ArchetypeCard
            archetypeName={result.archetype.name}
            archetypeMessage={result.archetype.message}
            showVsl={FEATURES.showVsl}
          />
        </div>
      </section>

      {/* CTA Banner — hidden for MVP per FEATURES.showCta (D-1). */}
      {FEATURES.showCta && (
        <CtaBanner cta={result.cta} overallScore={result.overallScore} />
      )}

      {/* Download PDF (bottom placement — for users who read through) */}
      <section className="flex w-full justify-center px-site-margin py-space-5">
        <DownloadPdfButton
          resultId={result.sessionId}
          firstName={result.firstName}
          placement="bottom"
        />
      </section>

      {/* Share Section */}
      <ShareSection resultId={result.sessionId} />
    </main>
  );
}
