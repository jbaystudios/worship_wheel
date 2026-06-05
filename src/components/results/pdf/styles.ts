// Shared styles for the Worship Wheel results PDF (spec 006).
// Light theme by design — printed report convention, easier on ink, conventional
// document feel. Brand colours pulled from `src/tokens/design-tokens.ts` so the
// PDF stays in lockstep with the on-screen experience.
//
// Font.register runs at module scope so registration happens exactly once per
// Vercel Function instance (cold start cost amortised across warm invocations).
import path from 'node:path';
import { Font, StyleSheet } from '@react-pdf/renderer';
import { colorPrimitives } from '@/tokens/design-tokens';

const FONT_DIR = path.join(
  process.cwd(),
  'node_modules',
  '@fontsource',
  'montserrat',
  'files',
);

Font.register({
  family: 'Montserrat',
  fonts: [
    { src: path.join(FONT_DIR, 'montserrat-latin-400-normal.woff'), fontWeight: 400 },
    { src: path.join(FONT_DIR, 'montserrat-latin-500-normal.woff'), fontWeight: 500 },
    { src: path.join(FONT_DIR, 'montserrat-latin-700-normal.woff'), fontWeight: 700 },
    // Italic variants — required by the archetype reveal copy (e.g. "*right now*").
    { src: path.join(FONT_DIR, 'montserrat-latin-400-italic.woff'), fontWeight: 400, fontStyle: 'italic' },
    { src: path.join(FONT_DIR, 'montserrat-latin-700-italic.woff'), fontWeight: 700, fontStyle: 'italic' },
  ],
});

// Brand palette aliases — short, semantic names for the PDF layer so the
// component code stays readable. Dark theme (2026-05-25) — matches the
// on-screen results page aesthetic. Print ink cost is real but accepted —
// the PDF is primarily a digital artefact (save to Files, send to band, view
// on phone/laptop) and dark looks materially more premium and on-brand.
export const palette = {
  bg: colorPrimitives.neutral[950],          // near-black, matches site
  surface: colorPrimitives.neutral[900],     // slightly lighter for cards
  border: colorPrimitives.neutral[700],      // subtle border against bg
  text: colorPrimitives.neutral[50],         // near-white body text
  textMuted: colorPrimitives.neutral[400],   // visible muted/labels
  accent: colorPrimitives.accent[500],       // gold — pops on dark
  accentMuted: colorPrimitives.accent[900],  // dark-amber tinted surface for CTA bg
  warning: colorPrimitives.warning[400],     // slightly brighter for dark bg
  // Scoped grey for the radar grid + axes — one step brighter than `border`
  // so the chart skeleton reads cleanly without competing with the accent
  // user polygon. neutral/500 is the sweet spot on a near-black background.
  radarGrid: colorPrimitives.neutral[500],
} as const;

export const styles = StyleSheet.create({
  page: {
    backgroundColor: palette.bg,
    color: palette.text,
    fontFamily: 'Montserrat',
    fontSize: 11,
    paddingTop: 56,
    paddingHorizontal: 48,
    paddingBottom: 64,
  },
  // Per-page header + footer placement
  header: {
    position: 'absolute',
    top: 24,
    left: 48,
    right: 48,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    fontSize: 9,
    color: palette.textMuted,
  },
  footer: {
    position: 'absolute',
    bottom: 24,
    left: 48,
    right: 48,
    flexDirection: 'row',
    justifyContent: 'space-between',
    fontSize: 9,
    color: palette.textMuted,
  },
  // Section primitives
  h1: { fontSize: 28, fontWeight: 700, marginBottom: 8 },
  h2: { fontSize: 18, fontWeight: 700, marginBottom: 12, marginTop: 16 },
  h3: { fontSize: 13, fontWeight: 700, marginBottom: 6 },
  body: { fontSize: 11, fontWeight: 400, lineHeight: 1.5, marginBottom: 8 },
  label: {
    fontSize: 9,
    fontWeight: 500,
    color: palette.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 4,
  },
  // Stat block (used in the 3-up summary row)
  statRow: { flexDirection: 'row', gap: 12, marginTop: 12, marginBottom: 16 },
  statBlock: {
    flex: 1,
    borderWidth: 1,
    borderColor: palette.border,
    borderRadius: 6,
    padding: 12,
    backgroundColor: palette.surface,
  },
  statValue: { fontSize: 22, fontWeight: 700, marginTop: 4 },
  statValueSub: { fontSize: 10, color: palette.textMuted, marginTop: 2 },
  // Element breakdown row
  elementRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: palette.border,
  },
  elementName: { flex: 2, fontWeight: 700, fontSize: 11 },
  elementBand: { flex: 1, fontSize: 9, color: palette.textMuted, textTransform: 'uppercase' },
  elementBarTrack: {
    flex: 3,
    height: 6,
    backgroundColor: palette.border,
    borderRadius: 3,
    overflow: 'hidden',
    marginHorizontal: 8,
  },
  elementBarFill: { height: 6, backgroundColor: palette.accent, borderRadius: 3 },
  elementBarFillWarn: { height: 6, backgroundColor: palette.warning, borderRadius: 3 },
  elementScore: { width: 32, textAlign: 'right', fontWeight: 700 },
  // Cover-page specific
  coverWrap: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  coverEyebrow: {
    fontSize: 10,
    fontWeight: 500,
    color: palette.accent,
    textTransform: 'uppercase',
    letterSpacing: 2,
    marginBottom: 16,
  },
  coverTitle: { fontSize: 36, fontWeight: 700, textAlign: 'center', marginBottom: 12 },
  coverName: { fontSize: 18, fontWeight: 500, color: palette.accent, marginTop: 24 },
  coverDate: { fontSize: 12, color: palette.accent, marginTop: 4 },
  // Archetype card
  archetypeCard: {
    borderWidth: 1,
    borderColor: palette.border,
    borderRadius: 8,
    padding: 16,
    backgroundColor: palette.surface,
    marginTop: 8,
  },
  ctaBox: {
    borderWidth: 1,
    borderColor: palette.accent,
    borderRadius: 8,
    padding: 16,
    backgroundColor: palette.accentMuted,
    marginTop: 16,
  },
  ctaLabel: { fontSize: 10, fontWeight: 700, color: palette.accent, textTransform: 'uppercase' },
  ctaTitle: { fontSize: 16, fontWeight: 700, marginTop: 4 },
  ctaLink: { fontSize: 11, color: palette.accent, marginTop: 8 },
});

export const RADAR = {
  size: 360,         // overall canvas (square)
  center: 180,       // cx = cy = size/2
  maxRadius: 140,    // outer ring
  ringCount: 5,      // gridline rings
  axisCount: 8,      // 8 elements
} as const;
