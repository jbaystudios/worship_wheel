'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { ProgressBar } from '@/components/assessment/ProgressBar';
import { QuestionCard } from '@/components/assessment/QuestionCard';
import { ChecklistCard } from '@/components/assessment/ChecklistCard';
import { EmailGate } from '@/components/assessment/EmailGate';
import { ResultsLoading } from '@/components/assessment/ResultsLoading';
import { questions } from '@/data/questions';
import type { Question } from '@/types';
import {
  getAnonSessionId,
  trackPageView,
  trackAssessmentStarted,
  trackQuestionViewed,
  trackQuestionAnswered,
  trackAssessmentSubmitted,
} from '@/lib/events/tracker';

/** Reads UTM params from the current URL, or undefined when none are present. */
function captureUtmParams() {
  if (typeof window === 'undefined') return undefined;
  const p = new URLSearchParams(window.location.search);
  const utm = {
    source: p.get('utm_source'),
    medium: p.get('utm_medium'),
    campaign: p.get('utm_campaign'),
    term: p.get('utm_term'),
    content: p.get('utm_content'),
  };
  return Object.values(utm).some(Boolean) ? utm : undefined;
}

const AUTO_ADVANCE_DELAY = 400;
const MIN_LOADING_MS = 2000;
const API_TIMEOUT_MS = 15000;

type Phase = 'quiz' | 'email-gate' | 'loading';

/** Answer state: single-select stores a key string, checklist stores an array of indices */
type AnswerValue = string | number[];

export default function AssessmentPage() {
  const router = useRouter();
  const [phase, setPhase] = useState<Phase>('quiz');
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<number, AnswerValue>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loadingError, setLoadingError] = useState<string | null>(null);
  const autoAdvanceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Stash email data for retry
  const emailDataRef = useRef<{ firstName: string; email: string } | null>(null);

  // Funnel event-tracking state (spec 005)
  const startedRef = useRef(false);
  const answeredRef = useRef<Set<number>>(new Set());
  const quizStartRef = useRef<number>(Date.now());

  // page_view once on mount; question_viewed whenever the question changes.
  useEffect(() => {
    trackPageView();
  }, []);

  useEffect(() => {
    const q = questions[currentIndex];
    trackQuestionViewed(q.id, q.position);
  }, [currentIndex]);

  // Emits assessment_started (once) and question_answered (once per question).
  const markProgress = useCallback((index: number) => {
    if (!startedRef.current) {
      startedRef.current = true;
      quizStartRef.current = Date.now();
      trackAssessmentStarted();
    }
    if (!answeredRef.current.has(index)) {
      answeredRef.current.add(index);
      const q = questions[index];
      trackQuestionAnswered(q.id, q.position);
    }
  }, []);

  const question: Question = questions[currentIndex];
  const isFirst = currentIndex === 0;
  const isLast = currentIndex === questions.length - 1;

  const currentAnswer = answers[currentIndex];
  const hasAnswer =
    currentAnswer !== undefined &&
    (Array.isArray(currentAnswer) || currentAnswer !== '');

  function clearAutoAdvance() {
    if (autoAdvanceTimer.current) {
      clearTimeout(autoAdvanceTimer.current);
      autoAdvanceTimer.current = null;
    }
  }

  const handleSingleSelect = useCallback(
    (key: string) => {
      setAnswers((prev) => ({ ...prev, [currentIndex]: key }));
      markProgress(currentIndex);
      clearAutoAdvance();

      if (currentIndex < questions.length - 1) {
        autoAdvanceTimer.current = setTimeout(() => {
          setCurrentIndex((prev) => prev + 1);
        }, AUTO_ADVANCE_DELAY);
      }
    },
    [currentIndex, markProgress],
  );

  const handleChecklistChange = useCallback(
    (indices: number[]) => {
      setAnswers((prev) => ({ ...prev, [currentIndex]: indices }));
      markProgress(currentIndex);
    },
    [currentIndex, markProgress],
  );

  function handleNext() {
    clearAutoAdvance();
    // Covers checklist questions advanced without toggling an item.
    markProgress(currentIndex);
    if (isLast) {
      setPhase('email-gate');
      return;
    }
    setCurrentIndex((prev) => prev + 1);
  }

  function handleBack() {
    if (isFirst) return;
    clearAutoAdvance();
    setCurrentIndex((prev) => prev - 1);
  }

  async function submitAssessment(firstName: string, email: string) {
    setPhase('loading');
    setLoadingError(null);

    const minDelay = new Promise((r) => setTimeout(r, MIN_LOADING_MS));

    const apiCall = Promise.race([
      fetch('/api/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          answers,
          firstName,
          email,
          anonSessionId: getAnonSessionId(),
          completionTimeSeconds: Math.max(
            1,
            Math.round((Date.now() - quizStartRef.current) / 1000),
          ),
          utmParams: captureUtmParams(),
        }),
      }),
      new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error('Request timed out')), API_TIMEOUT_MS),
      ),
    ]);

    try {
      const [response] = await Promise.all([apiCall, minDelay]);

      if (!response.ok) {
        const body = await response.json().catch(() => ({}));
        throw new Error(body.error || `Server error (${response.status})`);
      }

      const data = await response.json();
      trackAssessmentSubmitted(data.resultId);
      sessionStorage.setItem('worshipWheelResult', JSON.stringify(data));
      router.push('/results');
    } catch (err) {
      setLoadingError(
        err instanceof Error ? err.message : 'Something went wrong. Please try again.',
      );
    }
  }

  async function handleEmailSubmit(firstName: string, email: string) {
    emailDataRef.current = { firstName, email };
    setIsSubmitting(true);
    await submitAssessment(firstName, email);
    setIsSubmitting(false);
  }

  function handleRetry() {
    if (emailDataRef.current) {
      submitAssessment(emailDataRef.current.firstName, emailDataRef.current.email);
    }
  }

  function renderQuestion(q: Question) {
    switch (q.type) {
      case 'scenario':
      case 'experience':
        return (
          <QuestionCard
            questionText={q.text}
            options={q.options}
            selectedOption={(currentAnswer as string) ?? null}
            onSelect={handleSingleSelect}
          />
        );
      case 'checklist':
        return (
          <ChecklistCard
            questionText={q.text}
            items={q.items}
            checkedIndices={(currentAnswer as number[]) ?? []}
            onChange={handleChecklistChange}
          />
        );
    }
  }

  // For checklist questions, always allow advancing (0 selections = score 1)
  const canAdvance = question.type === 'checklist' || hasAnswer;

  return (
    <main className="flex min-h-screen flex-col">
      {/* Navbar */}
      <nav className="flex items-center justify-center px-space-8 py-space-1 bg-neutral-0">
        <Image
          src="/logo.svg"
          alt="Worship Guitar Skills"
          width={62}
          height={62}
          priority
        />
      </nav>

      {/* Content */}
      <section className="relative flex flex-1 flex-col items-center px-site-margin py-section-md max-md:py-space-6">
        {/* Background */}
        <div className="absolute inset-0 z-0">
          <Image
            src="/hero-bg.webp"
            alt=""
            fill
            className="object-cover"
          />
          <div className="absolute inset-0 bg-neutral-950/60" />
        </div>

        {phase === 'quiz' ? (
          <div className="relative z-10 flex w-full max-w-[680px] flex-col gap-space-5 max-md:gap-space-3">
            <ProgressBar
              current={currentIndex + 1}
              total={questions.length}
              elementName={question.elementName}
            />

            {renderQuestion(question)}

            {/* Navigation */}
            <div className="flex items-center justify-between max-md:justify-center">
              {!isFirst ? (
                <button
                  type="button"
                  onClick={handleBack}
                  className="inline-flex items-center justify-center rounded-sm border border-theme-bg-2 bg-transparent px-space-5 py-[10px] text-text-base font-bold text-theme-text hover:border-theme-text hover:bg-theme-text hover:text-neutral-950 transition-colors cursor-pointer"
                >
                  ← Back
                </button>
              ) : (
                <div />
              )}

              {/* Show Next for checklists (always) and See Results for last question */}
              {isLast ? (
                <button
                  type="button"
                  onClick={handleNext}
                  disabled={!canAdvance}
                  className="inline-flex items-center justify-center rounded-sm bg-btn-primary px-space-5 py-[10px] text-text-base font-bold text-btn-primary-text hover:bg-btn-primary-hover hover:text-btn-primary-hover-text transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  See My Results →
                </button>
              ) : question.type === 'checklist' ? (
                <button
                  type="button"
                  onClick={handleNext}
                  className="inline-flex items-center justify-center rounded-sm bg-btn-primary px-space-5 py-[10px] text-text-base font-bold text-btn-primary-text hover:bg-btn-primary-hover hover:text-btn-primary-hover-text transition-colors cursor-pointer"
                >
                  Next Question →
                </button>
              ) : null}
            </div>
          </div>
        ) : phase === 'email-gate' ? (
          <div className="relative z-10 flex w-full justify-center">
            <EmailGate onSubmit={handleEmailSubmit} isSubmitting={isSubmitting} />
          </div>
        ) : (
          <div className="relative z-10 flex w-full justify-center">
            <ResultsLoading error={loadingError} onRetry={handleRetry} />
          </div>
        )}
      </section>
    </main>
  );
}
