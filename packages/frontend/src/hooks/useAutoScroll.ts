import { useRef, useState, useEffect, useCallback } from "react";

const BOTTOM_THRESHOLD_PX = 50;

export interface UseAutoScrollOptions {
  /** Content length (e.g. agentOutput.length) - when this increases and auto-scroll is on, scroll to bottom */
  contentLength: number;
  /** Key that resets auto-scroll when changed (e.g. selectedTask) */
  resetKey: string;
}

export interface UseAutoScrollResult {
  containerRef: React.RefObject<HTMLDivElement | null>;
  autoScrollEnabled: boolean;
  showJumpToBottom: boolean;
  jumpToBottom: () => void;
  handleScroll: () => void;
}

/**
 * Manages auto-scroll behavior for a scrollable container:
 * - Default: scrolls to bottom when content grows
 * - Disables when user scrolls up (away from bottom)
 * - Re-enables when user scrolls to bottom (within threshold) or clicks Jump to bottom
 * - Resets when resetKey changes (e.g. switching tasks)
 */
export function useAutoScroll({
  contentLength,
  resetKey,
}: UseAutoScrollOptions): UseAutoScrollResult {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [autoScrollEnabled, setAutoScrollEnabled] = useState(true);
  const [showJumpToBottom, setShowJumpToBottom] = useState(false);
  const prevContentLengthRef = useRef(0);
  const prevResetKeyRef = useRef(resetKey);

  // Reset auto-scroll when switching tasks/sessions
  useEffect(() => {
    if (prevResetKeyRef.current !== resetKey) {
      prevResetKeyRef.current = resetKey;
      setAutoScrollEnabled(true);
      setShowJumpToBottom(false);
    }
  }, [resetKey]);

  // Scroll to bottom when new content arrives and auto-scroll is enabled
  useEffect(() => {
    if (!autoScrollEnabled || contentLength <= prevContentLengthRef.current) {
      prevContentLengthRef.current = contentLength;
      return;
    }
    prevContentLengthRef.current = contentLength;

    const el = containerRef.current;
    if (!el) return;

    const rafId = requestAnimationFrame(() => {
      el.scrollTop = el.scrollHeight - el.clientHeight;
    });
    return () => cancelAnimationFrame(rafId);
  }, [contentLength, autoScrollEnabled]);

  const handleScroll = useCallback(() => {
    const el = containerRef.current;
    if (!el) return;

    const { scrollTop, scrollHeight, clientHeight } = el;
    const distanceFromBottom = scrollHeight - scrollTop - clientHeight;

    if (distanceFromBottom <= BOTTOM_THRESHOLD_PX) {
      setAutoScrollEnabled(true);
      setShowJumpToBottom(false);
    } else {
      setAutoScrollEnabled(false);
      setShowJumpToBottom(true);
    }
  }, []);

  const jumpToBottom = useCallback(() => {
    const el = containerRef.current;
    if (!el) return;

    const rafId = requestAnimationFrame(() => {
      el.scrollTop = el.scrollHeight - el.clientHeight;
      setAutoScrollEnabled(true);
      setShowJumpToBottom(false);
    });
    return () => cancelAnimationFrame(rafId);
  }, []);

  return {
    containerRef,
    autoScrollEnabled,
    showJumpToBottom,
    jumpToBottom,
    handleScroll,
  };
}
