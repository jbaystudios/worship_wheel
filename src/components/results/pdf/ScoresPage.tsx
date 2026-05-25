// Scores page (page 2) — radar chart + 2 summary stats + profile block.
//
// Layout rationale (2026-05-25): the profile interpretation sits directly
// under the visualisation that prompted it, so the page tells one coherent
// story — chart → headline numbers → who you are. The third "Profile" stat
// card was dropped because it duplicated the dedicated profile block below.
// Per-element breakdown lives on its own page (ElementBreakdownPage).
import { Page, View, Text } from '@react-pdf/renderer';
import { RadarSvg } from './RadarSvg';
import { styles } from './styles';
import type { PdfData } from '@/lib/pdf/data';

interface Props {
  data: PdfData;
}

export function ScoresPage({ data }: Props) {
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
        <Text style={styles.label}>Your Worship Wheel</Text>
        <Text style={styles.h1}>{data.firstName}'s assessment</Text>

        <View style={{ alignItems: 'center', marginVertical: 12 }} wrap={false}>
          <RadarSvg scores={data.elementScores} />
        </View>

        <View style={styles.statRow}>
          <View style={styles.statBlock} wrap={false}>
            <Text style={styles.label}>Overall Score</Text>
            <Text style={styles.statValue}>
              {data.overall.score}<Text style={styles.statValueSub}> / {data.overall.outOf}</Text>
            </Text>
            <Text style={styles.statValueSub}>{data.overall.percentage}%</Text>
          </View>
          <View style={styles.statBlock} wrap={false}>
            <Text style={styles.label}>Balance</Text>
            <Text style={styles.statValue}>{data.balance.toFixed(1)}</Text>
            <Text style={styles.statValueSub}>out of 10</Text>
          </View>
        </View>

        <View wrap={false}>
          <Text style={styles.label}>Your Profile</Text>
          <Text style={styles.h2}>{data.archetype.displayName}</Text>
          <View style={styles.archetypeCard}>
            <Text style={styles.body}>{data.archetype.message}</Text>
          </View>
        </View>
      </View>
    </Page>
  );
}
