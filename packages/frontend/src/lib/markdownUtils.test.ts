import { describe, it, expect } from "vitest";
import { markdownToHtml, htmlToMarkdown } from "./markdownUtils";

describe("markdownUtils", () => {
  describe("markdownToHtml", () => {
    it("returns empty string for empty input", async () => {
      expect(await markdownToHtml("")).toBe("");
      expect(await markdownToHtml("   ")).toBe("");
    });

    it("converts markdown to HTML", async () => {
      const html = await markdownToHtml("**bold** and *italic*");
      expect(html).toContain("<strong>bold</strong>");
      expect(html).toContain("<em>italic</em>");
    });

    it("converts headers", async () => {
      const html = await markdownToHtml("## Header");
      expect(html).toContain("<h2");
      expect(html).toContain("Header");
    });

    it("converts lists", async () => {
      const html = await markdownToHtml("- item 1\n- item 2");
      expect(html).toContain("<ul");
      expect(html).toContain("item 1");
      expect(html).toContain("item 2");
    });
  });

  describe("htmlToMarkdown", () => {
    it("returns empty string for empty input", () => {
      expect(htmlToMarkdown("")).toBe("");
      expect(htmlToMarkdown("   ")).toBe("");
    });

    it("converts HTML to markdown", () => {
      const md = htmlToMarkdown("<p><strong>bold</strong> and <em>italic</em></p>");
      expect(md).toContain("**bold**");
      expect(md).toContain("*italic*");
    });

    it("converts headers", () => {
      const md = htmlToMarkdown("<h2>Header</h2>");
      expect(md).toContain("##");
      expect(md).toContain("Header");
    });

    it("handles contenteditable output", () => {
      const md = htmlToMarkdown("<p>Hello <b>world</b></p>");
      expect(md).toContain("Hello");
      expect(md).toContain("world");
    });
  });
});
