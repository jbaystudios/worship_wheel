// Thin wrapper around @react-pdf/renderer's renderToStream. Returns a Node
// stream the API route pipes straight into the HTTP response. Lives as .tsx
// so the typed JSX form `<ReportDocument data={...}/>` satisfies renderToStream's
// `ReactElement<DocumentProps>` parameter without manual casts.
import { renderToStream } from '@react-pdf/renderer';
import { ReportDocument } from '@/components/results/pdf/ReportDocument';
import type { PdfData } from './data';

export async function renderReportToStream(data: PdfData) {
  return renderToStream(<ReportDocument data={data} />);
}
