import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, act } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { KeyboardShortcutTooltip } from "./KeyboardShortcutTooltip";

const originalNavigator = global.navigator;

function renderWithPlatform(platform: "Win32" | "MacIntel", userAgent?: string) {
  vi.stubGlobal("navigator", {
    ...originalNavigator,
    platform,
    userAgent:
      userAgent ??
      (platform === "Win32"
        ? "Mozilla/5.0 (Windows NT 10.0)"
        : "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)"),
  });
  return render(
    <KeyboardShortcutTooltip>
      <button type="button">Submit</button>
    </KeyboardShortcutTooltip>
  );
}

describe("KeyboardShortcutTooltip", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.stubGlobal("navigator", { ...originalNavigator });
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.stubGlobal("navigator", originalNavigator);
  });

  it("does not show tooltip before hover delay", () => {
    renderWithPlatform("Win32");

    const wrapper = screen.getByRole("button", { name: "Submit" }).parentElement!;
    fireEvent.mouseEnter(wrapper);

    expect(screen.queryByRole("tooltip")).not.toBeInTheDocument();

    act(() => {
      vi.advanceTimersByTime(200);
    });
    expect(screen.queryByRole("tooltip")).not.toBeInTheDocument();
  });

  it("shows Enter or Ctrl + Enter tooltip after hover delay on Windows", () => {
    renderWithPlatform("Win32");

    const wrapper = screen.getByRole("button", { name: "Submit" }).parentElement!;
    fireEvent.mouseEnter(wrapper);
    act(() => {
      vi.advanceTimersByTime(300);
    });

    const tooltip = screen.getByRole("tooltip");
    expect(tooltip).toBeInTheDocument();
    expect(tooltip).toHaveTextContent("Enter or Ctrl + Enter to submit");
    expect(tooltip).toHaveTextContent("Shift+Enter for new line");
  });

  it("shows Enter or Cmd + Enter tooltip after hover delay on macOS", () => {
    renderWithPlatform("MacIntel");

    const wrapper = screen.getByRole("button", { name: "Submit" }).parentElement!;
    fireEvent.mouseEnter(wrapper);
    act(() => {
      vi.advanceTimersByTime(300);
    });

    const tooltip = screen.getByRole("tooltip");
    expect(tooltip).toBeInTheDocument();
    expect(tooltip).toHaveTextContent("Enter or Cmd + Enter to submit");
    expect(tooltip).toHaveTextContent("Shift+Enter for new line");
  });

  it("dismisses tooltip on mouse leave", () => {
    renderWithPlatform("Win32", "Mozilla/5.0");

    const wrapper = screen.getByRole("button", { name: "Submit" }).parentElement!;
    fireEvent.mouseEnter(wrapper);
    act(() => {
      vi.advanceTimersByTime(300);
    });
    expect(screen.getByRole("tooltip")).toBeInTheDocument();

    fireEvent.mouseLeave(wrapper);
    expect(screen.queryByRole("tooltip")).not.toBeInTheDocument();
  });

  it("does not interfere with button click", async () => {
    const onClick = vi.fn();
    vi.stubGlobal("navigator", {
      ...originalNavigator,
      platform: "Win32",
      userAgent: "Mozilla/5.0",
    });
    vi.useRealTimers();
    const user = userEvent.setup();

    render(
      <KeyboardShortcutTooltip>
        <button type="button" onClick={onClick}>
          Submit
        </button>
      </KeyboardShortcutTooltip>
    );

    const button = screen.getByRole("button", { name: "Submit" });
    await user.click(button);

    expect(onClick).toHaveBeenCalledTimes(1);
  });
});
