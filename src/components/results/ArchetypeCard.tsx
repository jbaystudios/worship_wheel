import { renderInlineMarkdown } from '@/components/results/inline-markdown';

interface ArchetypeCardProps {
  archetypeName: string;
  /** The archetype "reveal" — Charl's diagnosis copy, one entry per paragraph.
   *  Supports inline **bold** / *italic* markdown. */
  reveal: string[];
  /** When false (MVP default), the "Watch: Your personalised results explained"
   *  video placeholder is omitted. Controlled by FEATURES.showVsl in src/lib/features.ts. */
  showVsl?: boolean;
}

export function ArchetypeCard({
  archetypeName,
  reveal,
  showVsl = true,
}: ArchetypeCardProps) {
  return (
    <section
      className="flex w-full flex-col items-center gap-space-4 rounded-md p-space-7 max-md:p-space-5 text-center"
      style={{
        background:
          'radial-gradient(circle at top, rgba(66, 57, 35, 1) 0%, rgba(38, 34, 22, 1) 45%, rgba(16, 15, 14, 1) 100%)',
      }}
    >
      <span className="text-text-sm font-medium uppercase tracking-[0.2em] text-accent-400">
        Your Profile
      </span>
      <h2 className="text-h3 max-md:text-h4 font-bold text-theme-text">
        {archetypeName}
      </h2>
      {reveal.map((paragraph, i) => (
        <p
          key={i}
          className="max-w-[700px] text-text-lg max-md:text-text-base text-theme-text-muted"
        >
          {renderInlineMarkdown(paragraph)}
        </p>
      ))}
      {showVsl && (
        <>
          {/* Video placeholder */}
          <div className="mt-space-3 flex aspect-video w-full max-w-[1024px] flex-col items-center justify-center rounded-sm border border-neutral-700 bg-neutral-900">
            <div className="flex h-[64px] w-[64px] items-center justify-center rounded-full bg-accent-500/20 border border-accent-500">
              <svg
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M8 5V19L19 12L8 5Z"
                  fill="currentColor"
                  className="text-accent-500"
                />
              </svg>
            </div>
          </div>
          <p className="text-text-sm text-theme-text-muted">
            Watch: Your personalised results explained
          </p>
        </>
      )}
    </section>
  );
}
