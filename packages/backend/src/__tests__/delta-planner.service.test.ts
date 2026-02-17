import { describe, it, expect } from "vitest";
import {
  buildDeltaPlannerPrompt,
  parseDeltaPlannerResult,
} from "../services/delta-planner.service.js";

describe("delta-planner.service", () => {
  describe("buildDeltaPlannerPrompt", () => {
    it("includes plan_id and epic_id in prompt", () => {
      const prompt = buildDeltaPlannerPrompt("auth-plan", "bd-abc123");
      expect(prompt).toContain("auth-plan");
      expect(prompt).toContain("bd-abc123");
      expect(prompt).toContain("plan_old.md");
      expect(prompt).toContain("plan_new.md");
      expect(prompt).toContain("capability_summary.md");
    });
  });

  describe("parseDeltaPlannerResult", () => {
    it("parses no_changes_needed", () => {
      const result = parseDeltaPlannerResult('{"status":"no_changes_needed"}');
      expect(result).toEqual({ status: "no_changes_needed" });
    });

    it("parses success with tasks", () => {
      const content = `{"status":"success","tasks":[
        {"index":0,"title":"Add endpoint","description":"...","priority":1,"depends_on":[]},
        {"index":1,"title":"Add tests","description":"...","priority":2,"depends_on":[0]}
      ]}`;
      const result = parseDeltaPlannerResult(content);
      expect(result?.status).toBe("success");
      expect(result?.tasks).toHaveLength(2);
      expect(result?.tasks?.[0]).toEqual({
        index: 0,
        title: "Add endpoint",
        description: "...",
        priority: 1,
        depends_on: [],
      });
      expect(result?.tasks?.[1].depends_on).toEqual([0]);
    });

    it("parses failed status", () => {
      const result = parseDeltaPlannerResult('{"status":"failed"}');
      expect(result).toEqual({ status: "failed" });
    });

    it("treats success with empty tasks as no_changes_needed", () => {
      const result = parseDeltaPlannerResult('{"status":"success","tasks":[]}');
      expect(result).toEqual({ status: "no_changes_needed" });
    });

    it("returns null for invalid content", () => {
      expect(parseDeltaPlannerResult("not json")).toBeNull();
    });

    it("clamps priority to 0-4", () => {
      const result = parseDeltaPlannerResult(
        '{"status":"success","tasks":[{"index":0,"title":"X","description":"","priority":10,"depends_on":[]}]}'
      );
      expect(result?.tasks?.[0].priority).toBe(4);
    });
  });
});
