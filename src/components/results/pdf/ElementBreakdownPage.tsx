// Element breakdown page (page 3) — per-element scores with band labels.
// Lives on its own page so the 8 rows have room to breathe without competing
// with the radar / stats / profile content on page 2.
import { Page, View, Text } from '@react-pdf/renderer';
import { ELEMENT_CODES, ELEMENT_NAMES } from '@/types';
import { getScoreBand } from '@/lib/scoring/bands';
import { styles } from './styles';
import type { PdfData } from '@/lib/pdf/data';

interface Props {
  data: PdfData;
}

export function ElementBreakdownPage({ data }: Props) {
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
        <Text style={styles.label}>Detail</Text>
        <Text style={styles.h1}>Element breakdown</Text>
        <Text style={styles.body}>
          Your score on each of the 8 musical dimensions, with the proficiency band you've reached.
        </Text>

        <View style={{ marginTop: 12 }}>
          {ELEMENT_CODES.map((code) => {
            const score = data.elementScores[code];
            const band = getScoreBand(score);
            const fillPct = (score / 10) * 100;
            const fillStyle = score >= 5 ? styles.elementBarFill : styles.elementBarFillWarn;
            return (
              <View key={code} style={styles.elementRow} wrap={false}>
                <Text style={styles.elementName}>{ELEMENT_NAMES[code]}</Text>
                <Text style={styles.elementBand}>{band.label}</Text>
                <View style={styles.elementBarTrack}>
                  <View style={[fillStyle, { width: `${fillPct}%` }]} />
                </View>
                <Text style={styles.elementScore}>{score}</Text>
              </View>
            );
          })}
        </View>
      </View>
    </Page>
  );
}
