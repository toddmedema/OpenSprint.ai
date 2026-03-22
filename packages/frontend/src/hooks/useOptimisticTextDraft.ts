import { useCallback, useEffect, useRef, type Dispatch, type SetStateAction } from "react";
import { clearTextDraft, loadTextDraft, saveTextDraft } from "../lib/agentInputDraftStorage";

/**
 * Persists textarea state to localStorage and supports optimistic clear on send:
 * after beginSend(trimmed), the field is empty in the UI while localStorage keeps
 * the submitted text until onSuccess (purge) or onFailure (restore).
 */
export function useOptimisticTextDraft(
  storageKey: string | undefined,
  text: string,
  setText: Dispatch<SetStateAction<string>>
) {
  const pendingRecoveryRef = useRef(false);

  useEffect(() => {
    pendingRecoveryRef.current = false;
  }, [storageKey]);

  useEffect(() => {
    if (!storageKey) return;
    if (text !== "") pendingRecoveryRef.current = false;
    if (text === "" && pendingRecoveryRef.current) return;
    saveTextDraft(storageKey, text);
  }, [storageKey, text]);

  const beginSend = useCallback(
    (trimmed: string) => {
      if (storageKey) {
        saveTextDraft(storageKey, trimmed);
        pendingRecoveryRef.current = true;
        setText("");
      }
    },
    [storageKey, setText]
  );

  const onSuccess = useCallback(() => {
    if (storageKey) {
      clearTextDraft(storageKey);
      pendingRecoveryRef.current = false;
    } else {
      setText("");
    }
  }, [storageKey, setText]);

  const onFailure = useCallback(() => {
    if (!storageKey) return;
    setText(loadTextDraft(storageKey));
    pendingRecoveryRef.current = false;
  }, [storageKey, setText]);

  return { beginSend, onSuccess, onFailure };
}
