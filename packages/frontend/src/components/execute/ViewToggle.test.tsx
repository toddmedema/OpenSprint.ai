import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ViewToggle } from "./ViewToggle";

const KanbanIcon = (
  <svg data-testid="kanban-icon" viewBox="0 0 16 16" aria-hidden>
    <rect x="2" y="2" width="5" height="5" />
    <rect x="9" y="2" width="5" height="5" />
    <rect x="2" y="9" width="5" height="5" />
    <rect x="9" y="9" width="5" height="5" />
  </svg>
);

const TimelineIcon = (
  <svg data-testid="timeline-icon" viewBox="0 0 16 16" aria-hidden>
    <rect x="2" y="2" width="12" height="2" />
    <rect x="2" y="7" width="12" height="2" />
    <rect x="2" y="12" width="12" height="2" />
  </svg>
);

const options = [
  { value: "kanban" as const, icon: KanbanIcon, label: "Kanban" },
  { value: "timeline" as const, icon: TimelineIcon, label: "Timeline" },
];

describe("ViewToggle", () => {
  it("renders all options", () => {
    const onChange = vi.fn();
    render(<ViewToggle options={options} value="kanban" onChange={onChange} />);

    expect(screen.getByTestId("view-toggle")).toBeInTheDocument();
    expect(screen.getByTestId("view-toggle-kanban")).toBeInTheDocument();
    expect(screen.getByTestId("view-toggle-timeline")).toBeInTheDocument();
    expect(screen.getByRole("radiogroup", { name: "View mode" })).toBeInTheDocument();
  });

  it("active option has aria-checked=true and active styling class", () => {
    render(<ViewToggle options={options} value="kanban" onChange={vi.fn()} />);

    const kanbanBtn = screen.getByTestId("view-toggle-kanban");
    const timelineBtn = screen.getByTestId("view-toggle-timeline");

    expect(kanbanBtn).toHaveAttribute("aria-checked", "true");
    expect(timelineBtn).toHaveAttribute("aria-checked", "false");

    expect(kanbanBtn).toHaveClass("bg-theme-surface", "shadow-sm", "ring-1", "ring-theme-border");
    expect(timelineBtn).not.toHaveClass("bg-theme-surface");
  });

  it("click on inactive calls onChange with correct value", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<ViewToggle options={options} value="kanban" onChange={onChange} />);

    await user.click(screen.getByTestId("view-toggle-timeline"));

    expect(onChange).toHaveBeenCalledTimes(1);
    expect(onChange).toHaveBeenCalledWith("timeline");
  });

  it("Arrow key navigation wraps and calls onChange", () => {
    const onChange = vi.fn();
    const { rerender } = render(
      <ViewToggle options={options} value="kanban" onChange={onChange} />
    );

    const container = screen.getByTestId("view-toggle");
    container.focus();

    fireEvent.keyDown(container, { key: "ArrowRight" });
    expect(onChange).toHaveBeenCalledWith("timeline");

    onChange.mockClear();
    rerender(<ViewToggle options={options} value="timeline" onChange={onChange} />);
    fireEvent.keyDown(container, { key: "ArrowRight" });
    expect(onChange).toHaveBeenCalledWith("kanban");

    onChange.mockClear();
    rerender(<ViewToggle options={options} value="kanban" onChange={onChange} />);
    fireEvent.keyDown(container, { key: "ArrowLeft" });
    expect(onChange).toHaveBeenCalledWith("timeline");

    onChange.mockClear();
    rerender(<ViewToggle options={options} value="timeline" onChange={onChange} />);
    fireEvent.keyDown(container, { key: "ArrowLeft" });
    expect(onChange).toHaveBeenCalledWith("kanban");
  });

  it("has data-testid on container and each button", () => {
    render(<ViewToggle options={options} value="kanban" onChange={vi.fn()} />);

    expect(screen.getByTestId("view-toggle")).toBeInTheDocument();
    expect(screen.getByTestId("view-toggle-kanban")).toBeInTheDocument();
    expect(screen.getByTestId("view-toggle-timeline")).toBeInTheDocument();
  });
});
