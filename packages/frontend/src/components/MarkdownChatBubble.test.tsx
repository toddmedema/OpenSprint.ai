import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { MarkdownChatBubble } from "./MarkdownChatBubble";

describe("MarkdownChatBubble", () => {
  it("renders bold text", () => {
    render(<MarkdownChatBubble content="Hello **world**" />);
    const strong = screen.getByText("world");
    expect(strong.tagName).toBe("STRONG");
  });

  it("renders italic text", () => {
    render(<MarkdownChatBubble content="Hello *world*" />);
    const em = screen.getByText("world");
    expect(em.tagName).toBe("EM");
  });

  it("renders inline code", () => {
    render(<MarkdownChatBubble content="Run `npm install`" />);
    const code = screen.getByText("npm install");
    expect(code.tagName).toBe("CODE");
  });

  it("renders code blocks", () => {
    const md = "```js\nconsole.log('hi');\n```";
    const { container } = render(<MarkdownChatBubble content={md} />);
    const pre = container.querySelector("pre");
    expect(pre).not.toBeNull();
    expect(pre?.textContent).toContain("console.log('hi');");
  });

  it("renders unordered lists", () => {
    const md = "- one\n- two\n- three";
    const { container } = render(<MarkdownChatBubble content={md} />);
    const items = container.querySelectorAll("li");
    expect(items).toHaveLength(3);
  });

  it("renders ordered lists", () => {
    const md = "1. first\n2. second";
    const { container } = render(<MarkdownChatBubble content={md} />);
    const ol = container.querySelector("ol");
    expect(ol).not.toBeNull();
    expect(container.querySelectorAll("li")).toHaveLength(2);
  });

  it("renders headings", () => {
    render(<MarkdownChatBubble content="## Heading Two" />);
    const h2 = screen.getByRole("heading", { level: 2 });
    expect(h2).toBeDefined();
    expect(h2.textContent).toBe("Heading Two");
  });

  it("renders links", () => {
    render(<MarkdownChatBubble content="[click](https://example.com)" />);
    const link = screen.getByRole("link");
    expect(link).toBeDefined();
    expect(link.getAttribute("href")).toBe("https://example.com");
  });

  it("renders GFM tables", () => {
    const md = "| A | B |\n|---|---|\n| 1 | 2 |";
    const { container } = render(<MarkdownChatBubble content={md} />);
    const table = container.querySelector("table");
    expect(table).not.toBeNull();
    expect(container.querySelectorAll("td")).toHaveLength(2);
  });

  it("sanitizes script tags (XSS prevention)", () => {
    const md = 'Safe text\n\n<script>alert("xss")</script>';
    const { container } = render(<MarkdownChatBubble content={md} />);
    expect(container.querySelector("script")).toBeNull();
    expect(container.textContent).toContain("Safe text");
  });

  it("sanitizes onclick attributes (XSS prevention)", () => {
    const md = '<div onclick="alert(1)">Click me</div>';
    const { container } = render(<MarkdownChatBubble content={md} />);
    const div = container.querySelector("[onclick]");
    expect(div).toBeNull();
  });

  it("wraps content in prose-chat-bubble class", () => {
    const { container } = render(<MarkdownChatBubble content="hello" />);
    const wrapper = container.firstElementChild;
    expect(wrapper?.classList.contains("prose-chat-bubble")).toBe(true);
  });

  it("renders plain text without errors", () => {
    const { container } = render(<MarkdownChatBubble content="just plain text" />);
    expect(container.textContent).toBe("just plain text");
  });
});
