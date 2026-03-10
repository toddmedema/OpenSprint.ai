import { describe, it, expect } from "vitest";
import { parsePlanContent, serializePlanContent, getPlanOverview } from "./planContentUtils";

describe("planContentUtils", () => {
  describe("parsePlanContent", () => {
    it("extracts title and body from markdown with # heading", () => {
      const content =
        "# Plan Phase - Feature Decomposition\n\n## Overview\n\nImplement the Plan phase.";
      const { title, body } = parsePlanContent(content);
      expect(title).toBe("Plan Phase - Feature Decomposition");
      expect(body).toBe("## Overview\n\nImplement the Plan phase.");
    });

    it("handles empty content", () => {
      const { title, body } = parsePlanContent("");
      expect(title).toBe("");
      expect(body).toBe("");
    });

    it("handles content without heading", () => {
      const content = "Just plain text\n\nMore text";
      const { title, body } = parsePlanContent(content);
      expect(title).toBe("Just plain text");
      expect(body).toBe("More text");
    });

    it("treats ## heading as section header, not plan title (returns empty title)", () => {
      const content = "## Overview\n\nBody";
      const { title, body } = parsePlanContent(content);
      expect(title).toBe("");
      expect(body).toBe("## Overview\n\nBody");
    });

    it("treats ### heading as section header, not plan title", () => {
      const content = "### Subsection\n\nBody";
      const { title, body } = parsePlanContent(content);
      expect(title).toBe("");
      expect(body).toBe("### Subsection\n\nBody");
    });

    it("trims leading whitespace from body (avoids spurious blank space in sidebar)", () => {
      const content = "# Title\n\n\n\n## Overview\n\nBody content";
      const { title, body } = parsePlanContent(content);
      expect(title).toBe("Title");
      expect(body).toBe("## Overview\n\nBody content");
      expect(body.startsWith("\n")).toBe(false);
    });

    it("trims leading newlines from source content (plan files with leading blank lines)", () => {
      const content = "\n\n# My Plan\n\n## Overview\n\nBody";
      const { title, body } = parsePlanContent(content);
      expect(title).toBe("My Plan");
      expect(body).toBe("## Overview\n\nBody");
      expect(body.startsWith("\n")).toBe(false);
    });
  });

  describe("getPlanOverview", () => {
    it("returns empty string when plan has no body", () => {
      expect(getPlanOverview("")).toBe("");
      expect(getPlanOverview("# Plan")).toBe("");
    });

    it("returns first two sentences of body when all tasks done", () => {
      const content = "# My Plan\n\nAdd login. Deploy to prod. Then monitor.";
      expect(getPlanOverview(content)).toBe("Add login. Deploy to prod.");
    });

    it("strips leading ## headers and returns prose", () => {
      const content = "# Plan\n\n## Steps\nDo the thing.";
      expect(getPlanOverview(content)).toBe("Do the thing.");
    });

    it("returns single sentence when body has only one", () => {
      const content = "# Plan\n\nOnly one sentence here";
      expect(getPlanOverview(content)).toBe("Only one sentence here");
    });
  });

  describe("serializePlanContent", () => {
    it("combines title and body", () => {
      const result = serializePlanContent("My Plan", "## Overview\n\nContent");
      expect(result).toBe("# My Plan\n\n## Overview\n\nContent");
    });

    it("handles empty title", () => {
      const result = serializePlanContent("", "Body only");
      expect(result).toBe("Body only");
    });

    it("handles empty body", () => {
      const result = serializePlanContent("Title Only", "");
      expect(result).toBe("# Title Only");
    });

    it("handles both empty", () => {
      const result = serializePlanContent("", "");
      expect(result).toBe("");
    });
  });
});
