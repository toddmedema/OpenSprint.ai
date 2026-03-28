import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { RenderedDiffView } from "./RenderedDiffView";

describe("RenderedDiffView", () => {
  describe("pure additions", () => {
    it("renders added block with green styling", () => {
      const from = "# Title";
      const to = "# Title\n\nNew paragraph.";
      render(<RenderedDiffView fromContent={from} toContent={to} />);
      const rendered = screen.getByTestId("diff-view-rendered");
      const addedBlocks = rendered.querySelectorAll('[data-diff-status="added"]');
      expect(addedBlocks.length).toBeGreaterThan(0);
      expect(addedBlocks[0].textContent).toContain("New paragraph");
      expect(addedBlocks[0]).toHaveAttribute("aria-label", "Added block");
    });
  });

  describe("pure removals", () => {
    it("renders removed block with red styling and strikethrough", () => {
      const from = "# Title\n\nOld paragraph.";
      const to = "# Title";
      render(<RenderedDiffView fromContent={from} toContent={to} />);
      const rendered = screen.getByTestId("diff-view-rendered");
      const removedBlocks = rendered.querySelectorAll('[data-diff-status="removed"]');
      expect(removedBlocks.length).toBeGreaterThan(0);
      expect(removedBlocks[0].textContent).toContain("Old paragraph");
      expect(removedBlocks[0]).toHaveAttribute("aria-label", "Removed block");
      expect(removedBlocks[0].className).toContain("line-through");
    });
  });

  describe("word-level changes in paragraph", () => {
    it("renders modified block with word-level ins/del elements", () => {
      const from = "The quick brown fox.";
      const to = "The slow brown fox.";
      render(<RenderedDiffView fromContent={from} toContent={to} />);
      const rendered = screen.getByTestId("diff-view-rendered");
      const modifiedBlocks = rendered.querySelectorAll('[data-diff-status="modified"]');
      expect(modifiedBlocks.length).toBe(1);

      const ins = modifiedBlocks[0].querySelectorAll("ins");
      const del = modifiedBlocks[0].querySelectorAll("del");
      expect(ins.length).toBeGreaterThan(0);
      expect(del.length).toBeGreaterThan(0);
    });

    it("marks added words with data-diff-word=added", () => {
      const from = "Hello world.";
      const to = "Hello universe.";
      render(<RenderedDiffView fromContent={from} toContent={to} />);
      const rendered = screen.getByTestId("diff-view-rendered");
      const addedWords = rendered.querySelectorAll('[data-diff-word="added"]');
      expect(addedWords.length).toBeGreaterThan(0);
      const addedText = Array.from(addedWords).map((el) => el.textContent).join("");
      expect(addedText).toContain("universe");
    });

    it("marks removed words with data-diff-word=removed", () => {
      const from = "Hello world.";
      const to = "Hello universe.";
      render(<RenderedDiffView fromContent={from} toContent={to} />);
      const rendered = screen.getByTestId("diff-view-rendered");
      const removedWords = rendered.querySelectorAll('[data-diff-word="removed"]');
      expect(removedWords.length).toBeGreaterThan(0);
      const removedText = Array.from(removedWords).map((el) => el.textContent).join("");
      expect(removedText).toContain("world");
    });
  });

  describe("code block diff", () => {
    it("renders added code block", () => {
      const from = "# Intro";
      const to = "# Intro\n\n```js\nconsole.log('hi');\n```";
      render(<RenderedDiffView fromContent={from} toContent={to} />);
      const rendered = screen.getByTestId("diff-view-rendered");
      const addedBlocks = rendered.querySelectorAll('[data-diff-status="added"]');
      expect(addedBlocks.length).toBe(1);
    });

    it("renders removed code block", () => {
      const from = "# Intro\n\n```js\nconsole.log('hi');\n```";
      const to = "# Intro";
      render(<RenderedDiffView fromContent={from} toContent={to} />);
      const rendered = screen.getByTestId("diff-view-rendered");
      const removedBlocks = rendered.querySelectorAll('[data-diff-status="removed"]');
      expect(removedBlocks.length).toBe(1);
    });
  });

  describe("list diff", () => {
    it("renders added list", () => {
      const from = "# Title";
      const to = "# Title\n\n- item one\n- item two";
      render(<RenderedDiffView fromContent={from} toContent={to} />);
      const rendered = screen.getByTestId("diff-view-rendered");
      const addedBlocks = rendered.querySelectorAll('[data-diff-status="added"]');
      expect(addedBlocks.length).toBe(1);
      expect(addedBlocks[0].textContent).toContain("item one");
    });

    it("renders modified list with word-level diff", () => {
      const from = "- alpha\n- beta";
      const to = "- alpha\n- gamma";
      render(<RenderedDiffView fromContent={from} toContent={to} />);
      const rendered = screen.getByTestId("diff-view-rendered");
      const modifiedBlocks = rendered.querySelectorAll('[data-diff-status="modified"]');
      expect(modifiedBlocks.length).toBe(1);
      const ins = modifiedBlocks[0].querySelectorAll("ins");
      expect(ins.length).toBeGreaterThan(0);
    });
  });

  describe("no changes", () => {
    it("renders no-changes message for identical content", () => {
      render(<RenderedDiffView fromContent="" toContent="" />);
      expect(screen.getByTestId("diff-view-no-changes")).toBeInTheDocument();
    });
  });

  describe("unchanged content", () => {
    it("renders unchanged blocks without diff styling", () => {
      const content = "# Title\n\nParagraph.";
      render(<RenderedDiffView fromContent={content} toContent={content} />);
      const rendered = screen.getByTestId("diff-view-rendered");
      const unchanged = rendered.querySelectorAll('[data-diff-status="unchanged"]');
      expect(unchanged.length).toBe(2);
    });
  });

  describe("accessibility", () => {
    it("unchanged blocks have group role and aria-label", () => {
      const content = "# Title\n\nParagraph text.";
      render(<RenderedDiffView fromContent={content} toContent={content} />);
      const rendered = screen.getByTestId("diff-view-rendered");
      const unchanged = rendered.querySelectorAll('[data-diff-status="unchanged"]');
      expect(unchanged.length).toBeGreaterThan(0);
      expect(unchanged[0]).toHaveAttribute("role", "group");
      expect(unchanged[0]).toHaveAttribute("aria-label", "Unchanged block");
    });

    it("modified blocks have group role and aria-label", () => {
      const from = "The quick brown fox jumps over the lazy dog.";
      const to = "The slow brown fox leaps over the lazy dog.";
      render(<RenderedDiffView fromContent={from} toContent={to} />);
      const rendered = screen.getByTestId("diff-view-rendered");
      const modifiedBlocks = rendered.querySelectorAll('[data-diff-status="modified"]');
      expect(modifiedBlocks.length).toBeGreaterThan(0);
      expect(modifiedBlocks[0]).toHaveAttribute("role", "group");
      expect(modifiedBlocks[0]).toHaveAttribute("aria-label", "Modified block");
    });
  });

  describe("onParseError callback", () => {
    it("does not call onParseError for valid markdown", () => {
      const onParseError = vi.fn();
      render(
        <RenderedDiffView
          fromContent="# Title"
          toContent="# Title\n\nNew."
          onParseError={onParseError}
        />,
      );
      expect(onParseError).not.toHaveBeenCalled();
    });
  });

  describe("large fixture performance", () => {
    it("renders ~300 line markdown diff within reasonable time", () => {
      const lines: string[] = [];
      for (let i = 0; i < 50; i++) {
        lines.push(`## Section ${i}`);
        lines.push("");
        lines.push(`Content for section ${i}.`);
        lines.push("");
        lines.push(`- item ${i}a`);
        lines.push(`- item ${i}b`);
        lines.push("");
      }
      const from = lines.join("\n");
      const toLines = [...lines];
      toLines[2] = "Content for section 0, now modified.";
      toLines.push("## Extra Section\n\nAdded at end.");
      const to = toLines.join("\n");

      const start = performance.now();
      render(<RenderedDiffView fromContent={from} toContent={to} />);
      const elapsed = performance.now() - start;

      expect(screen.getByTestId("diff-view-rendered")).toBeInTheDocument();
      expect(elapsed).toBeLessThan(5000);
    });
  });
});
