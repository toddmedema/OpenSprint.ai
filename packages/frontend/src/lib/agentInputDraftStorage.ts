/**
 * Plain-text drafts for agent-facing inputs (chat composer, plan idea, etc.).
 * Keys are caller-defined; use the helpers below for consistent naming.
 */

export function chatDraftStorageKey(projectId: string, context: string): string {
  const safe = encodeURIComponent(context);
  return `opensprint-chat-draft-v1-${projectId}-${safe}`;
}

export function planIdeaDraftStorageKey(projectId: string): string {
  return `opensprint-plan-idea-draft-v1-${projectId}`;
}

/** Help panel “Ask a Question” composer — separate keys for global vs project-scoped help. */
export function helpAskDraftStorageKey(projectId: string | null | undefined): string {
  if (typeof projectId === "string" && projectId.trim().length > 0) {
    return `opensprint-help-ask-draft-v1-${projectId}`;
  }
  return "opensprint-help-ask-draft-v1-global";
}

export function loadTextDraft(key: string): string {
  if (typeof window === "undefined") return "";
  try {
    const stored = localStorage.getItem(key);
    if (stored == null) return "";
    const parsed = JSON.parse(stored) as unknown;
    if (typeof parsed === "string") return parsed;
    if (parsed !== null && typeof parsed === "object" && typeof (parsed as { text?: unknown }).text === "string") {
      return (parsed as { text: string }).text;
    }
    return "";
  } catch {
    return "";
  }
}

export function saveTextDraft(key: string, text: string): void {
  if (typeof window === "undefined") return;
  try {
    if (!text) {
      localStorage.removeItem(key);
      return;
    }
    localStorage.setItem(key, JSON.stringify(text));
  } catch {
    // ignore quota
  }
}

export function clearTextDraft(key: string): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.removeItem(key);
  } catch {
    // ignore
  }
}
