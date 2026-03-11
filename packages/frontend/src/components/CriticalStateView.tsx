import React from "react";

export interface CriticalStateViewProps {
  /** Unique test id for the region */
  "data-testid": string;
  /** Heading text (rendered as h1) */
  heading: string;
  /** Optional concise summary for screen readers (aria-describedby when provided) */
  summary?: string;
  /** Primary action (button or link) */
  primaryAction: React.ReactNode;
  /** Role: "region" for landmark, "main" for primary content, "alert" for immediate screen reader announcement */
  role?: "region" | "main" | "alert";
  /** Optional class for outer container (e.g. min-h-screen for root-level ErrorBoundary) */
  className?: string;
}

/**
 * Shared layout for critical-state views: one h1 per view, one primary action,
 * and aria-describedby for a concise screen-reader summary.
 * Use for DatabaseUnavailableState, ProjectNotFoundState, ErrorBoundary, etc.
 */
export function CriticalStateView({
  "data-testid": testId,
  heading,
  summary,
  primaryAction,
  role = "region",
  className = "",
}: CriticalStateViewProps) {
  const baseId = testId.replace(/-state$/, "");
  const headingId = `${baseId}-heading`;
  const summaryId = summary ? `${baseId}-summary` : undefined;

  return (
    <div
      className={`flex flex-1 min-h-0 items-center justify-center px-6 py-12 ${className}`.trim()}
      data-testid={testId}
      role={role}
      aria-labelledby={headingId}
      {...(summaryId ? { "aria-describedby": summaryId } : {})}
    >
      <div className="max-w-xl rounded-2xl border border-theme-error-border bg-theme-surface p-6 text-center shadow-sm">
        <h1 id={headingId} className="text-xl font-semibold text-theme-text">
          {heading}
        </h1>
        {summary && (
          <p id={summaryId} className="mt-3 text-sm text-theme-muted">
            {summary}
          </p>
        )}
        <div className={summary ? "mt-5" : "mt-4"}>{primaryAction}</div>
      </div>
    </div>
  );
}
