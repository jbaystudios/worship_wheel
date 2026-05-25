// Top-level PDF composition (spec 006).
//
// Page order (MVP, 2026-05-25):
//   1. Cover            — eyebrow + title + name + date
//   2. Scores           — radar chart + 2 stat blocks + profile block
//   3. Element breakdown
//   (4. Archetype / CTA — only when FEATURES.showCta is true; the page becomes
//        a dedicated "what's next" sales page. Suppressed for MVP since no
//        live offerings exist for the 4 CTA tiers.)
import { Document } from '@react-pdf/renderer';
import { CoverPage } from './CoverPage';
import { ScoresPage } from './ScoresPage';
import { ElementBreakdownPage } from './ElementBreakdownPage';
import { ArchetypePage } from './ArchetypePage';
import { FEATURES } from '@/lib/features';
import type { PdfData } from '@/lib/pdf/data';

interface Props {
  data: PdfData;
}

export function ReportDocument({ data }: Props) {
  return (
    <Document
      title={`Worship Wheel Assessment — ${data.firstName}`}
      author="Worship Guitar Skills"
      subject="Worship Wheel Assessment Report"
      creator="worshipwheel.worshipguitarskills.com"
    >
      <CoverPage firstName={data.firstName} completedAtFormatted={data.completedAtFormatted} />
      <ScoresPage data={data} />
      <ElementBreakdownPage data={data} />
      {FEATURES.showCta && <ArchetypePage data={data} />}
    </Document>
  );
}
