'use client';

interface ResultsLoadingProps {
  error?: string | null;
  onRetry?: () => void;
}

export function ResultsLoading({ error, onRetry }: ResultsLoadingProps) {
  return (
    <div className="flex w-full max-w-[680px] flex-col items-center justify-center gap-space-6 py-section-md max-md:py-space-8">
      {/* Spinner */}
      <div className="relative h-[120px] w-[120px]">
        {/* Track ring */}
        <svg className="absolute inset-0 h-full w-full" viewBox="0 0 120 120">
          <circle
            cx="60"
            cy="60"
            r="54"
            fill="none"
            stroke="currentColor"
            strokeWidth="5"
            className="text-neutral-700"
          />
        </svg>
        {/* Active arc — animated rotation */}
        <svg
          className="absolute inset-0 h-full w-full animate-spin"
          style={{ animationDuration: '1.4s' }}
          viewBox="0 0 120 120"
        >
          <circle
            cx="60"
            cy="60"
            r="54"
            fill="none"
            stroke="currentColor"
            strokeWidth="5"
            strokeLinecap="round"
            strokeDasharray="210 339"
            className="text-accent-500"
          />
        </svg>
      </div>

      {/* Message */}
      <div className="flex flex-col items-center gap-space-3 text-center">
        {error ? (
          <>
            <h2 className="text-h4 max-md:text-h5 font-bold text-theme-text">
              Something went wrong
            </h2>
            <p className="text-text-base text-theme-text-muted">{error}</p>
            {onRetry && (
              <button
                type="button"
                onClick={onRetry}
                className="mt-space-3 inline-flex items-center justify-center rounded-sm bg-btn-primary px-space-5 py-[10px] text-text-base font-bold text-btn-primary-text hover:bg-btn-primary-hover transition-colors cursor-pointer"
              >
                Try Again
              </button>
            )}
          </>
        ) : (
          <>
            <h2 className="text-h4 max-md:text-h5 font-bold text-theme-text">
              Analysing your Worship Wheel...
            </h2>
            <p className="text-text-base text-theme-text-muted">
              Crunching your scores across all 8 elements
            </p>
          </>
        )}
      </div>
    </div>
  );
}
