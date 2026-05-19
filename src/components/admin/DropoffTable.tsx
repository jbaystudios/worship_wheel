// Per-question drop-off table (spec 005, US2 / task T034). Sticking-point
// questions (high abandonment + high dwell) are visually flagged.
import type { QuestionDropoffRow } from '@/types/admin';

function pct(value: number): string {
  return `${(value * 100).toFixed(1)}%`;
}

export function DropoffTable({ questions }: { questions: QuestionDropoffRow[] }) {
  const maxReached = Math.max(1, ...questions.map((q) => q.reached));

  return (
    <div className="overflow-x-auto rounded-md border border-theme-border bg-theme-bg-2">
      <table className="w-full border-collapse text-left text-text-sm">
        <thead>
          <tr className="border-b border-theme-border text-theme-text-muted">
            <th className="px-space-4 py-space-3 font-medium">Question</th>
            <th className="px-space-4 py-space-3 font-medium">Reached</th>
            <th className="px-space-4 py-space-3 font-medium">Drop-off to next</th>
            <th className="px-space-4 py-space-3 font-medium">Median time</th>
            <th className="px-space-4 py-space-3 font-medium" />
          </tr>
        </thead>
        <tbody>
          {questions.map((q) => (
            <tr
              key={q.position}
              className={`border-b border-theme-border/40 last:border-0 ${
                q.stickingPoint ? 'bg-warning-500/[0.06]' : ''
              }`}
            >
              <td className="whitespace-nowrap px-space-4 py-space-3 text-theme-text">
                <span className="text-theme-text-muted">Q{q.position}</span>{' '}
                <span className="font-mono text-text-sm text-theme-text-muted/70">
                  {q.questionId}
                </span>
              </td>
              <td className="px-space-4 py-space-3">
                <div className="flex items-center gap-space-2">
                  <div className="h-2 w-24 shrink-0 overflow-hidden rounded-full bg-theme-text/[0.08]">
                    <div
                      className="h-full rounded-full bg-accent-500"
                      style={{ width: `${(q.reached / maxReached) * 100}%` }}
                    />
                  </div>
                  <span className="tabular-nums text-theme-text">{q.reached}</span>
                  <span className="tabular-nums text-theme-text-muted/70">
                    ({pct(q.reachedRate)})
                  </span>
                </div>
              </td>
              <td className="whitespace-nowrap px-space-4 py-space-3 tabular-nums text-theme-text">
                {q.dropoffToNext}{' '}
                <span className="text-theme-text-muted/70">({pct(q.dropoffRate)})</span>
              </td>
              <td className="whitespace-nowrap px-space-4 py-space-3 tabular-nums text-theme-text">
                {q.medianTimeSeconds}s
              </td>
              <td className="px-space-4 py-space-3">
                {q.stickingPoint && (
                  <span className="whitespace-nowrap rounded-sm bg-warning-500/15 px-space-2 py-[2px] text-[0.6875rem] font-bold uppercase tracking-wider text-warning-400">
                    Sticking point
                  </span>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
