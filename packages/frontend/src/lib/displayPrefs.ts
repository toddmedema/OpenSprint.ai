/** How to show running agents in the UI: count only, icons only, or both. */
export type RunningAgentsDisplayMode = "count" | "icons" | "both";

const STORAGE_KEY = "opensprint.runningAgentsDisplayMode";

const VALID: RunningAgentsDisplayMode[] = ["count", "icons", "both"];

export function getStoredRunningAgentsDisplayMode(): RunningAgentsDisplayMode {
  if (typeof window === "undefined") return "count";
  const stored = localStorage.getItem(STORAGE_KEY);
  return VALID.includes(stored as RunningAgentsDisplayMode)
    ? (stored as RunningAgentsDisplayMode)
    : "count";
}

export function setStoredRunningAgentsDisplayMode(mode: RunningAgentsDisplayMode): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY, mode);
}
