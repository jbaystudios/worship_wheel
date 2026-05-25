-- spec 006 (D-2): allow 'pdf_downloaded' on assessment_events.event_type
--
-- Extends the CHECK constraint with one additional allowed value so the PDF
-- download flow (src/components/results/DownloadPdfButton + /api/results/...
-- /pdf) can log its event alongside the existing funnel events.
--
-- Purely additive — no existing rows become invalid. Drop-and-recreate is
-- the only way to alter a CHECK constraint's allowed-value set in Postgres;
-- the table is small in pre-launch state so the implicit revalidation scan
-- completes in milliseconds.

alter table public.assessment_events
  drop constraint if exists assessment_events_event_type_check;

alter table public.assessment_events
  add constraint assessment_events_event_type_check
  check (event_type in (
    'page_view',
    'assessment_started',
    'question_viewed',
    'question_answered',
    'assessment_submitted',
    'pdf_downloaded'
  ));
