import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { CriticalStateView } from "./CriticalStateView";

describe("CriticalStateView", () => {
  it("renders one h1 heading and primary action", () => {
    render(
      <CriticalStateView
        data-testid="test-critical-state"
        heading="Test heading"
        summary="Test summary for screen readers."
        primaryAction={<button type="button">Do something</button>}
      />
    );

    expect(screen.getByRole("heading", { level: 1, name: "Test heading" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Do something" })).toBeInTheDocument();
  });

  it("uses aria-describedby and aria-labelledby for screen readers when summary provided", () => {
    render(
      <CriticalStateView
        data-testid="test-critical-state"
        heading="Test heading"
        summary="Concise summary."
        primaryAction={<button type="button">Action</button>}
      />
    );

    const region = screen.getByTestId("test-critical-state");
    expect(region).toHaveAttribute("aria-describedby", "test-critical-summary");
    expect(region).toHaveAttribute("aria-labelledby", "test-critical-heading");
  });

  it("ensures one h1 per view for clear heading hierarchy", () => {
    const { container } = render(
      <CriticalStateView
        data-testid="test-critical-state"
        heading="Single heading"
        summary="Summary text."
        primaryAction={<button type="button">Action</button>}
      />
    );

    const h1s = container.querySelectorAll("h1");
    expect(h1s).toHaveLength(1);
    expect(h1s[0]).toHaveTextContent("Single heading");
  });

  it("omits aria-describedby when summary is not provided", () => {
    render(
      <CriticalStateView
        data-testid="test-critical-state"
        heading="Test heading"
        primaryAction={<button type="button">Action</button>}
      />
    );

    const region = screen.getByTestId("test-critical-state");
    expect(region).not.toHaveAttribute("aria-describedby");
    expect(region).toHaveAttribute("aria-labelledby", "test-critical-heading");
  });

  it("renders as main landmark when role is main", () => {
    render(
      <CriticalStateView
        data-testid="test-critical-state"
        heading="Main content"
        summary="Summary."
        primaryAction={<button type="button">Action</button>}
        role="main"
      />
    );

    expect(screen.getByRole("main")).toBeInTheDocument();
    expect(screen.getByRole("main")).toHaveAttribute("aria-labelledby", "test-critical-heading");
  });

  it("has exactly one primary action for clear scannable structure", () => {
    render(
      <CriticalStateView
        data-testid="test-critical-state"
        heading="Single action"
        summary="One primary action only."
        primaryAction={<button type="button">Do it</button>}
      />
    );

    const buttons = screen.getAllByRole("button");
    const links = screen.queryAllByRole("link");
    expect(buttons.length + links.length).toBe(1);
    expect(screen.getByRole("button", { name: "Do it" })).toBeInTheDocument();
  });
});
