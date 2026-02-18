/**
 * Shared constants for the frontend.
 */

/** Canonical order of PRD sections for display. */
export const PRD_SECTION_ORDER = [
  "executive_summary",
  "problem_statement",
  "goals_and_metrics",
  "user_personas",
  "technical_architecture",
  "feature_list",
  "non_functional_requirements",
  "data_model",
  "api_contracts",
  "open_questions",
] as const;

export type PrdSectionKey = (typeof PRD_SECTION_ORDER)[number];

/** Display labels for PRD change log source badges (user-facing phase names). */
export const PRD_SOURCE_LABELS: Record<string, string> = {
  sketch: "Sketch",
  spec: "Sketch", // legacy alias
  plan: "Plan",
  execute: "Execute",
  eval: "Eval",
  deliver: "Deliver",
};

/** Tailwind class pairs for PRD change log source badges (bg-* text-*). Theme-aware with dark variants. */
export const PRD_SOURCE_COLORS: Record<string, string> = {
  sketch: "bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-200",
  spec: "bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-200", // legacy alias
  plan: "bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-200",
  execute: "bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-200",
  eval: "bg-purple-100 text-purple-800 dark:bg-purple-900/40 dark:text-purple-200",
  deliver: "bg-theme-surface-muted text-theme-text",
};

/** Default color for unknown PRD sources. */
const PRD_SOURCE_DEFAULT = "bg-purple-100 text-purple-800 dark:bg-purple-900/40 dark:text-purple-200";

/** Returns Tailwind classes for a PRD change log source. */
export function getPrdSourceColor(source: string): string {
  return PRD_SOURCE_COLORS[source] ?? PRD_SOURCE_DEFAULT;
}
