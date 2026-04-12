import type { CtaBand } from '@/types';

interface CtaBannerProps {
  cta: CtaBand;
  overallScore: number;
}

/** Get headline text for each CTA tier */
function getHeadline(cta: CtaBand): string {
  if (cta.label === 'Free Worship Wheel Training Video') return 'Start with Free Training';
  if (cta.label === '90-Day Breakthrough Intensive') return 'Start the 90-Day Challenge';
  if (cta.label === 'WGS Academy') return 'Join the WGS Academy';
  return 'Level Up with Advanced Workshops';
}

/** Get descriptive text referencing the user's score */
function getDescription(cta: CtaBand, score: number): string {
  if (cta.label === 'Free Worship Wheel Training Video') {
    return `Based on your score of ${score}/80, start with our free training video to build your worship guitar foundation.`;
  }
  if (cta.label === '90-Day Breakthrough Intensive') {
    return `Based on your score of ${score}/80, the 90-Day Breakthrough Intensive is designed to close your biggest gaps and build a more balanced worship guitar foundation.`;
  }
  if (cta.label === 'WGS Academy') {
    return `Based on your score of ${score}/80, you're ready to refine your skills inside the WGS Academy — our flagship membership for worship guitarists.`;
  }
  return `Based on your score of ${score}/80, you're ready for advanced workshops and masterclasses to take your playing to the next level.`;
}

/** Get button label for each CTA tier */
function getButtonLabel(cta: CtaBand): string {
  if (cta.label === 'Free Worship Wheel Training Video') return 'Watch Free Training';
  if (cta.label === '90-Day Breakthrough Intensive') return 'Start the Challenge';
  if (cta.label === 'WGS Academy') return 'Join the Academy';
  return 'Explore Workshops';
}

export function CtaBanner({ cta, overallScore }: CtaBannerProps) {
  return (
    <section
      className="flex w-full justify-center px-site-margin py-section-sm max-md:py-space-6"
      style={{
        background:
          'radial-gradient(circle at center, rgba(29, 28, 26, 1) 0%, rgba(22, 21, 20, 1) 70%, rgba(16, 15, 14, 1) 100%)',
      }}
    >
      <div className="flex w-full max-w-[1344px] flex-col items-center gap-space-4 rounded-md bg-accent-950 p-space-8 max-md:p-space-5 text-center">
        <span className="text-text-sm font-medium uppercase tracking-[0.2em] text-accent-400">
          Ready to Level Up?
        </span>
        <h2 className="text-h3 max-md:text-h4 font-bold text-theme-text">
          {getHeadline(cta)}
        </h2>
        <p className="max-w-[600px] text-text-sm text-theme-text-muted">
          {getDescription(cta, overallScore)}
        </p>
        <button
          type="button"
          className="mt-space-3 inline-flex items-center justify-center rounded-sm bg-btn-primary px-space-6 py-[14px] text-text-base font-bold text-btn-primary-text hover:bg-btn-primary-hover hover:text-btn-primary-hover-text transition-colors cursor-pointer"
        >
          {getButtonLabel(cta)}
        </button>
      </div>
    </section>
  );
}
