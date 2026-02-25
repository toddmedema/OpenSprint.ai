/**
 * Persistent event log for orchestrator operations.
 *
 * Provides an audit trail for debugging multi-attempt failures and richer
 * crash recovery intelligence. Events are stored in the SQL DB (orchestrator_events table).
 */

import crypto from "crypto";
import { createLogger } from "../utils/logger.js";
import { taskStore } from "./task-store.service.js";
import { ProjectService } from "./project.service.js";

const log = createLogger("event-log");
const projectService = new ProjectService();

async function repoPathToProjectId(repoPath: string): Promise<string> {
  const project = await projectService.getProjectByRepoPath(repoPath);
  if (project) return project.id;
  return "repo:" + crypto.createHash("sha256").update(repoPath).digest("hex").slice(0, 12);
}

export interface OrchestratorEvent {
  timestamp: string;
  projectId: string;
  taskId: string;
  event: string;
  data?: Record<string, unknown>;
}

export class EventLogService {
  async append(repoPath: string, event: OrchestratorEvent): Promise<void> {
    const projectId = await repoPathToProjectId(repoPath);
    try {
      await taskStore.runWrite(async (db) => {
        db.run(
          `INSERT INTO orchestrator_events (project_id, task_id, timestamp, event, data)
           VALUES (?, ?, ?, ?, ?)`,
          [
            projectId,
            event.taskId,
            event.timestamp,
            event.event,
            event.data ? JSON.stringify(event.data) : null,
          ]
        );
      });
    } catch (err) {
      log.warn("Failed to append event", { err });
    }
  }

  async readSince(repoPath: string, since: string): Promise<OrchestratorEvent[]> {
    const projectId = await repoPathToProjectId(repoPath);
    const db = await taskStore.getDb();
    const stmt = db.prepare(
      "SELECT task_id, timestamp, event, data FROM orchestrator_events WHERE project_id = ? AND timestamp >= ? ORDER BY id ASC"
    );
    stmt.bind([projectId, since]);
    const events = hydrateEvents(stmt, projectId);
    stmt.free();
    return events;
  }

  async readForTask(repoPath: string, taskId: string): Promise<OrchestratorEvent[]> {
    const projectId = await repoPathToProjectId(repoPath);
    const db = await taskStore.getDb();
    const stmt = db.prepare(
      "SELECT task_id, timestamp, event, data FROM orchestrator_events WHERE project_id = ? AND task_id = ? ORDER BY id ASC"
    );
    stmt.bind([projectId, taskId]);
    const events = hydrateEvents(stmt, projectId);
    stmt.free();
    return events;
  }

  async readRecent(repoPath: string, count = 50): Promise<OrchestratorEvent[]> {
    const projectId = await repoPathToProjectId(repoPath);
    const db = await taskStore.getDb();
    const stmt = db.prepare(
      "SELECT task_id, timestamp, event, data FROM orchestrator_events WHERE project_id = ? ORDER BY id DESC LIMIT ?"
    );
    stmt.bind([projectId, count]);
    const events = hydrateEvents(stmt, projectId);
    stmt.free();
    return events.reverse();
  }
}

function hydrateEvents(
  stmt: { step: () => boolean; getAsObject: () => Record<string, unknown> },
  projectId: string
): OrchestratorEvent[] {
  const out: OrchestratorEvent[] = [];
  while (stmt.step()) {
    const r = stmt.getAsObject();
    out.push({
      timestamp: r.timestamp as string,
      projectId,
      taskId: r.task_id as string,
      event: r.event as string,
      data: r.data ? (JSON.parse(r.data as string) as Record<string, unknown>) : undefined,
    });
  }
  return out;
}

export const eventLogService = new EventLogService();
