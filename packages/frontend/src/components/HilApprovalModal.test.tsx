import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { HilApprovalModal } from "./HilApprovalModal";
import type { HilRequestEvent } from "@opensprint/shared";

const mockOnRespond = vi.fn();

describe("HilApprovalModal", () => {
  it("renders basic approval modal with description and options", () => {
    const request: HilRequestEvent = {
      type: "hil.request",
      requestId: "req-1",
      category: "architectureDecisions",
      description: "Update technical architecture",
      options: [
        { id: "approve", label: "Approve", description: "Proceed" },
        { id: "reject", label: "Reject", description: "Do not proceed" },
      ],
      blocking: true,
    };

    render(<HilApprovalModal request={request} onRespond={mockOnRespond} />);

    expect(screen.getByText("Approval required: Architecture Decisions")).toBeInTheDocument();
    expect(screen.getByText("Update technical architecture")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Approve/ })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Reject/ })).toBeInTheDocument();
  });

  it("uses max-w-md for non-scope-change categories", () => {
    const request: HilRequestEvent = {
      type: "hil.request",
      requestId: "req-1",
      category: "architectureDecisions",
      description: "Update",
      options: [{ id: "approve", label: "Approve", description: "" }],
      blocking: true,
    };

    const { container } = render(<HilApprovalModal request={request} onRespond={mockOnRespond} />);
    const modal = container.querySelector(".max-w-md");
    expect(modal).toBeInTheDocument();
  });

  it("uses larger layout (max-w-3xl) for scope changes with AI summary", () => {
    const request: HilRequestEvent = {
      type: "hil.request",
      requestId: "req-1",
      category: "scopeChanges",
      description: "Scope change feedback: Add mobile support",
      options: [
        { id: "approve", label: "Approve", description: "Proceed" },
        { id: "reject", label: "Reject", description: "Do not proceed" },
      ],
      blocking: true,
      scopeChangeSummary: "• feature_list: Add mobile app\n• technical_architecture: Mobile stack",
      scopeChangeProposedUpdates: [
        { section: "feature_list", changeLogEntry: "Add mobile app" },
        { section: "technical_architecture", changeLogEntry: "Mobile stack" },
      ],
    };

    const { container } = render(<HilApprovalModal request={request} onRespond={mockOnRespond} />);

    expect(screen.getByText("Proposed PRD changes")).toBeInTheDocument();
    expect(screen.getByText(/• feature_list: Add mobile app/)).toBeInTheDocument();
    expect(screen.getByText(/• technical_architecture: Mobile stack/)).toBeInTheDocument();

    const largeModal = container.querySelector(".max-w-3xl");
    expect(largeModal).toBeInTheDocument();
  });

  it("shows proposed updates list when scopeChangeProposedUpdates provided without summary", () => {
    const request: HilRequestEvent = {
      type: "hil.request",
      requestId: "req-1",
      category: "scopeChanges",
      description: "Scope change",
      options: [{ id: "approve", label: "Approve", description: "" }],
      blocking: true,
      scopeChangeProposedUpdates: [{ section: "feature_list", changeLogEntry: "Add dark mode" }],
    };

    render(<HilApprovalModal request={request} onRespond={mockOnRespond} />);

    expect(screen.getByText("Proposed PRD changes")).toBeInTheDocument();
    expect(screen.getByText("Feature List")).toBeInTheDocument();
    expect(screen.getByText(/Add dark mode/)).toBeInTheDocument();
  });

  it("calls onRespond with approved=true when Approve is clicked", async () => {
    const user = userEvent.setup();
    const request: HilRequestEvent = {
      type: "hil.request",
      requestId: "req-1",
      category: "scopeChanges",
      description: "Scope change",
      options: [
        { id: "approve", label: "Approve", description: "Proceed" },
        { id: "reject", label: "Reject", description: "Do not proceed" },
      ],
      blocking: true,
    };

    render(<HilApprovalModal request={request} onRespond={mockOnRespond} />);

    await user.click(screen.getByRole("button", { name: /Approve/ }));
    expect(mockOnRespond).toHaveBeenCalledWith("req-1", true);
  });

  it("calls onRespond with approved=false when Reject is clicked", async () => {
    const user = userEvent.setup();
    const request: HilRequestEvent = {
      type: "hil.request",
      requestId: "req-1",
      category: "scopeChanges",
      description: "Scope change",
      options: [
        { id: "approve", label: "Approve", description: "" },
        { id: "reject", label: "Reject", description: "" },
      ],
      blocking: true,
    };

    render(<HilApprovalModal request={request} onRespond={mockOnRespond} />);

    await user.click(screen.getByRole("button", { name: /Reject/ }));
    expect(mockOnRespond).toHaveBeenCalledWith("req-1", false);
  });
});
