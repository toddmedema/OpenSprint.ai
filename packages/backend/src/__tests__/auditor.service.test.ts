import { describe, it, expect } from "vitest";
import { buildAuditorPrompt, parseAuditorResult } from "../services/auditor.service.js";

describe("auditor.service", () => {
  describe("buildAuditorPrompt", () => {
    it("includes plan_id and epic_id in prompt", () => {
      const prompt = buildAuditorPrompt("auth-plan", "bd-abc123");
      expect(prompt).toContain("auth-plan");
      expect(prompt).toContain("bd-abc123");
      expect(prompt).toContain("file_tree.txt");
      expect(prompt).toContain("key_files");
      expect(prompt).toContain("completed_tasks.json");
    });
  });

  describe("parseAuditorResult", () => {
    it("parses success with capability_summary", () => {
      const content = '{"status":"success","capability_summary":"## Features\\n- Auth implemented"}';
      const result = parseAuditorResult(content);
      expect(result).toEqual({
        status: "success",
        capability_summary: "## Features\n- Auth implemented",
      });
    });

    it("parses success from markdown code block", () => {
      const content = '```json\n{"status":"success","capability_summary":"# Summary"}\n```';
      const result = parseAuditorResult(content);
      expect(result).toEqual({ status: "success", capability_summary: "# Summary" });
    });

    it("returns null for invalid JSON", () => {
      expect(parseAuditorResult("not json")).toBeNull();
      expect(parseAuditorResult("{}")).toBeNull();
    });

    it("parses failed status", () => {
      const result = parseAuditorResult('{"status":"failed"}');
      expect(result).toEqual({ status: "failed" });
    });

    it("returns null when success but missing capability_summary", () => {
      const result = parseAuditorResult('{"status":"success"}');
      expect(result).toBeNull();
    });
  });
});
