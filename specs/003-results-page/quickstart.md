# Quickstart: Results Page

## Prerequisites

- Node.js 20+
- Feature branch `003-results-page` checked out
- Dependencies installed (`cd worship-wheel && npm install`)

## Dev Server

```bash
cd worship-wheel
npx next dev -p 3001
```

## Testing the Results Page

Since the results page reads from sessionStorage, you need to complete the assessment flow first:

1. Open `http://localhost:3001/assessment`
2. Answer all 24 questions
3. Submit the email gate
4. The loading interstitial appears, then redirects to `/results`

### Quick Test with Mock Data

To test the results page directly without completing the assessment, open browser DevTools console on any page and run:

```javascript
sessionStorage.setItem('worshipWheelResult', JSON.stringify({
  sessionId: 'test-123',
  firstName: 'Test',
  elementScores: [
    { elementCode: 'FB', elementName: 'Fretboard', score: 5, band: { key: 'functional', label: 'Functional', description: 'Can use in worship with effort' } },
    { elementCode: 'HM', elementName: 'Harmony', score: 7, band: { key: 'fluent', label: 'Fluent', description: 'Smooth, minimal thought' } },
    { elementCode: 'ML', elementName: 'Melody', score: 3, band: { key: 'foundation', label: 'Foundation', description: 'Early stages, some basics' } },
    { elementCode: 'RH', elementName: 'Rhythm', score: 5, band: { key: 'functional', label: 'Functional', description: 'Can use in worship with effort' } },
    { elementCode: 'TO', elementName: 'Tone', score: 2, band: { key: 'formula', label: 'Formula', description: 'Just becoming aware' } },
    { elementCode: 'TH', elementName: 'Theory', score: 5, band: { key: 'functional', label: 'Functional', description: 'Can use in worship with effort' } },
    { elementCode: 'TE', elementName: 'Technique', score: 5, band: { key: 'functional', label: 'Functional', description: 'Can use in worship with effort' } },
    { elementCode: 'AU', elementName: 'Aural', score: 3, band: { key: 'foundation', label: 'Foundation', description: 'Early stages, some basics' } },
  ],
  overallScore: 35,
  overallPercentage: 43.75,
  balance: { value: 7.2, sd: 1.56 },
  archetype: { key: 'uneven_intermediate', name: 'The Uneven Intermediate', message: 'The gaps between strong and weak areas are holding you back. Focused work on weakest areas transforms fastest.' },
  cta: { label: '90-Day Breakthrough Intensive', description: '90-Day Breakthrough Intensive', minScore: 26, maxScore: 40 },
  weakestElements: ['TO', 'ML', 'AU'],
  strongestElements: ['HM'],
}));
window.location.href = '/results';
```

This mock data matches the sample scores shown in the Figma design.

## Key Files

| File | Purpose |
|---|---|
| `src/app/results/page.tsx` | Results page (reads sessionStorage, composes components) |
| `src/components/results/RadarChart.tsx` | Chart.js radar chart |
| `src/components/results/ScoreSummary.tsx` | 3 stat cards |
| `src/components/results/ElementBreakdown.tsx` | 8 element score bars |
| `src/components/results/ArchetypeCard.tsx` | Profile archetype + video placeholder |
| `src/components/results/CtaBanner.tsx` | Dynamic CTA based on score |
| `src/components/results/ShareSection.tsx` | Copy link + share buttons |
| `src/app/assessment/page.tsx` | Updated: stores results + redirects |

## Run Tests

```bash
cd worship-wheel
npx vitest run
```

## Build

```bash
cd worship-wheel
npx next build
```
