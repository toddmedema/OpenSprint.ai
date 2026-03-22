import { act, renderHook } from "@testing-library/react";
import { useState } from "react";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { useOptimisticTextDraft } from "./useOptimisticTextDraft";

const KEY = "openspring-test-draft-key";

describe("useOptimisticTextDraft", () => {
  beforeEach(() => {
    localStorage.removeItem(KEY);
  });

  afterEach(() => {
    localStorage.removeItem(KEY);
  });

  it("persists non-empty text to localStorage", () => {
    const { result } = renderHook(() => {
      const [text, setText] = useState("");
      const draft = useOptimisticTextDraft(KEY, text, setText);
      return { text, setText, ...draft };
    });

    act(() => {
      result.current.setText("hello");
    });

    expect(localStorage.getItem(KEY)).toBe(JSON.stringify("hello"));
  });

  it("beginSend clears UI but keeps draft in localStorage until onSuccess", () => {
    const { result } = renderHook(() => {
      const [text, setText] = useState("typed");
      const draft = useOptimisticTextDraft(KEY, text, setText);
      return { text, setText, ...draft };
    });

    act(() => {
      result.current.beginSend("typed");
    });

    expect(result.current.text).toBe("");
    expect(localStorage.getItem(KEY)).toBe(JSON.stringify("typed"));

    act(() => {
      result.current.onSuccess();
    });

    expect(localStorage.getItem(KEY)).toBeNull();
  });

  it("onFailure restores input from localStorage snapshot", () => {
    const { result } = renderHook(() => {
      const [text, setText] = useState("");
      const draft = useOptimisticTextDraft(KEY, text, setText);
      return { text, setText, ...draft };
    });

    act(() => {
      result.current.setText("will fail");
    });

    act(() => {
      result.current.beginSend("will fail");
    });

    expect(result.current.text).toBe("");
    expect(localStorage.getItem(KEY)).toBe(JSON.stringify("will fail"));

    act(() => {
      result.current.onFailure();
    });

    expect(result.current.text).toBe("will fail");
  });

  it("keeps the recovery snapshot in localStorage while the composer is empty after beginSend", () => {
    const { result } = renderHook(() => {
      const [text, setText] = useState("x");
      const draft = useOptimisticTextDraft(KEY, text, setText);
      return { text, setText, ...draft };
    });

    act(() => {
      result.current.beginSend("x");
    });

    expect(result.current.text).toBe("");
    expect(localStorage.getItem(KEY)).toBe(JSON.stringify("x"));
  });

  it("when storageKey is undefined, onSuccess clears text without localStorage", () => {
    const { result } = renderHook(() => {
      const [text, setText] = useState("only ui");
      const draft = useOptimisticTextDraft(undefined, text, setText);
      return { text, setText, ...draft };
    });

    act(() => {
      result.current.onSuccess();
    });

    expect(result.current.text).toBe("");
  });
});
