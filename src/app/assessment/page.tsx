'use client';

import { useState, useRef, useCallback } from 'react';
import Image from 'next/image';
import { ProgressBar } from '@/components/assessment/ProgressBar';
import { QuestionCard } from '@/components/assessment/QuestionCard';
import { EmailGate } from '@/components/assessment/EmailGate';
import { questions } from '@/data/placeholder-questions';

const AUTO_ADVANCE_DELAY = 400;

type Phase = 'quiz' | 'email-gate';

export default function AssessmentPage() {
  const [phase, setPhase] = useState<Phase>('quiz');
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const autoAdvanceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const question = questions[currentIndex];
  const isFirst = currentIndex === 0;
  const isLast = currentIndex === questions.length - 1;
  const hasAnswer = answers[currentIndex] !== undefined;

  const handleSelect = useCallback((letter: string) => {
    setAnswers((prev) => ({ ...prev, [currentIndex]: letter }));

    if (autoAdvanceTimer.current) {
      clearTimeout(autoAdvanceTimer.current);
    }

    if (currentIndex < questions.length - 1) {
      autoAdvanceTimer.current = setTimeout(() => {
        setCurrentIndex((prev) => prev + 1);
      }, AUTO_ADVANCE_DELAY);
    }
  }, [currentIndex]);

  function handleNext() {
    if (!hasAnswer) return;
    if (autoAdvanceTimer.current) {
      clearTimeout(autoAdvanceTimer.current);
    }
    if (isLast) {
      setPhase('email-gate');
      return;
    }
    setCurrentIndex((prev) => prev + 1);
  }

  function handleBack() {
    if (isFirst) return;
    if (autoAdvanceTimer.current) {
      clearTimeout(autoAdvanceTimer.current);
    }
    setCurrentIndex((prev) => prev - 1);
  }

  async function handleEmailSubmit(firstName: string, email: string) {
    setIsSubmitting(true);
    // TODO: POST to /api/submit with answers, firstName, email
    // For now, simulate a brief delay then redirect
    await new Promise((r) => setTimeout(r, 1000));
    // TODO: redirect to /results/[resultId]
    setIsSubmitting(false);
  }

  return (
    <main className="flex min-h-screen flex-col">
      {/* Navbar */}
      <nav className="flex items-center justify-center px-space-8 py-space-3 max-md:py-space-2 bg-neutral-0">
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

            <QuestionCard
              questionText={question.text}
              options={question.options.map((o) => ({
                letter: o.letter,
                text: o.text,
              }))}
              selectedOption={answers[currentIndex] ?? null}
              onSelect={handleSelect}
            />

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

              {isLast && (
                <button
                  type="button"
                  onClick={handleNext}
                  disabled={!hasAnswer}
                  className="inline-flex items-center justify-center rounded-sm bg-btn-primary px-space-5 py-[10px] text-text-base font-bold text-btn-primary-text hover:bg-btn-primary-hover hover:text-btn-primary-hover-text transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  See My Results →
                </button>
              )}
            </div>
          </div>
        ) : (
          <div className="relative z-10 flex w-full justify-center">
            <EmailGate onSubmit={handleEmailSubmit} isSubmitting={isSubmitting} />
          </div>
        )}
      </section>
    </main>
  );
}
