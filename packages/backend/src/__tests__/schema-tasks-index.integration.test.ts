/**
 * SQLite: verify tasks composite index exists after runSchema (real DB).
 */
import { describe, expect, it } from "vitest";
import Database from "better-sqlite3";
import { runSchema } from "../db/schema.js";

describe("tasks composite index (SQLite)", () => {
  it("creates idx_tasks_project_id_status on tasks", async () => {
    const db = new Database(":memory:");
    try {
      await runSchema(
        {
          query: async (sql: string, params: unknown[] = []) => {
            const stmt = db.prepare(sql);
            if (/^\s*SELECT\b/i.test(sql) || /^\s*PRAGMA\b/i.test(sql)) {
              return stmt.all(...params) as unknown[];
            }
            stmt.run(...params);
            return [];
          },
        },
        "sqlite"
      );
      const rows = db
        .prepare(
          `SELECT name FROM sqlite_master
           WHERE type = 'index' AND tbl_name = 'tasks' AND name = ?`
        )
        .all("idx_tasks_project_id_status") as { name: string }[];
      expect(rows).toHaveLength(1);
      expect(rows[0].name).toBe("idx_tasks_project_id_status");
    } finally {
      db.close();
    }
  });
});
