// Unified error surface for dashboard routes (spec 007). Mirrors the
// existing inline error treatment from spec 005 so the tokens stay consistent.
import { type ReactNode } from 'react';

interface ErrorStateProps {
  title: string;
  message: string;
  retry?: ReactNode;
}

export function ErrorState({ title, message, retry }: ErrorStateProps) {
  return (
    <div
      className="rounded-md border border-error-500/40 bg-error-500/[0.06] px-space-5 py-space-4"
      role="alert"
    >
      <p className="text-text-base font-bold text-error-400">{title}</p>
      <p className="mt-space-1 text-text-sm text-theme-text-muted">{message}</p>
      {retry && <div className="mt-space-3">{retry}</div>}
    </div>
  );
}
