import { describe, it, expect } from "vitest";
import { render } from "@testing-library/react";
import { TaskStatusBadge, COLUMN_LABELS } from "./TaskStatusBadge";

describe("TaskStatusBadge", () => {
  it("renders waiting_to_merge as a dot with COLUMN_LABELS title", () => {
    const { container } = render(<TaskStatusBadge column="waiting_to_merge" />);

    const dot = container.querySelector("span.rounded-full");
    expect(dot).toBeInTheDocument();
    expect(dot).toHaveClass("bg-theme-status-in-review");
    expect(dot).not.toHaveClass("bg-theme-status-ready");
    expect(dot).toHaveAttribute("title", COLUMN_LABELS.waiting_to_merge);
    expect(COLUMN_LABELS.waiting_to_merge).toBe("Waiting to Merge");
  });

  it("uses custom title when provided for waiting_to_merge", () => {
    const { container } = render(
      <TaskStatusBadge column="waiting_to_merge" title="Custom label" />
    );

    const dot = container.querySelector("span.rounded-full");
    expect(dot).toHaveAttribute("title", "Custom label");
  });
});
