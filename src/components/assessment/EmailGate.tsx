'use client';

import { useState } from 'react';

interface EmailGateProps {
  onSubmit: (firstName: string, email: string) => void;
  isSubmitting: boolean;
}

export function EmailGate({ onSubmit, isSubmitting }: EmailGateProps) {
  const [firstName, setFirstName] = useState('');
  const [email, setEmail] = useState('');
  const [consent, setConsent] = useState(false);
  const [errors, setErrors] = useState<{ firstName?: string; email?: string; consent?: string }>({});

  function validate(): boolean {
    const newErrors: typeof errors = {};
    if (!firstName.trim()) newErrors.firstName = 'Please enter your first name';
    if (!email.trim()) {
      newErrors.email = 'Please enter your email address';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      newErrors.email = 'Please enter a valid email address';
    }
    if (!consent) newErrors.consent = 'Please agree to receive your results';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (validate()) {
      onSubmit(firstName.trim(), email.trim());
    }
  }

  return (
    <div className="flex w-full max-w-[680px] flex-col items-center gap-space-5 text-center">
      {/* Completion Icon */}
      <div className="flex h-16 w-16 items-center justify-center rounded-full border-2 border-accent-500">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M5 12l5 5L20 7" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="text-accent-500" />
        </svg>
      </div>

      <h1 className="text-h4 font-bold">Your Worship Wheel is Ready!</h1>
      <p className="max-w-[567px] text-text-base text-theme-text-muted">
        Enter your details below to see your personalised results and receive
        tailored recommendations to level up your playing.
      </p>

      {/* Form Card */}
      <form
        onSubmit={handleSubmit}
        className="flex w-full max-w-[480px] flex-col gap-space-5 rounded-md bg-theme-bg-2 p-space-7 max-md:p-space-4 text-left"
      >
        {/* First Name */}
        <div className="flex flex-col gap-space-2">
          <label htmlFor="firstName" className="text-text-sm font-medium">
            First Name
          </label>
          <input
            id="firstName"
            type="text"
            placeholder="Enter your first name"
            value={firstName}
            onChange={(e) => setFirstName(e.target.value)}
            className="rounded-sm bg-theme-bg px-space-4 py-space-3 text-text-base text-theme-text placeholder:text-neutral-500 outline-none focus:ring-1 focus:ring-accent-500"
          />
          {errors.firstName && (
            <span className="text-text-sm text-error-500">{errors.firstName}</span>
          )}
        </div>

        {/* Email */}
        <div className="flex flex-col gap-space-2">
          <label htmlFor="email" className="text-text-sm font-medium">
            Email Address
          </label>
          <input
            id="email"
            type="email"
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="rounded-sm bg-theme-bg px-space-4 py-space-3 text-text-base text-theme-text placeholder:text-neutral-500 outline-none focus:ring-1 focus:ring-accent-500"
          />
          {errors.email && (
            <span className="text-text-sm text-error-500">{errors.email}</span>
          )}
        </div>

        {/* Consent */}
        <label className="flex items-start gap-space-2 cursor-pointer">
          <input
            type="checkbox"
            checked={consent}
            onChange={(e) => setConsent(e.target.checked)}
            className="mt-1 h-4 w-4 shrink-0 cursor-pointer accent-accent-500"
          />
          <span className="text-text-sm text-theme-text-muted">
            I agree to receive emails with my results and worship guitar tips.{' '}
            <a href="/privacy" className="underline hover:text-accent-500">
              View our Privacy Policy
            </a>
            .
          </span>
        </label>
        {errors.consent && (
          <span className="-mt-space-3 text-text-sm text-error-500">{errors.consent}</span>
        )}

        {/* Honeypot — hidden from humans */}
        <input type="text" name="website" className="hidden" tabIndex={-1} autoComplete="off" />

        {/* Submit */}
        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full rounded-sm bg-btn-primary py-[10px] text-text-base font-bold text-btn-primary-text hover:bg-btn-primary-hover hover:text-btn-primary-hover-text transition-colors cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {isSubmitting ? 'Loading...' : 'See My Results'}
        </button>
      </form>
    </div>
  );
}
