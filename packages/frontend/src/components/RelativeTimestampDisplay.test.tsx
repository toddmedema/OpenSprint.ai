import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, act } from "@testing-library/react";
import { RelativeTimestampDisplay } from "./RelativeTimestampDisplay";

describe("RelativeTimestampDisplay", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("renders em dash when timestamp is undefined", () => {
    render(<RelativeTimestampDisplay />);
    expect(screen.getByText(/—/)).toBeInTheDocument();
  });

  it("updates on the default 30 second cadence", () => {
    vi.setSystemTime(new Date("2026-02-16T12:00:00.000Z"));

    render(<RelativeTimestampDisplay timestamp="2026-02-16T11:58:30.000Z" />);
    expect(screen.getByText("1m ago")).toBeInTheDocument();

    act(() => {
      vi.advanceTimersByTime(29_000);
    });
    expect(screen.getByText("1m ago")).toBeInTheDocument();

    act(() => {
      vi.advanceTimersByTime(1_000);
    });
    expect(screen.getByText("2m ago")).toBeInTheDocument();
  });
});
