// Server-loaded results page, addressable by id. This is the canonical,
// shareable results URL — the assessment redirects here post-submit and Keap
// follow-up emails link here, so users can return to their results from any
// session or device (sessionStorage isn't available there).
//
// Reads from Supabase via the service-role client (loadResultView). Anyone
// with the id can view the result — same access model as the PDF route and
// the intended share-link behaviour.
import { loadResultView } from '@/lib/results/data';
import { ResultsView } from '@/components/results/ResultsView';
import { ResultsEmptyState } from '@/components/results/ResultsEmptyState';

export const dynamic = 'force-dynamic';

const UUID_V4 = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export default async function ResultByIdPage({
  params,
}: {
  params: { resultId: string };
}) {
  if (!UUID_V4.test(params.resultId)) {
    return <ResultsEmptyState />;
  }

  const result = await loadResultView(params.resultId);
  if (!result) {
    return <ResultsEmptyState />;
  }

  return <ResultsView result={result} />;
}
