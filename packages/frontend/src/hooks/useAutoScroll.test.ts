import type React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useAutoScroll } from "./useAutoScroll";

describe("useAutoScroll", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  it("returns containerRef, showJumpToBottom false initially, and jumpToBottom", () => {
    const { result } = renderHook(() => useAutoScroll({ contentLength: 0, resetKey: "task-1" }));

    expect(result.current.containerRef).toBeDefined();
    expect(result.current.showJumpToBottom).toBe(false);
    expect(typeof result.current.jumpToBottom).toBe("function");
    expect(typeof result.current.handleScroll).toBe("function");
  });

  it("scrolls to bottom when contentLength increases and auto-scroll is enabled", () => {
    const mockEl = {
      scrollTop: 0,
      scrollHeight: 500,
      clientHeight: 200,
    };
    const { result, rerender } = renderHook(
      ({ contentLength }) => useAutoScroll({ contentLength, resetKey: "task-1" }),
      { initialProps: { contentLength: 0 } }
    );

    (result.current.containerRef as React.MutableRefObject<typeof mockEl | null>).current = mockEl;

    rerender({ contentLength: 1 });

    act(() => {
      vi.advanceTimersToNextFrame();
    });

    expect(mockEl.scrollTop).toBe(300); // scrollHeight - clientHeight
  });

  it("sets showJumpToBottom when user scrolls up (away from bottom)", () => {
    const { result } = renderHook(() => useAutoScroll({ contentLength: 0, resetKey: "task-1" }));

    const mockEl = {
      scrollTop: 0,
      scrollHeight: 500,
      clientHeight: 200,
    };
    (result.current.containerRef as React.MutableRefObject<typeof mockEl | null>).current = mockEl;

    // scrollTop 0 means we're at top - far from bottom (distanceFromBottom = 300)
    act(() => {
      result.current.handleScroll();
    });

    expect(result.current.showJumpToBottom).toBe(true);
  });

  it("clears showJumpToBottom when user scrolls to bottom (within threshold)", () => {
    const { result } = renderHook(() => useAutoScroll({ contentLength: 0, resetKey: "task-1" }));

    const mockEl = {
      scrollTop: 0,
      scrollHeight: 500,
      clientHeight: 200,
    };
    (result.current.containerRef as React.MutableRefObject<typeof mockEl | null>).current = mockEl;

    act(() => {
      result.current.handleScroll();
    });
    expect(result.current.showJumpToBottom).toBe(true);

    // Scroll to bottom - scrollTop = scrollHeight - clientHeight = 300, distanceFromBottom = 0
    mockEl.scrollTop = 300;
    act(() => {
      result.current.handleScroll();
    });

    expect(result.current.showJumpToBottom).toBe(false);
  });

  it("jumpToBottom scrolls to bottom and clears showJumpToBottom", () => {
    const { result } = renderHook(() => useAutoScroll({ contentLength: 0, resetKey: "task-1" }));

    const mockEl = {
      scrollTop: 0,
      scrollHeight: 500,
      clientHeight: 200,
    };
    (result.current.containerRef as React.MutableRefObject<typeof mockEl | null>).current = mockEl;

    act(() => {
      result.current.handleScroll();
    });
    expect(result.current.showJumpToBottom).toBe(true);

    act(() => {
      result.current.jumpToBottom();
    });
    act(() => {
      vi.advanceTimersToNextFrame();
    });

    expect(mockEl.scrollTop).toBe(300);
    expect(result.current.showJumpToBottom).toBe(false);
  });

  it("resets auto-scroll state when resetKey changes", () => {
    const { result, rerender } = renderHook(
      ({ resetKey }) => useAutoScroll({ contentLength: 0, resetKey }),
      { initialProps: { resetKey: "task-1" } }
    );

    const mockEl = {
      scrollTop: 0,
      scrollHeight: 500,
      clientHeight: 200,
    };
    (result.current.containerRef as React.MutableRefObject<typeof mockEl | null>).current = mockEl;

    act(() => {
      result.current.handleScroll();
    });
    expect(result.current.showJumpToBottom).toBe(true);

    rerender({ resetKey: "task-2" });

    expect(result.current.showJumpToBottom).toBe(false);
  });
});
