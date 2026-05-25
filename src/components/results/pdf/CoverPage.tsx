// Cover page (page 1) of the PDF — logo, eyebrow, title, user name + date.
import { Page, View, Text } from '@react-pdf/renderer';
import { LogoSvg } from './LogoSvg';
import { styles } from './styles';

interface Props {
  firstName: string;
  completedAtFormatted: string;
}

export function CoverPage({ firstName, completedAtFormatted }: Props) {
  return (
    <Page size="A4" style={styles.page}>
      <View style={styles.coverWrap}>
        <View style={{ marginBottom: 20 }}>
          <LogoSvg size={64} />
        </View>
        <Text style={styles.coverEyebrow}>Worship Guitar Skills</Text>
        <Text style={styles.coverTitle}>Worship Wheel{'\n'}Assessment Report</Text>
        <Text style={styles.coverName}>{firstName}</Text>
        <Text style={styles.coverDate}>{completedAtFormatted}</Text>
      </View>
    </Page>
  );
}
