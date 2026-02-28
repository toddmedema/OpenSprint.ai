import { describe, it, expect, beforeEach, vi } from "vitest";
import { migrateComplexitySimpleToComplex } from "../services/migrate-complexity-simple-complex.js";
import type { DbClient } from "../db/client.js";
import { createTestPostgresClient } from "./test-db-helper.js";

const { testClientRef } = vi.hoisted(() => ({ testClientRef: { current: null as DbClient | null } }));
vi.mock("../services/task-store.service.js", async () => {
  const { createTestPostgresClient } = await import("./test-db-helper.js");
  const dbResult = await createTestPostgresClient();
  testClientRef.current = dbResult?.client ?? null;
  return {
    taskStore: {
      async init() {},
      async getDb() {
        if (!testClientRef.current) throw new Error("testClient not initialized");
        return testClientRef.current;
      },
      async runWrite<T>(fn: (client: DbClient) => Promise<T>): Promise<T> {
        if (!testClientRef.current) throw new Error("testClient not initialized");
        return fn(testClientRef.current);
      },
    },
    TaskStoreService: vi.fn(),
    SCHEMA_SQL: "",
    _postgresAvailable: !!dbResult,
  };
});

async function insertTask(
  client: DbClient,
  id: string,
  projectId: string,
  options?: { extra?: string; complexity?: number }
): Promise<void> {
  const now = new Date().toISOString();
  const extra = options?.extra ?? "{}";
  const complexity = options?.complexity ?? null;
  await client.execute(
    `INSERT INTO tasks (id, project_id, title, description, issue_type, status, priority, labels, created_at, updated_at, complexity, extra)
     VALUES ($1, $2, 'Task', '', 'task', 'open', 2, '[]', $3, $4, $5, $6)`,
    [id, projectId, now, now, complexity, extra]
  );
}

async function getTask(
  client: DbClient,
  id: string,
  projectId: string
): Promise<{ complexity: number | null; extra: string }> {
  const row = await client.queryOne(
    "SELECT complexity, extra FROM tasks WHERE id = $1 AND project_id = $2",
    [id, projectId]
  );
  if (!row) throw new Error(`Task ${id} not found`);
  return row as { complexity: number | null; extra: string };
}

const migrateComplexityTaskStoreMod = await import("../services/task-store.service.js");
const migrateComplexityPostgresOk = (migrateComplexityTaskStoreMod as { _postgresAvailable?: boolean })._postgresAvailable ?? false;

describe.skipIf(!migrateComplexityPostgresOk)("migrateComplexitySimpleToComplex", () => {
  beforeEach(async () => {
    if (!testClientRef.current) throw new Error("Postgres required");
    await testClientRef.current.execute("DELETE FROM task_dependencies");
    await testClientRef.current.execute("DELETE FROM tasks");
  });

  it("returns zero when no legacy complexity exists", async () => {
    await insertTask(testClientRef.current!, "os-1", "proj-1", { extra: "{}" });
    await insertTask(testClientRef.current!, "os-2", "proj-1", { extra: '{"sourceFeedbackIds":["fb-1"]}' });

    const result = await migrateComplexitySimpleToComplex();

    expect(result.migratedCount).toBe(0);
    expect(result.details).toEqual([]);
  });

  it("migrates simple to 3 and removes from extra", async () => {
    await insertTask(testClientRef.current!, "os-1", "proj-1", { extra: '{"complexity":"simple"}' });

    const result = await migrateComplexitySimpleToComplex();

    expect(result.migratedCount).toBe(1);
    expect(result.details).toEqual([{ id: "os-1", projectId: "proj-1", from: "simple", to: 3 }]);

    const row = await getTask(testClientRef.current!, "os-1", "proj-1");
    expect(row.complexity).toBe(3);
    expect(JSON.parse(row.extra)).not.toHaveProperty("complexity");
  });

  it("migrates complex to 7 and removes from extra", async () => {
    await insertTask(testClientRef.current!, "os-2", "proj-1", { extra: '{"complexity":"complex"}' });

    const result = await migrateComplexitySimpleToComplex();

    expect(result.migratedCount).toBe(1);
    expect(result.details).toEqual([{ id: "os-2", projectId: "proj-1", from: "complex", to: 7 }]);

    const row = await getTask(testClientRef.current!, "os-2", "proj-1");
    expect(row.complexity).toBe(7);
    expect(JSON.parse(row.extra)).not.toHaveProperty("complexity");
  });

  it("migrates multiple tasks across projects", async () => {
    await insertTask(testClientRef.current!, "os-a", "proj-1", { extra: '{"complexity":"simple"}' });
    await insertTask(testClientRef.current!, "os-b", "proj-1", { extra: '{"complexity":"complex"}' });
    await insertTask(testClientRef.current!, "os-c", "proj-2", { extra: '{"complexity":"simple"}' });

    const result = await migrateComplexitySimpleToComplex();

    expect(result.migratedCount).toBe(3);
    expect(result.details).toHaveLength(3);
    expect(result.details.map((d) => d.id).sort()).toEqual(["os-a", "os-b", "os-c"]);

    expect((await getTask(testClientRef.current!, "os-a", "proj-1")).complexity).toBe(3);
    expect((await getTask(testClientRef.current!, "os-b", "proj-1")).complexity).toBe(7);
    expect((await getTask(testClientRef.current!, "os-c", "proj-2")).complexity).toBe(3);
  });

  it("preserves other extra fields when removing complexity", async () => {
    await insertTask(testClientRef.current!, "os-1", "proj-1", {
      extra: '{"complexity":"simple","sourceFeedbackIds":["fb-1"],"block_reason":null}',
    });

    const result = await migrateComplexitySimpleToComplex();

    expect(result.migratedCount).toBe(1);
    const extra = JSON.parse((await getTask(testClientRef.current!, "os-1", "proj-1")).extra);
    expect(extra).toEqual({ sourceFeedbackIds: ["fb-1"], block_reason: null });
    expect(extra).not.toHaveProperty("complexity");
  });

  it("is idempotent — second run migrates nothing", async () => {
    await insertTask(testClientRef.current!, "os-1", "proj-1", { extra: '{"complexity":"simple"}' });

    const first = await migrateComplexitySimpleToComplex();
    expect(first.migratedCount).toBe(1);

    const second = await migrateComplexitySimpleToComplex();
    expect(second.migratedCount).toBe(0);
    expect(second.details).toEqual([]);
  });

  it("skips tasks with numeric or plan complexity in extra", async () => {
    await insertTask(testClientRef.current!, "os-1", "proj-1", { extra: '{"complexity":3}' });
    await insertTask(testClientRef.current!, "os-2", "proj-1", { extra: '{"complexity":"low"}' });
    await insertTask(testClientRef.current!, "os-3", "proj-1", { extra: '{"complexity":"medium"}' });

    const result = await migrateComplexitySimpleToComplex();

    expect(result.migratedCount).toBe(0);
    expect(result.details).toEqual([]);
  });
});
