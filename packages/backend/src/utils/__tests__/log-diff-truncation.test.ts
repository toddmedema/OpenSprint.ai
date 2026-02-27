import { describe, it, expect } from "vitest";
import initSqlJs from "sql.js";
import {
  computeLogDiff95thPercentile,
  truncateToThreshold,
  DEFAULT_LOG_DIFF_THRESHOLD,
} from "../log-diff-truncation.js";
import { SCHEMA_SQL } from "../../services/task-store.service.js";

describe("log-diff-truncation", () => {
  describe("truncateToThreshold", () => {
    it("returns value unchanged when within threshold", () => {
      expect(truncateToThreshold("short", 100)).toBe("short");
    });

    it("returns value unchanged when exactly at threshold", () => {
      const s = "a".repeat(50);
      expect(truncateToThreshold(s, 50)).toBe(s);
    });

    it("truncates and appends suffix when over threshold", () => {
      const s = "a".repeat(100);
      const suffix = "\n\n... [truncated]";
      const result = truncateToThreshold(s, 50);
      expect(result).toHaveLength(50 + suffix.length);
      expect(result!.endsWith(suffix)).toBe(true);
      expect(result!.slice(0, 50)).toBe("a".repeat(50));
    });

    it("returns null for null input", () => {
      expect(truncateToThreshold(null, 100)).toBeNull();
    });

    it("returns empty string unchanged", () => {
      expect(truncateToThreshold("", 100)).toBe("");
    });

    it("returns undefined as null", () => {
      expect(truncateToThreshold(undefined, 100)).toBeNull();
    });
  });

  describe("computeLogDiff95thPercentile", () => {
    it("returns default when table is empty", async () => {
      const SQL = await initSqlJs();
      const db = new SQL.Database();
      db.run(SCHEMA_SQL);
      const threshold = computeLogDiff95thPercentile(db);
      expect(threshold).toBe(DEFAULT_LOG_DIFF_THRESHOLD);
    });

    it("returns 95th percentile from output_log and git_diff sizes", async () => {
      const SQL = await initSqlJs();
      const db = new SQL.Database();
      db.run(SCHEMA_SQL);

      // Use sizes > MIN_THRESHOLD (1024) so result is not capped
      // 10 at 2000, 10 at 5000, 5 at 3000, 5 at 8000 -> 30 values
      // Sorted: 2000*10, 3000*5, 5000*10, 8000*5
      // 95th percentile index = ceil(0.95*30)-1 = 28, value = 8000
      for (let i = 0; i < 10; i++) {
        db.run(
          `INSERT INTO agent_sessions (project_id, task_id, attempt, agent_type, agent_model, started_at, status, git_branch, output_log)
           VALUES (?, ?, ?, 'cursor', 'gpt-4', '2024-01-01', 'success', 'main', ?)`,
          ["proj", `task-${i}`, i + 1, "x".repeat(2000)]
        );
      }
      for (let i = 10; i < 20; i++) {
        db.run(
          `INSERT INTO agent_sessions (project_id, task_id, attempt, agent_type, agent_model, started_at, status, git_branch, output_log)
           VALUES (?, ?, ?, 'cursor', 'gpt-4', '2024-01-01', 'success', 'main', ?)`,
          ["proj", `task-${i}`, i + 1, "x".repeat(5000)]
        );
      }
      for (let i = 20; i < 25; i++) {
        db.run(
          `INSERT INTO agent_sessions (project_id, task_id, attempt, agent_type, agent_model, started_at, status, git_branch, git_diff)
           VALUES (?, ?, ?, 'cursor', 'gpt-4', '2024-01-01', 'success', 'main', ?)`,
          ["proj", `task-${i}`, i + 1, "y".repeat(3000)]
        );
      }
      for (let i = 25; i < 30; i++) {
        db.run(
          `INSERT INTO agent_sessions (project_id, task_id, attempt, agent_type, agent_model, started_at, status, git_branch, git_diff)
           VALUES (?, ?, ?, 'cursor', 'gpt-4', '2024-01-01', 'success', 'main', ?)`,
          ["proj", `task-${i}`, i + 1, "z".repeat(8000)]
        );
      }

      const threshold = computeLogDiff95thPercentile(db);
      // 30 values, 95th percentile index = ceil(28.5)-1 = 28, value = 8000
      expect(threshold).toBe(8000);
    });

    it("enforces minimum threshold of 1024", async () => {
      const SQL = await initSqlJs();
      const db = new SQL.Database();
      db.run(SCHEMA_SQL);

      // Insert one small entry (50 bytes) - 95th percentile would be 50, but we enforce min 1024
      db.run(
        `INSERT INTO agent_sessions (project_id, task_id, attempt, agent_type, agent_model, started_at, status, git_branch, output_log)
         VALUES ('p', 't', 1, 'cursor', 'gpt-4', '2024-01-01', 'success', 'main', ?)`,
        ["x".repeat(50)]
      );

      const threshold = computeLogDiff95thPercentile(db);
      expect(threshold).toBe(1024);
    });
  });
});
