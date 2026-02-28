import { describe, it, expect, beforeEach, vi } from "vitest";
import initSqlJs, { type Database } from "sql.js";
import { SCHEMA_SQL } from "../services/task-store.service.js";
import { deleteOrphanedOpenQuestions } from "../services/delete-orphaned-open-questions.js";

let testDb: Database;

vi.mock("../services/task-store.service.js", async (importOriginal) => {
  const mod = await importOriginal<typeof import("../services/task-store.service.js")>();
  return {
    ...mod,
    taskStore: {
      async init() {},
      async getDb() {
        if (!testDb) throw new Error("testDb not initialized");
        return testDb;
      },
      async runWrite<T>(fn: (db: Database) => Promise<T>): Promise<T> {
        if (!testDb) throw new Error("testDb not initialized");
        return fn(testDb);
      },
    },
  };
});

const mockProjects: Array<{ id: string; name: string; repoPath: string; createdAt: string }> = [];

vi.mock("../services/project-index.js", () => ({
  getProjects: vi.fn(async () => mockProjects),
}));

function insertOpenQuestion(
  db: Database,
  id: string,
  projectId: string,
  options?: { status?: string }
): void {
  const status = options?.status ?? "open";
  const createdAt = new Date().toISOString();
  db.run(
    `INSERT INTO open_questions (id, project_id, source, source_id, questions, status, created_at, kind)
     VALUES (?, ?, 'plan', 'plan-1', '[]', ?, ?, 'open_question')`,
    [id, projectId, status, createdAt]
  );
}

function countOpenQuestions(db: Database): number {
  const stmt = db.prepare("SELECT COUNT(*) as cnt FROM open_questions");
  stmt.step();
  const cnt = (stmt.getAsObject() as { cnt: number }).cnt;
  stmt.free();
  return cnt;
}

describe("deleteOrphanedOpenQuestions", () => {
  beforeEach(async () => {
    const SQL = await initSqlJs();
    testDb = new SQL.Database();
    testDb.run(SCHEMA_SQL);
    mockProjects.length = 0;
  });

  it("returns zero when no orphaned rows exist", async () => {
    mockProjects.push({
      id: "proj-1",
      name: "Project 1",
      repoPath: "/path/1",
      createdAt: new Date().toISOString(),
    });
    insertOpenQuestion(testDb, "oq-1", "proj-1");

    const result = await deleteOrphanedOpenQuestions();

    expect(result.deletedCount).toBe(0);
    expect(result.deletedIds).toEqual([]);
    expect(countOpenQuestions(testDb)).toBe(1);
  });

  it("deletes orphaned rows and leaves valid rows", async () => {
    mockProjects.push(
      { id: "proj-1", name: "P1", repoPath: "/p1", createdAt: new Date().toISOString() },
      { id: "proj-2", name: "P2", repoPath: "/p2", createdAt: new Date().toISOString() }
    );
    insertOpenQuestion(testDb, "oq-1", "proj-1");
    insertOpenQuestion(testDb, "oq-2", "proj-2");
    insertOpenQuestion(testDb, "oq-3", "proj-deleted");
    insertOpenQuestion(testDb, "oq-4", "proj-ghost");

    const result = await deleteOrphanedOpenQuestions();

    expect(result.deletedCount).toBe(2);
    expect(result.deletedIds).toHaveLength(2);
    expect(result.deletedIds.map((r) => r.id).sort()).toEqual(["oq-3", "oq-4"]);
    expect(result.deletedIds.map((r) => r.project_id).sort()).toEqual(["proj-deleted", "proj-ghost"]);
    expect(countOpenQuestions(testDb)).toBe(2);
  });

  it("is idempotent — second run deletes nothing", async () => {
    mockProjects.push({ id: "proj-1", name: "P1", repoPath: "/p1", createdAt: new Date().toISOString() });
    insertOpenQuestion(testDb, "oq-1", "proj-orphan");

    const first = await deleteOrphanedOpenQuestions();
    expect(first.deletedCount).toBe(1);
    expect(countOpenQuestions(testDb)).toBe(0);

    const second = await deleteOrphanedOpenQuestions();
    expect(second.deletedCount).toBe(0);
    expect(second.deletedIds).toEqual([]);
  });

  it("deletes all rows when project index is empty", async () => {
    insertOpenQuestion(testDb, "oq-1", "proj-a");
    insertOpenQuestion(testDb, "oq-2", "proj-b");

    const result = await deleteOrphanedOpenQuestions();

    expect(result.deletedCount).toBe(2);
    expect(countOpenQuestions(testDb)).toBe(0);
  });
});
