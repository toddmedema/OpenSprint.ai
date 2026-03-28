import { describe, it, expect } from "vitest";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { DiffView, INITIAL_LINE_CAP } from "./DiffView";
import type { DiffResult } from "./DiffView";

const sampleDiff: DiffResult = {
  lines: [
    { type: "context", text: "unchanged line", oldLineNumber: 1, newLineNumber: 1 },
    { type: "remove", text: "old line", oldLineNumber: 2 },
    { type: "add", text: "new line", newLineNumber: 2 },
    { type: "context", text: "another unchanged", oldLineNumber: 3, newLineNumber: 3 },
  ],
  summary: { additions: 1, deletions: 1 },
};

describe("DiffView", () => {
  describe("raw mode rendering", () => {
    it("renders context rows correctly", () => {
      render(<DiffView diff={sampleDiff} />);
      const items = within(screen.getByRole("textbox", { name: "Diff lines" })).getAllByRole(
        "listitem",
      );
      const contextRow = items[0];
      expect(contextRow).toHaveAttribute("data-line-type", "context");
      expect(contextRow).toHaveTextContent("unchanged line");
    });

    it("renders add rows with + marker", () => {
      render(<DiffView diff={sampleDiff} />);
      const items = within(screen.getByRole("textbox", { name: "Diff lines" })).getAllByRole(
        "listitem",
      );
      const addRow = items[2];
      expect(addRow).toHaveAttribute("data-line-type", "add");
      expect(addRow).toHaveTextContent("new line");
      expect(screen.getByTestId("line-marker-2")).toHaveTextContent("+");
    });

    it("renders remove rows with - marker", () => {
      render(<DiffView diff={sampleDiff} />);
      const items = within(screen.getByRole("textbox", { name: "Diff lines" })).getAllByRole(
        "listitem",
      );
      const removeRow = items[1];
      expect(removeRow).toHaveAttribute("data-line-type", "remove");
      expect(removeRow).toHaveTextContent("old line");
      expect(screen.getByTestId("line-marker-1")).toHaveTextContent("-");
    });

    it("renders context rows with space marker", () => {
      render(<DiffView diff={sampleDiff} />);
      const marker = screen.getByTestId("line-marker-0");
      expect(marker.textContent).toBe(" ");
    });

    it("renders old and new line number columns", () => {
      render(<DiffView diff={sampleDiff} />);
      expect(screen.getByTestId("line-old-0")).toHaveTextContent("1");
      expect(screen.getByTestId("line-new-0")).toHaveTextContent("1");
      expect(screen.getByTestId("line-old-1")).toHaveTextContent("2");
      expect(screen.getByTestId("line-new-1")).toHaveTextContent("");
      expect(screen.getByTestId("line-old-2")).toHaveTextContent("");
      expect(screen.getByTestId("line-new-2")).toHaveTextContent("2");
    });

    it("shows No changes when lines array is empty", () => {
      render(<DiffView diff={{ lines: [] }} />);
      expect(screen.getByTestId("diff-view-no-changes")).toHaveTextContent("No changes");
    });

    it("shows summary when provided", () => {
      render(<DiffView diff={sampleDiff} />);
      expect(screen.getByTestId("diff-view-summary")).toHaveTextContent("+1 −1");
    });

    it("omits summary when not provided", () => {
      render(<DiffView diff={{ lines: sampleDiff.lines }} />);
      expect(screen.queryByTestId("diff-view-summary")).not.toBeInTheDocument();
    });
  });

  describe("aria labels", () => {
    it("applies correct aria labels for each line type", () => {
      render(<DiffView diff={sampleDiff} />);
      const items = within(screen.getByRole("textbox", { name: "Diff lines" })).getAllByRole(
        "listitem",
      );
      expect(items[0]).toHaveAttribute("aria-label", expect.stringContaining("Context line"));
      expect(items[1]).toHaveAttribute("aria-label", expect.stringContaining("Removed line"));
      expect(items[2]).toHaveAttribute("aria-label", expect.stringContaining("Added line"));
      expect(items[3]).toHaveAttribute("aria-label", expect.stringContaining("Context line"));
    });

    it("truncates long text in aria label", () => {
      const longLine = "x".repeat(100);
      const diff: DiffResult = {
        lines: [{ type: "add", text: longLine, newLineNumber: 1 }],
      };
      render(<DiffView diff={diff} />);
      const item = within(screen.getByRole("textbox", { name: "Diff lines" })).getByRole(
        "listitem",
      );
      const label = item.getAttribute("aria-label") ?? "";
      expect(label.endsWith("…")).toBe(true);
      expect(label.length).toBeLessThan(longLine.length + 20);
    });
  });

  describe("keyboard navigation", () => {
    it("focuses first line on ArrowDown", async () => {
      const user = userEvent.setup();
      render(<DiffView diff={sampleDiff} />);
      const container = screen.getByRole("textbox", { name: "Diff lines" });
      container.focus();
      await user.keyboard("{ArrowDown}");
      const items = within(container).getAllByRole("listitem");
      expect(items[0]).toHaveFocus();
    });

    it("navigates with ArrowDown and ArrowUp", async () => {
      const user = userEvent.setup();
      render(<DiffView diff={sampleDiff} />);
      const container = screen.getByRole("textbox", { name: "Diff lines" });
      container.focus();
      await user.keyboard("{ArrowDown}");
      await user.keyboard("{ArrowDown}");
      const items = within(container).getAllByRole("listitem");
      expect(items[1]).toHaveFocus();
      await user.keyboard("{ArrowUp}");
      expect(items[0]).toHaveFocus();
    });

    it("Home jumps to first line, End to last", async () => {
      const user = userEvent.setup();
      render(<DiffView diff={sampleDiff} />);
      const container = screen.getByRole("textbox", { name: "Diff lines" });
      container.focus();
      await user.keyboard("{End}");
      const items = within(container).getAllByRole("listitem");
      expect(items[items.length - 1]).toHaveFocus();
      await user.keyboard("{Home}");
      expect(items[0]).toHaveFocus();
    });

    it("does not go past boundaries", async () => {
      const user = userEvent.setup();
      render(<DiffView diff={sampleDiff} />);
      const container = screen.getByRole("textbox", { name: "Diff lines" });
      container.focus();
      await user.keyboard("{ArrowDown}");
      await user.keyboard("{ArrowUp}");
      await user.keyboard("{ArrowUp}");
      const items = within(container).getAllByRole("listitem");
      expect(items[0]).toHaveFocus();
    });
  });

  describe("toggle container", () => {
    it("renders toggle bar with Rendered and Raw buttons", () => {
      render(<DiffView diff={sampleDiff} />);
      expect(screen.getByTestId("diff-view-toggle-bar")).toBeInTheDocument();
      expect(screen.getByRole("radio", { name: "Rendered" })).toBeInTheDocument();
      expect(screen.getByRole("radio", { name: "Raw" })).toBeInTheDocument();
    });

    it("defaults to raw mode", () => {
      render(<DiffView diff={sampleDiff} />);
      expect(screen.getByRole("radio", { name: "Raw" })).toHaveAttribute(
        "aria-checked",
        "true",
      );
      expect(screen.getByRole("radio", { name: "Rendered" })).toHaveAttribute(
        "aria-checked",
        "false",
      );
      expect(screen.getByTestId("diff-view-raw")).toBeInTheDocument();
    });

    it("switches to rendered placeholder on toggle", async () => {
      const user = userEvent.setup();
      render(<DiffView diff={sampleDiff} />);
      await user.click(screen.getByRole("radio", { name: "Rendered" }));
      expect(screen.getByTestId("diff-view-rendered-placeholder")).toBeInTheDocument();
      expect(screen.queryByTestId("diff-view-raw")).not.toBeInTheDocument();
      expect(screen.getByRole("radio", { name: "Rendered" })).toHaveAttribute(
        "aria-checked",
        "true",
      );
    });

    it("switches back to raw on toggle", async () => {
      const user = userEvent.setup();
      render(<DiffView diff={sampleDiff} />);
      await user.click(screen.getByRole("radio", { name: "Rendered" }));
      await user.click(screen.getByRole("radio", { name: "Raw" }));
      expect(screen.getByTestId("diff-view-raw")).toBeInTheDocument();
      expect(screen.queryByTestId("diff-view-rendered-placeholder")).not.toBeInTheDocument();
    });

    it("toggle buttons are keyboard-focusable", () => {
      render(<DiffView diff={sampleDiff} />);
      const rendered = screen.getByRole("radio", { name: "Rendered" });
      const raw = screen.getByRole("radio", { name: "Raw" });
      rendered.focus();
      expect(rendered).toHaveFocus();
      raw.focus();
      expect(raw).toHaveFocus();
    });

    it("radiogroup has correct aria-label", () => {
      render(<DiffView diff={sampleDiff} />);
      expect(screen.getByRole("radiogroup", { name: "Diff view mode" })).toBeInTheDocument();
    });

    it("respects defaultMode prop", () => {
      render(<DiffView diff={sampleDiff} defaultMode="rendered" />);
      expect(screen.getByTestId("diff-view-rendered-placeholder")).toBeInTheDocument();
      expect(screen.getByRole("radio", { name: "Rendered" })).toHaveAttribute(
        "aria-checked",
        "true",
      );
    });
  });

  describe("large diff capping", () => {
    const manyLines = Array.from({ length: INITIAL_LINE_CAP + 20 }, (_, i) => ({
      type: "context" as const,
      text: `Line ${i + 1}`,
      oldLineNumber: i + 1,
      newLineNumber: i + 1,
    }));

    it("caps lines and shows Show more button", () => {
      render(<DiffView diff={{ lines: manyLines }} />);
      expect(screen.getByTestId("diff-view-show-more")).toBeInTheDocument();
      expect(screen.getByText(/Show more \(20 more lines\)/)).toBeInTheDocument();
      expect(screen.getByText("Line 1")).toBeInTheDocument();
      expect(screen.getByText(`Line ${INITIAL_LINE_CAP}`)).toBeInTheDocument();
      expect(screen.queryByText(`Line ${INITIAL_LINE_CAP + 1}`)).not.toBeInTheDocument();
    });

    it("expands all lines on Show more click", async () => {
      const user = userEvent.setup();
      render(<DiffView diff={{ lines: manyLines }} />);
      await user.click(screen.getByTestId("diff-view-show-more"));
      expect(screen.queryByTestId("diff-view-show-more")).not.toBeInTheDocument();
      expect(screen.getByText(`Line ${INITIAL_LINE_CAP + 20}`)).toBeInTheDocument();
    });

    it("does not show Show more for small diffs", () => {
      render(<DiffView diff={sampleDiff} />);
      expect(screen.queryByTestId("diff-view-show-more")).not.toBeInTheDocument();
    });
  });

  describe("edge cases", () => {
    it("renders empty text lines with non-breaking space", () => {
      const diff: DiffResult = {
        lines: [{ type: "context", text: "", oldLineNumber: 1, newLineNumber: 1 }],
      };
      render(<DiffView diff={diff} />);
      const items = within(screen.getByRole("textbox", { name: "Diff lines" })).getAllByRole(
        "listitem",
      );
      expect(items[0].textContent).toContain("\u00a0");
    });

    it("accepts fromContent and toContent props without error", () => {
      render(
        <DiffView
          diff={sampleDiff}
          fromContent="old content"
          toContent="new content"
        />,
      );
      expect(screen.getByTestId("diff-view")).toBeInTheDocument();
    });
  });

  describe("rendered mode integration", () => {
    it("shows rendered diff when toggled with fromContent and toContent", async () => {
      const user = userEvent.setup();
      render(
        <DiffView
          diff={sampleDiff}
          fromContent="# Title\n\nOld paragraph."
          toContent="# Title\n\nNew paragraph."
        />,
      );
      await user.click(screen.getByRole("radio", { name: "Rendered" }));
      expect(screen.getByTestId("diff-view-rendered")).toBeInTheDocument();
      expect(screen.queryByTestId("diff-view-raw")).not.toBeInTheDocument();
    });

    it("shows placeholder when rendered mode lacks fromContent/toContent", async () => {
      const user = userEvent.setup();
      render(<DiffView diff={sampleDiff} />);
      await user.click(screen.getByRole("radio", { name: "Rendered" }));
      expect(screen.getByTestId("diff-view-rendered-placeholder")).toBeInTheDocument();
    });

    it("switches between rendered and raw modes", async () => {
      const user = userEvent.setup();
      render(
        <DiffView
          diff={sampleDiff}
          fromContent="# Title"
          toContent="# Title\n\nAdded."
        />,
      );
      await user.click(screen.getByRole("radio", { name: "Rendered" }));
      expect(screen.getByTestId("diff-view-rendered")).toBeInTheDocument();
      await user.click(screen.getByRole("radio", { name: "Raw" }));
      expect(screen.getByTestId("diff-view-raw")).toBeInTheDocument();
    });
  });
});
