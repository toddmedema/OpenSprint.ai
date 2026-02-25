import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { HelpModal } from "./HelpModal";

describe("HelpModal", () => {
  it("renders Help modal with both tabs, Ask a Question default", () => {
    render(<HelpModal onClose={vi.fn()} />);

    expect(screen.getByRole("dialog", { name: /help/i })).toBeInTheDocument();
    expect(screen.getByText("Help")).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: "Ask a Question" })).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: "Meet your Team" })).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: "Ask a Question" })).toHaveAttribute(
      "aria-selected",
      "true"
    );
    expect(screen.getByText(/Ask about your projects/)).toBeInTheDocument();
  });

  it("switches to Meet your Team tab and shows agent grid", async () => {
    const user = userEvent.setup();
    render(<HelpModal onClose={vi.fn()} />);

    await user.click(screen.getByRole("tab", { name: "Meet your Team" }));

    expect(screen.getByRole("tab", { name: "Meet your Team" })).toHaveAttribute(
      "aria-selected",
      "true"
    );
    expect(screen.getByText("Dreamer")).toBeInTheDocument();
    expect(screen.getByText("Planner")).toBeInTheDocument();
    expect(screen.getByText("Sketch")).toBeInTheDocument();
    expect(screen.getAllByRole("listitem")).toHaveLength(9);
  });

  it("Meet your Team tab shows agent roles and phases", async () => {
    const user = userEvent.setup();
    render(<HelpModal onClose={vi.fn()} />);

    await user.click(screen.getByRole("tab", { name: "Meet your Team" }));

    expect(screen.getByText("Dreamer")).toBeInTheDocument();
    expect(screen.getByText("Harmonizer")).toBeInTheDocument();
    expect(screen.getByText("Analyst")).toBeInTheDocument();
    expect(screen.getByText("Sketch")).toBeInTheDocument();
    expect(screen.getAllByText("Plan").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Execute").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Evaluate").length).toBeGreaterThan(0);
  });

  it("shows project context in Ask a Question when project provided", () => {
    render(
      <HelpModal
        onClose={vi.fn()}
        project={{ id: "proj-1", name: "My Project" }}
      />
    );

    expect(screen.getByText(/Ask about My Project/)).toBeInTheDocument();
  });

  it("calls onClose when close button is clicked", async () => {
    const onClose = vi.fn();
    const user = userEvent.setup();
    render(<HelpModal onClose={onClose} />);

    await user.click(screen.getByRole("button", { name: /close help/i }));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("calls onClose when backdrop is clicked", () => {
    const onClose = vi.fn();
    render(<HelpModal onClose={onClose} />);

    const backdrop = screen.getByTestId("help-modal-backdrop");
    fireEvent.click(backdrop);
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("calls onClose when Escape key is pressed", () => {
    const onClose = vi.fn();
    render(<HelpModal onClose={onClose} />);

    const dialog = screen.getByRole("dialog", { name: /help/i });
    fireEvent.keyDown(dialog, { key: "Escape" });
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("is accessible with aria attributes", () => {
    render(<HelpModal onClose={vi.fn()} />);

    const dialog = screen.getByRole("dialog", { name: /help/i });
    expect(dialog).toHaveAttribute("aria-modal", "true");
    expect(dialog).toHaveAttribute("aria-labelledby", "help-modal-title");
  });
});
