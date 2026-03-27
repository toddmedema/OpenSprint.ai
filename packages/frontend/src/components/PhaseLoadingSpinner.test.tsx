import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { PhaseLoadingSpinner } from "./PhaseLoadingSpinner";

describe("PhaseLoadingSpinner", () => {
  it("renders with role status and aria-label", () => {
    render(<PhaseLoadingSpinner aria-label="Loading plans" />);
    const spinner = screen.getByRole("status", { name: "Loading plans" });
    expect(spinner).toBeInTheDocument();
  });

  it("uses a left-aligned circular spinner (animate-spin) beside status text", () => {
    render(<PhaseLoadingSpinner data-testid="spinner" />);
    const row = screen.getByTestId("spinner");
    const spin = row.querySelector(".animate-spin.rounded-full");
    expect(spin).toBeTruthy();
    expect(row).toHaveClass("flex-row");
  });

  it("accepts custom data-testid", () => {
    render(<PhaseLoadingSpinner data-testid="custom-spinner" />);
    expect(screen.getByTestId("custom-spinner")).toBeInTheDocument();
  });

  it("shows default status text to the right of the spinner", () => {
    render(<PhaseLoadingSpinner data-testid="spinner" />);
    expect(screen.getByTestId("spinner-status")).toHaveTextContent("Loading…");
  });

  it("shows custom status when provided", () => {
    render(<PhaseLoadingSpinner data-testid="spinner" status="Loading plans…" />);
    expect(screen.getByTestId("spinner-status")).toHaveTextContent("Loading plans…");
  });

  it("hides status when status is empty string", () => {
    render(<PhaseLoadingSpinner data-testid="spinner" status="" />);
    expect(screen.queryByTestId("spinner-status")).not.toBeInTheDocument();
  });
});
