import { describe, it, expect } from "vitest";
import {
  truncateTitle,
  formatClosedCommitMessage,
  parseClosedCommitMessage,
  TITLE_MAX_LEN,
} from "../commit-message.js";

describe("commit-message utils", () => {
  describe("truncateTitle", () => {
    it("returns title unchanged when within limit", () => {
      expect(truncateTitle("Short title")).toBe("Short title");
    });

    it("returns title unchanged when exactly at limit", () => {
      const exact = "A".repeat(TITLE_MAX_LEN);
      expect(truncateTitle(exact)).toBe(exact);
    });

    it("truncates at word boundary with ellipsis", () => {
      const title = "Add agent heartbeat monitoring and reporting";
      const result = truncateTitle(title);
      expect(result).toBe("Add agent heartbeat monitoring\u2026");
      expect(result.length).toBeLessThanOrEqual(31);
    });

    it("hard-cuts when no word boundary found before limit", () => {
      const title = "Aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaabbbb";
      const result = truncateTitle(title);
      expect(result).toBe("Aaaaaaaaaaaaaaaaaaaaaaaaaaaaaa\u2026");
      expect(result.length).toBe(31);
    });

    it("respects custom maxLen", () => {
      expect(truncateTitle("Hello world of testing", 10)).toBe("Hello\u2026");
    });

    it("handles empty string", () => {
      expect(truncateTitle("")).toBe("");
    });
  });

  describe("formatClosedCommitMessage", () => {
    it("matches squash commit spec: Closed [task ID]: [task name ~30 chars]", () => {
      const msg = formatClosedCommitMessage(
        "opensprint.dev-81r.6",
        "Use descriptive squash commit format"
      );
      expect(msg).toMatch(/^Closed opensprint\.dev-81r\.6: /);
      const titlePart = msg.replace(/^Closed [^:]+: /, "");
      expect(titlePart.length).toBeLessThanOrEqual(31); // ~30 chars + ellipsis
      expect(msg).toContain("Use descriptive squash");
    });

    it("includes task ID and title", () => {
      expect(formatClosedCommitMessage("opensprint.dev-abc.1", "Add login")).toBe(
        "Closed opensprint.dev-abc.1: Add login"
      );
    });

    it("truncates long titles to ~30 chars", () => {
      const msg = formatClosedCommitMessage(
        "opensprint.dev-zar.3",
        "Add agent heartbeat monitoring and reporting"
      );
      expect(msg).toBe("Closed opensprint.dev-zar.3: Add agent heartbeat monitoring\u2026");
      expect(msg).not.toContain("and reporting");
    });

    it("preserves short titles exactly", () => {
      expect(formatClosedCommitMessage("bd-x.1", "Fix typo")).toBe("Closed bd-x.1: Fix typo");
    });

    it("format matches spec: Closed [task ID]: [task name ~30 chars]", () => {
      const taskId = "opensprint.dev-81r.6";
      const longTitle = "Use descriptive squash commit format when landing";
      const msg = formatClosedCommitMessage(taskId, longTitle);
      expect(msg).toMatch(/^Closed [^:]+: .+$/);
      const [, id, title] = msg.match(/^Closed ([^:]+): (.+)$/)!;
      expect(id).toBe(taskId);
      expect(title.length).toBeLessThanOrEqual(31);
      expect(msg.startsWith("Closed ")).toBe(true);
    });
  });

  describe("parseClosedCommitMessage", () => {
    it("parses valid Closed format", () => {
      const result = parseClosedCommitMessage("Closed opensprint.dev-abc.1: Add feature");
      expect(result).toEqual({ taskId: "opensprint.dev-abc.1", title: "Add feature" });
    });

    it("parses Closed format with long title", () => {
      const result = parseClosedCommitMessage(
        "Closed opensprint.dev-xyz.99: This is a very long task title that exceeds thirty chars"
      );
      expect(result).toEqual({
        taskId: "opensprint.dev-xyz.99",
        title: "This is a very long task title that exceeds thirty chars",
      });
    });

    it("returns null for non-matching messages", () => {
      expect(parseClosedCommitMessage("beads: closed")).toBeNull();
      expect(parseClosedCommitMessage("prd: updated")).toBeNull();
      expect(parseClosedCommitMessage("Closed opensprint.dev-abc.1")).toBeNull();
      expect(parseClosedCommitMessage("")).toBeNull();
    });

    it("trims whitespace", () => {
      const result = parseClosedCommitMessage("  Closed bd-x.1: Fix typo  ");
      expect(result).toEqual({ taskId: "bd-x.1", title: "Fix typo" });
    });
  });
});
