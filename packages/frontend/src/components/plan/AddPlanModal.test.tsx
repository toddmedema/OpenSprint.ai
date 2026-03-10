import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { AddPlanModal } from "./AddPlanModal";

describe("AddPlanModal", () => {
  it("calls onClose when Escape key is pressed", () => {
    const onClose = vi.fn();
    const onGenerate = vi.fn();
    render(<AddPlanModal onGenerate={onGenerate} onClose={onClose} />);

    const dialog = screen.getByRole("dialog", { name: /add plan/i });
    fireEvent.keyDown(dialog, { key: "Escape" });

    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("calls onClose when overlay (backdrop) is clicked", () => {
    const onClose = vi.fn();
    const onGenerate = vi.fn();
    render(<AddPlanModal onGenerate={onGenerate} onClose={onClose} />);

    const overlay = document.querySelector(".bg-theme-overlay");
    expect(overlay).toBeTruthy();
    fireEvent.click(overlay!);

    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("calls onClose when close button is clicked", () => {
    const onClose = vi.fn();
    const onGenerate = vi.fn();
    render(<AddPlanModal onGenerate={onGenerate} onClose={onClose} />);

    const closeButton = screen.getByRole("button", { name: /close add plan modal/i });
    fireEvent.click(closeButton);

    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("calls onGenerate with trimmed description when Generate Plan is clicked with non-empty input", () => {
    const onClose = vi.fn();
    const onGenerate = vi.fn();
    render(<AddPlanModal onGenerate={onGenerate} onClose={onClose} />);

    const input = screen.getByTestId("feature-description-input");
    fireEvent.change(input, { target: { value: "  Add dark mode  " } });

    const generateButton = screen.getByTestId("generate-plan-button");
    fireEvent.click(generateButton);

    expect(onGenerate).toHaveBeenCalledWith("Add dark mode");
    expect(onGenerate).toHaveBeenCalledTimes(1);
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("does not call onGenerate when Generate Plan is clicked with empty input", () => {
    const onClose = vi.fn();
    const onGenerate = vi.fn();
    render(<AddPlanModal onGenerate={onGenerate} onClose={onClose} />);

    const generateButton = screen.getByTestId("generate-plan-button");
    expect(generateButton).toBeDisabled();
    fireEvent.click(generateButton);

    expect(onGenerate).not.toHaveBeenCalled();
    expect(onClose).not.toHaveBeenCalled();
  });
});
