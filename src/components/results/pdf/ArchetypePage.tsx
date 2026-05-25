// "What's next" page — a dedicated CTA page that appears at the END of the
// report. Only rendered when FEATURES.showCta is true (gated upstream in
// ReportDocument), so for MVP this whole page is suppressed.
//
// When the CTA is re-enabled in v1.1: this page promotes the WGS offering
// that matches the user's score band. The archetype name itself is intentionally
// repeated here for narrative continuity ("Here's where YOU should focus next")
// even though the same name appears on ScoresPage as the profile block heading.
import { Page, View, Text, Link } from '@react-pdf/renderer';
import { styles } from './styles';
import type { PdfData } from '@/lib/pdf/data';

interface Props {
  data: PdfData;
}

export function ArchetypePage({ data }: Props) {
  return (
    <Page size="A4" style={styles.page}>
      <Text
        style={styles.footer}
        fixed
        render={({ pageNumber, totalPages }) =>
          `Worship Wheel Assessment   •   ${data.firstName}   •   ${pageNumber} / ${totalPages}`
        }
      />
      <View>
        <Text style={styles.label}>What's next</Text>
        <Text style={styles.h1}>Where to focus</Text>
        <Text style={styles.body}>
          Based on your profile as {data.archetype.displayName}, here's the WGS
          programme we'd recommend you take a look at.
        </Text>

        <View style={styles.ctaBox} wrap={false}>
          <Text style={styles.ctaLabel}>Recommended for you</Text>
          <Text style={styles.ctaTitle}>{data.cta.label}</Text>
          <Text style={styles.body}>{data.cta.description}</Text>
          <Link src={data.cta.url} style={styles.ctaLink}>
            {data.cta.url}
          </Link>
        </View>
      </View>
    </Page>
  );
}
