import { useCallback } from "react";

export interface UseSubmitShortcutOptions {
  /** If true, Enter and Cmd/Ctrl+Enter submit; Shift+Enter inserts newline. If false, Enter (no Shift) and Cmd/Ctrl+Enter both submit. Default: false (single-line). */
  multiline?: boolean;
  /** When true, the shortcut does nothing. */
  disabled?: boolean;
}

/**
 * Returns an onKeyDown handler for submit shortcuts.
 * - For multiline inputs (textarea): Enter and Cmd/Ctrl+Enter submit; Shift+Enter inserts newline.
 * - For single-line inputs: Enter (without Shift) and Cmd/Ctrl+Enter both submit.
 */
export function useSubmitShortcut(
  onSubmit: () => void,
  options?: UseSubmitShortcutOptions
): (e: React.KeyboardEvent) => void {
  const { multiline = false, disabled = false } = options ?? {};

  return useCallback(
    (e: React.KeyboardEvent) => {
      if (disabled) return;
      if (e.key !== "Enter") return;

      const isMod = e.metaKey || e.ctrlKey;

      if (multiline) {
        if (e.shiftKey) {
          // Shift+Enter: allow default (insert newline)
          return;
        }
        // Enter or Cmd/Ctrl+Enter: submit
        e.preventDefault();
        onSubmit();
      } else {
        if (isMod || !e.shiftKey) {
          e.preventDefault();
          onSubmit();
        }
      }
    },
    [onSubmit, multiline, disabled]
  );
}
