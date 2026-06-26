import { NextResponse } from 'next/server';
import { waitUntil } from '@vercel/functions';
import { z } from 'zod';
import { questions } from '@/data/questions';
import { scoreScenario, scoreChecklist, scoreExperience, scoreElement, scoreOverall, scorePercentage, scoreBalance } from '@/lib/scoring/calculator';
import { matchArchetype, archetypeShortName } from '@/lib/scoring/archetypes';
import { getScoreBand, getCtaBand } from '@/lib/scoring/bands';
import { ELEMENT_CODES, ELEMENT_NAMES } from '@/types';
import type { ElementCode, ElementScore } from '@/types';
import { createPublicClient } from '@/lib/supabase/public';
import { syncSessionToKeap } from '@/lib/keap/sync';
import { resolveRequestBaseUrl } from '@/lib/base-url';
import { prCodesSchema } from '@/lib/products/schema';
import { normalizeCodes } from '@/lib/products/code';

// ── Zod validation ────────────────────────────────────────────

const singleSelectAnswerSchema = z.object({
  questionType: z.enum(['scenario', 'experience']).optional(),
  selectedOption: z.string().optional(),
});

const checklistAnswerSchema = z.object({
  questionType: z.literal('checklist').optional(),
  checkedItems: z.array(z.number()).optional(),
});

const utmParamsSchema = z.object({
  source: z.string().max(255).nullish(),
  medium: z.string().max(255).nullish(),
  campaign: z.string().max(255).nullish(),
  term: z.string().max(255).nullish(),
  content: z.string().max(255).nullish(),
});

const submitSchema = z.object({
  firstName: z.string().min(1).max(100),
  email: z.string().email(),
  answers: z.record(
    z.string(),
    z.union([z.string(), z.array(z.number())]),
  ),
  // spec 005: link the completion to its anonymous funnel session + acquisition.
  anonSessionId: z.string().uuid().optional(),
  completionTimeSeconds: z.number().int().positive().max(86_400).optional(),
  utmParams: utmParamsSchema.optional(),
  // spec 009: campaign product codes captured at entry (?pr=). Ordered, capped.
  prCodes: prCodesSchema.optional(),
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

    const { firstName, email, answers, anonSessionId, completionTimeSeconds, utmParams, prCodes } =
      parsed.data;

    // Defence in depth: re-normalize (lowercase/dedupe/cap) even though the
    // client already does. Empty → null so the column stays absent (no card).
    const productCodes = prCodes?.length ? normalizeCodes(prCodes).codes : [];

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

    // Persist the completed assessment (spec 005 T029 — closes the spec-001
    // persistence gap). The id is generated here so we never need to read the
    // row back (the anon role has no SELECT on assessment_sessions).
    const resultId = crypto.randomUUID();
    const normalizedEmail = email.trim().toLowerCase();
    const elementScoreMap = Object.fromEntries(
      results.elementScores.map((e) => [e.elementCode, e.score]),
    );

    try {
      const supabase = createPublicClient();
      const { error: insertError } = await supabase
        .from('assessment_sessions')
        .insert({
          id: resultId,
          first_name: firstName,
          email: normalizedEmail,
          answers,
          element_scores: elementScoreMap,
          overall_score: results.overallScore,
          overall_percentage: results.overallPercentage,
          balance_score: results.balance.value,
          profile_archetype: results.archetype.key,
          weakest_elements: results.weakestElements,
          strongest_elements: results.strongestElements,
          completion_time_seconds: completionTimeSeconds ?? null,
          utm_source: utmParams?.source ?? null,
          utm_medium: utmParams?.medium ?? null,
          utm_campaign: utmParams?.campaign ?? null,
          utm_term: utmParams?.term ?? null,
          utm_content: utmParams?.content ?? null,
          anon_session_id: anonSessionId ?? null,
          product_codes: productCodes.length ? productCodes : null,
          // keap_sync_status defaults to 'pending' here; the Keap sync below
          // updates it to 'synced' or 'failed' out-of-band.
        });
      if (insertError) {
        console.error('assessment_sessions insert failed:', insertError.message);
      } else {
        // Background Keap push (D-3). The user response must not block on Keap
        // latency, but a bare fire-and-forget is unreliable on Vercel: once the
        // response is sent the function instance can be frozen before the async
        // Keap calls finish, leaving keap_sync_status stuck at 'pending'.
        // waitUntil keeps the instance alive until the sync (and its status
        // writeback) settles, without delaying the response.
        // Never push a localhost link to Keap from a prod request — see
        // resolveRequestBaseUrl. NEXT_PUBLIC_BASE_URL is the canonical source,
        // but a leaked localhost value falls back to the real request origin.
        const baseUrl = resolveRequestBaseUrl(request.url);
        waitUntil(
          syncSessionToKeap({
            resultId,
            firstName,
            email: normalizedEmail,
            overallScore: results.overallScore,
            overallPercentage: results.overallPercentage,
            archetypeKey: results.archetype.key,
            archetypeName: archetypeShortName(results.archetype.name),
            resultsUrl: `${baseUrl}/results/${resultId}`,
          }),
        );
      }
    } catch (err) {
      // Non-fatal: the user still receives results (graceful degradation).
      console.error('Supabase persistence error:', err);
    }

    return NextResponse.json({
      resultId,
      resultUrl: `/results/${resultId}`,
      sessionId: resultId, // back-compat with existing result consumers
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
