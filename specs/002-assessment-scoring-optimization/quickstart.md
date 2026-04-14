# Quickstart: Assessment Scoring Optimization

**Feature Branch**: `002-assessment-scoring-optimization`
**Prerequisite**: `001-worship-wheel-assessment` scaffold must be in place

## What's Changing

This feature modifies the existing Worship Wheel assessment — no new infrastructure setup required. All changes are within the `worship-wheel/` project.

### Files to Modify

| File | Change Type | Description |
|------|-------------|-------------|
| `src/data/placeholder-questions.ts` | **Rewrite** → `questions.ts` | 16 placeholder → 24 final questions, 3 types |
| `src/data/recommendations.json` | **Modify** | Updated band names, archetype messages, CTA ranges |
| `src/types/index.ts` | **Modify** | Add checklist question/answer types |
| `src/components/assessment/ChecklistCard.tsx` | **New** | Multi-select checklist component |
| `src/components/assessment/QuestionCard.tsx` | **Modify** | Support 5 options (A–E) |
| `src/components/assessment/AnswerOption.tsx` | **Modify** | 5-option layout |
| `src/components/assessment/ProgressBar.tsx` | **Modify** | 3 questions per segment, 24 total |
| `src/app/assessment/page.tsx` | **Modify** | 24-question flow, 3 types per element |
| `src/lib/scoring/calculator.ts` | **Rewrite** | New scoring algorithm |
| `src/lib/scoring/archetypes.ts` | **Rewrite** | 6 archetypes with specific criteria |
| `src/lib/scoring/bands.ts` | **Modify** | Updated band names + CTA ranges |
| `src/app/api/submit/route.ts` | **Modify** | Validate 24 answers, checklist format |

### No Infrastructure Changes

- Supabase schema: No migration needed (JSONB is flexible)
- Vercel config: No changes
- Environment variables: No changes
- Dependencies: No new packages

## Development Workflow

1. **Branch**: `git checkout 002-assessment-scoring-optimization`
2. **Design first**: Create checklist component in Figma (Constitution requirement)
3. **Data layer**: Write question data + types
4. **Scoring**: Implement and test scoring algorithm
5. **UI**: Build checklist component, update existing components
6. **Integration**: Update API route + validation
7. **Test**: Unit tests for scoring, E2E for full flow

## Running Tests

```bash
cd worship-wheel

# Unit tests (scoring, archetypes)
npx vitest run src/lib/scoring/

# E2E tests
npx playwright test
```

## Key Reference

- **Source document**: `docs/Worship Wheel Assessment - Questions & Scoring Algorithm.docx`
- **Spec**: `specs/002-assessment-scoring-optimization/spec.md`
- **Data model**: `specs/002-assessment-scoring-optimization/data-model.md`
- **API contracts**: `specs/002-assessment-scoring-optimization/contracts/api.md`
