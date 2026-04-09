import { NextResponse } from 'next/server';
import { z } from 'zod';
import { questions } from '@/data/questions';
import { scoreScenario, scoreChecklist, scoreExperience, scoreElement, scoreOverall, scorePercentage, scoreBalance } from '@/lib/scoring/calculator';
import { matchArchetype } from '@/lib/scoring/archetypes';
import { getScoreBand, getCtaBand } from '@/lib/scoring/bands';
import { ELEMENT_CODES, ELEMENT_NAMES } from '@/types';
import type { ElementCode, ElementScore } from '@/types';

// ── Zod validation ────────────────────────────────────────────

const singleSelectAnswerSchema = z.object({
  questionType: z.enum(['scenario', 'experience']).optional(),
  selectedOption: z.string().optional(),
});

const checklistAnswerSchema = z.object({
  questionType: z.literal('checklist').optional(),
  checkedItems: z.array(z.number()).optional(),
});

const submitSchema = z.object({
  firstName: z.string().min(1),
  email: z.string().email(),
  answers: z.record(
    z.string(),
    z.union([z.string(), z.array(z.number())]),
  ),
});

// ── Scoring logic ─────────────────────────────────────────────

function computeResults(answers: Record<string, string | number[]>) {
  const elementScores: ElementScore[] = [];
  const scoreMap: Record<string, number> = {};

  for (const code of ELEMENT_CODES) {
    const elementQuestions = questions.filter((q) => q.elementCode === code);
    const questionScores: number[] = [];

    for (const q of elementQuestions) {
      const answerKey = String(q.position - 1); // answers are keyed by 0-based index
      const answer = answers[answerKey];

      let points: number;

      switch (q.type) {
        case 'scenario':
          points = answer ? scoreScenario(answer as string, q.options) : 1;
          break;
        case 'checklist':
          points = scoreChecklist((answer as number[]) ?? [], q.items);
          break;
        case 'experience':
          points = answer ? scoreExperience(answer as string, q.options) : 1;
          break;
      }

      questionScores.push(points);
    }

    const elScore = scoreElement(questionScores[0], questionScores[1], questionScores[2]);
    const band = getScoreBand(elScore);

    elementScores.push({
      elementCode: code,
      elementName: ELEMENT_NAMES[code],
      score: elScore,
      band,
    });

    scoreMap[code] = elScore;
  }

  const scores = elementScores.map((e) => e.score);
  const overall = scoreOverall(scores);
  const percentage = scorePercentage(overall);
  const balance = scoreBalance(scores);

  const archetype = matchArchetype(
    Object.fromEntries(
      elementScores.map((e) => [e.elementCode, e.score]),
    ) as Record<ElementCode, number>,
  );

  const cta = getCtaBand(overall);

  // Find weakest and strongest elements (up to 3 each)
  const sorted = [...elementScores].sort((a, b) => a.score - b.score);
  const weakestScore = sorted[0].score;
  const strongestScore = sorted[sorted.length - 1].score;
  const weakestElements = sorted
    .filter((e) => e.score === weakestScore)
    .slice(0, 3)
    .map((e) => e.elementCode);
  const strongestElements = sorted
    .filter((e) => e.score === strongestScore)
    .slice(-3)
    .map((e) => e.elementCode);

  return {
    elementScores,
    overallScore: overall,
    overallPercentage: Math.round(percentage * 100) / 100,
    balance: {
      value: Math.round(balance * 10) / 10,
      sd: Math.round(
        Math.sqrt(
          scores.reduce((sum, s) => {
            const mean = scores.reduce((a, b) => a + b, 0) / scores.length;
            return sum + (s - mean) ** 2;
          }, 0) / (scores.length - 1),
        ) * 100,
      ) / 100,
    },
    archetype,
    cta,
    weakestElements,
    strongestElements,
  };
}

// ── Route handler ─────────────────────────────────────────────

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = submitSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid submission', details: parsed.error.flatten() },
        { status: 400 },
      );
    }

    const { firstName, email, answers } = parsed.data;

    // Verify we have 24 answers
    const answerCount = Object.keys(answers).length;
    if (answerCount !== 24) {
      return NextResponse.json(
        { error: `Expected 24 answers, received ${answerCount}` },
        { status: 400 },
      );
    }

    // Compute scores
    const results = computeResults(answers);

    // TODO: Store to Supabase (assessment_sessions table)
    // TODO: Create/update Keap contact with tags

    return NextResponse.json({
      sessionId: crypto.randomUUID(),
      firstName,
      email,
      ...results,
    });
  } catch (err) {
    console.error('Submit error:', err);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 },
    );
  }
}
