// Structural smoke test for the PDF render pipeline (spec 006, T007).
// Renders <ReportDocument data={fixture}/> to a Buffer and asserts:
//   1. The result is a non-empty Buffer
//   2. The bytes start with the PDF magic number `%PDF-`
//   3. All 6 named archetypes render without throwing
//
// We don't snapshot the binary content — PDFs aren't reproducible byte-for-byte
// across renders (creation date, ids). Magic-number + buffer-size is enough to
// catch the most common regressions (missing font, JSX type error, broken SVG).
import { describe, it, expect } from 'vitest';
import { renderToBuffer } from '@react-pdf/renderer';
import { ReportDocument } from '@/components/results/pdf/ReportDocument';
import { archetypeContent } from '@/data/archetype-content';
import type { PdfData } from '@/lib/pdf/data';
import type { ElementCode } from '@/types';

function fixture(archetypeKey: string): PdfData {
  const elementScores = {
    FB: 5,
    HM: 7,
    ML: 3,
    RH: 5,
    TO: 2,
    TH: 9,
    TE: 1,
    AU: 7,
  } as Record<ElementCode, number>;
  return {
    firstName: 'Test User',
    completedAt: new Date('2026-05-25T10:00:00Z'),
    completedAtFormatted: '25 May 2026',
    elementScores,
    overall: { score: 39, percentage: 48.75, outOf: 80 },
    balance: 6.4,
    archetype: {
      key: archetypeKey,
      displayName: 'The Test Archetype',
      message: 'Test archetype message used only for snapshot stability.',
      // Use the real reveal copy where it exists so the render exercises the
      // bold/italic inline-markdown path (and the italic font registration).
      reveal: archetypeContent[archetypeKey]?.reveal ?? [
        'A **bold** word and an *italic* word to exercise inline markdown.',
      ],
    },
    cta: {
      label: '90-Day Breakthrough Intensive',
      description: 'Test CTA description.',
      url: 'https://worshipguitarskills.com/test',
    },
  };
}

const NAMED_ARCHETYPES = [
  'campfire_strummer',
  'rhythm_machine',
  'theory_head',
  'almost_there_player',
  'balanced_beginner',
  'uneven_intermediate',
];

describe('ReportDocument render', () => {
  it('produces a non-empty Buffer with PDF magic number for the default fixture', async () => {
    const buf = await renderToBuffer(<ReportDocument data={fixture('balanced_beginner')} />);
    expect(buf).toBeInstanceOf(Buffer);
    expect(buf.length).toBeGreaterThan(0);
    // PDF magic: first 5 bytes are '%PDF-'
    expect(buf.slice(0, 5).toString('utf8')).toBe('%PDF-');
  }, 30_000); // generous timeout — font registration on first render can take ~1s

  it('renders all 6 named archetypes without throwing', async () => {
    for (const key of NAMED_ARCHETYPES) {
      const buf = await renderToBuffer(<ReportDocument data={fixture(key)} />);
      expect(buf.length).toBeGreaterThan(0);
    }
  }, 60_000);
});
