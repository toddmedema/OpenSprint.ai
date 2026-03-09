/**
 * Drizzle ORM schema for PostgreSQL.
 * Mirrors the tables in schema.ts. Used when dialect is postgres.
 */

import { pgTable, text, primaryKey } from "drizzle-orm/pg-core";

export const plansTable = pgTable(
  "plans",
  {
    projectId: text("project_id").notNull(),
    planId: text("plan_id").notNull(),
    epicId: text("epic_id").notNull(),
    gateTaskId: text("gate_task_id"),
    reExecuteGateTaskId: text("re_execute_gate_task_id"),
    content: text("content").notNull(),
    metadata: text("metadata").notNull(),
    shippedContent: text("shipped_content"),
    updatedAt: text("updated_at").notNull(),
  },
  (t) => [primaryKey({ columns: [t.projectId, t.planId] })]
);
