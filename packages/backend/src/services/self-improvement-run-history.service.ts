/**
 * Self-improvement run history — persists each completed self-improvement run
 * for GET /projects/:id/self-improvement/history.
 */

import type { DbClient } from "../db/client.js";
import { toPgParams } from "../db/sql-params.js";

export type SelfImprovementRunStatus = "success" | "skipped" | "failed";

export type SelfImprovementRunMode = "audit_only" | "audit_and_experiments";

export type SelfImprovementRunOutcome =
  | "no_changes"
  | "tasks_created"
  | "candidate_rejected"
  | "promotion_pending"
  | "promoted"
  | "failed";

export interface SelfImprovementRunHistoryRecord {
  id: number;
  projectId: string;
  runId: string;
  timestamp: string;
  status: SelfImprovementRunStatus;
  tasksCreatedCount: number;
  mode: SelfImprovementRunMode;
  outcome: SelfImprovementRunOutcome;
  summary: string;
  promotedVersionId?: string;
  pendingCandidateId?: string;
}

export interface SelfImprovementRunHistoryInsert {
  projectId: string;
  runId: string;
  completedAt: string;
  status: SelfImprovementRunStatus;
  tasksCreatedCount: number;
  mode: SelfImprovementRunMode;
  outcome: SelfImprovementRunOutcome;
  summary: string;
  promotedVersionId?: string | null;
  pendingCandidateId?: string | null;
}

const DEFAULT_LIMIT = 50;

export class SelfImprovementRunHistoryStore {
  constructor(private getClient: () => DbClient) {}

  async insert(record: SelfImprovementRunHistoryInsert): Promise<SelfImprovementRunHistoryRecord> {
    const client = this.getClient();
    const row = await client.queryOne(
      toPgParams(
        `INSERT INTO self_improvement_runs (
           project_id, run_id, completed_at, status, tasks_created_count,
           run_mode, outcome, summary, promoted_version_id, pending_candidate_id
         )
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
         RETURNING id, project_id, run_id, completed_at, status, tasks_created_count,
           run_mode, outcome, summary, promoted_version_id, pending_candidate_id`
      ),
      [
        record.projectId,
        record.runId,
        record.completedAt,
        record.status,
        record.tasksCreatedCount,
        record.mode,
        record.outcome,
        record.summary,
        record.promotedVersionId ?? null,
        record.pendingCandidateId ?? null,
      ]
    );
    return rowToRecord(row as Record<string, unknown>);
  }

  async listByProjectId(
    projectId: string,
    limit: number = DEFAULT_LIMIT
  ): Promise<SelfImprovementRunHistoryRecord[]> {
    const client = this.getClient();
    const rows = await client.query(
      toPgParams(
        `SELECT id, project_id, run_id, completed_at, status, tasks_created_count,
                run_mode, outcome, summary, promoted_version_id, pending_candidate_id
         FROM self_improvement_runs
         WHERE project_id = ?
         ORDER BY completed_at DESC
         LIMIT ?`
      ),
      [projectId, limit]
    );
    return rows.map((r) => rowToRecord(r as Record<string, unknown>));
  }
}

function rowToRecord(row: Record<string, unknown>): SelfImprovementRunHistoryRecord {
  const promoted = row.promoted_version_id as string | null | undefined;
  const pending = row.pending_candidate_id as string | null | undefined;
  return {
    id: row.id as number,
    projectId: row.project_id as string,
    runId: row.run_id as string,
    timestamp: row.completed_at as string,
    status: row.status as SelfImprovementRunStatus,
    tasksCreatedCount: (row.tasks_created_count as number) ?? 0,
    mode: (row.run_mode as SelfImprovementRunMode) ?? "audit_only",
    outcome: (row.outcome as SelfImprovementRunOutcome) ?? "no_changes",
    summary: (row.summary as string) ?? "",
    ...(promoted != null && promoted !== "" ? { promotedVersionId: promoted } : {}),
    ...(pending != null && pending !== "" ? { pendingCandidateId: pending } : {}),
  };
}
