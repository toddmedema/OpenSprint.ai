/** Unicode ellipsis appended when the plan name segment is truncated. */
export const PLAN_NAME_TRUNCATION_ELLIPSIS = "\u2026";

/** Max characters kept from the plan name before ellipsis (when truncated). */
export const PLAN_NAME_MAX_CHARS_RUNNING_AGENTS_DROPDOWN = 20;

/**
 * Truncate a plan display name for the running-agents dropdown: at most `maxChars` characters,
 * preferring the last whitespace boundary at or before that limit. If the name fits in `maxChars`,
 * returns it unchanged (no ellipsis). Otherwise appends {@link PLAN_NAME_TRUNCATION_ELLIPSIS}.
 */
export function truncatePlanNameForRunningAgentsDropdown(
  planName: string,
  maxChars: number = PLAN_NAME_MAX_CHARS_RUNNING_AGENTS_DROPDOWN
): string {
  const normalized = planName.trim().replace(/\s+/g, " ");
  if (normalized.length <= maxChars) return normalized;
  const windowSlice = normalized.slice(0, maxChars);
  const lastSpace = windowSlice.lastIndexOf(" ");
  const cut = lastSpace > 0 ? lastSpace : maxChars;
  let base = normalized.slice(0, cut).trimEnd();
  if (base.length === 0) {
    base = normalized.slice(0, maxChars);
  }
  return `${base}${PLAN_NAME_TRUNCATION_ELLIPSIS}`;
}

/** Primary line for Plan chat agents in the running-agents dropdown. */
export function formatPlanChatRunningAgentsLabel(planDisplayName: string): string {
  return `Plan chat - ${truncatePlanNameForRunningAgentsDropdown(planDisplayName)}`;
}
