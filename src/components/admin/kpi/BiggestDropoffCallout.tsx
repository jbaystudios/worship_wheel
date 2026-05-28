// Biggest-drop-off callout for the funnel overview (spec 007, US1).
// Names the question with the worst step-over-step completion rate and
// deep-links to that question's detail view via <DrilldownLink>.
import { DrilldownLink } from '@/components/admin/drilldown/DrilldownLink';
import type { QuestionDropoffRow } from '@/types/admin';

interface BiggestDropoffCalloutProps {
  questions: QuestionDropoffRow[];
}

function pickWorst(rows: QuestionDropoffRow[]): QuestionDropoffRow | null {
  if (rows.length === 0) return null;
  // Prefer sticking-points; else highest dropoffRate.
  const stickers = rows.filter((r) => r.stickingPoint);
  const pool = stickers.length > 0 ? stickers : rows;
  return pool.reduce((worst, cur) =>
    cur.dropoffRate > worst.dropoffRate ? cur : worst,
  );
}

function pct(value: number): string {
  return `${(value * 100).toFixed(1)}%`;
}

export function BiggestDropoffCallout({ questions }: BiggestDropoffCalloutProps) {
  const worst = pickWorst(questions);
  if (!worst) return null;
  return (
    <div className="flex flex-col gap-space-2 rounded-md border border-theme-border bg-theme-bg-2 p-space-5 md:flex-row md:items-center md:justify-between">
      <div className="flex flex-col gap-space-1">
        <span className="text-text-sm font-medium uppercase tracking-[0.15em] text-theme-text-muted">
          Biggest drop-off
        </span>
        <p className="text-text-base font-bold text-theme-text">
          Question {worst.position}
          {worst.stickingPoint && (
            <span className="ml-space-2 rounded-sm bg-warning-500/15 px-space-2 py-[2px] text-[0.625rem] font-bold uppercase tracking-wider text-warning-400">
              Sticking point
            </span>
          )}
        </p>
        <p className="text-text-sm text-theme-text-muted">
          {pct(worst.dropoffRate)} of sessions abandon at this step (
          {worst.dropoffToNext.toLocaleString()} of {worst.reached.toLocaleString()})
        </p>
      </div>
      <DrilldownLink
        href={`/admin/funnel/questions/${worst.questionId}`}
        className="shrink-0 cursor-pointer rounded-sm border border-theme-border px-space-3 py-space-2 text-text-sm font-medium text-theme-text-muted transition-colors hover:text-theme-text"
      >
        Inspect this question →
      </DrilldownLink>
    </div>
  );
}
