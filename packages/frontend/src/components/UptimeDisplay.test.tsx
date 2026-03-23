import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, act } from "@testing-library/react";
import { UptimeDisplay } from "./UptimeDisplay";

describe("UptimeDisplay", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  it("renders em dash when startedAt is undefined", () => {
    render(<UptimeDisplay />);
    expect(screen.getByText(/—/)).toBeInTheDocument();
  });

  it("renders em dash when startedAt is empty string", () => {
    render(<UptimeDisplay startedAt="" />);
    expect(screen.getByText(/—/)).toBeInTheDocument();
  });

  it("renders live uptime and updates every second", () => {
    vi.setSystemTime(new Date("2026-02-16T12:00:00.000Z"));
    const startedAt = "2026-02-16T12:00:00.000Z";

    render(<UptimeDisplay startedAt={startedAt} />);
    expect(screen.getByText("0s")).toBeInTheDocument();

    act(() => {
      vi.advanceTimersByTime(1000);
    });
    expect(screen.getByText("1s")).toBeInTheDocument();

    act(() => {
      vi.advanceTimersByTime(154_000);
    });
    expect(screen.getByText("2m 35s")).toBeInTheDocument();

    vi.useRealTimers();
  });

  it("supports slower shared tick cadences", () => {
    vi.setSystemTime(new Date("2026-02-16T12:00:00.000Z"));

    render(
      <UptimeDisplay startedAt="2026-02-16T11:59:55.000Z" tickMs={10_000} className="text-test" />
    );
    expect(screen.getByText("5s")).toBeInTheDocument();

    act(() => {
      vi.advanceTimersByTime(9_000);
    });
    expect(screen.getByText("5s")).toBeInTheDocument();

    act(() => {
      vi.advanceTimersByTime(1_000);
    });
    expect(screen.getByText("15s")).toBeInTheDocument();
  });
});
