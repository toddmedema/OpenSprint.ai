/**
 * Failure collector for the self-improvement audit flow.
 *
 * Queries orchestrator events and blocked tasks whose timestamps fall after
 * the last completed self-improvement run, classifies each failure, and
 * returns structured records the audit agent can use as input context.
 */

import type { OrchestratorEvent } from "./event-log.service.js";
import { eventLogService } from "./event-log.service.js";
import { taskStore } from "./task-store.service.js";
import type { StoredTask } from "./task-store.types.js";
import { getCumulativeAttemptsFromIssue } from "./task-store-helpers.js";
import { createLogger } from "../utils/logger.js";

const log = createLogger("self-improvement-failure-collector");

/**
 * High-level failure category used by the self-improvement audit.
 * - execution: coding agent failed (test, crash, timeout, no result)
 * - merge: merge conflict or merge-to-main failure
 * - quality_gate: quality-gate command failure during merge validation
 * - environment: repo preflight or environment setup failure
 */
export type AgentFailureType = "execution" | "merge" | "quality_gate" | "environment";

export interface CollectedFailure {
  taskId: string;
  failureType: AgentFailureType;
  /** The raw failure type string from the event/task (e.g. "test_failure", "merge_conflict"). */
  rawFailureType?: string;
  failedCommand?: string;
  errorSnippet?: string;
  attemptCount: number;
  /** How the failure was ultimately resolved: blocked, requeued, closed, or still open. */
  finalDisposition: "blocked" | "requeued" | "closed" | "open";
  timestamp: string;
}

const FAILURE_EVENTS = new Set([
  "task.failed",
  "task.blocked",
  "merge.failed",
  "task.requeued",
]);

/**
 * Map raw failure-type strings (from FailureType union or event data) to
 * the coarser AgentFailureType categories.
 */
export function classifyFailureType(raw: string | undefined | null): AgentFailureType {
  if (!raw) return "execution";
  switch (raw) {
    case "merge_conflict":
      return "merge";
    case "merge_quality_gate":
    case "quality_gate":
      return "quality_gate";
    case "repo_preflight":
    case "environment_setup":
      return "environment";
    case "test_failure":
    case "review_rejection":
    case "agent_crash":
    case "timeout":
    case "no_result":
    case "coding_failure":
      return "execution";
    default:
      return "execution";
  }
}

/**
 * Resolve the final disposition for a task.
 * If the task is still in the store we use its current status;
 * otherwise fall back to the event that reported the failure.
 */
function resolveDisposition(
  eventName: string,
  task: StoredTask | undefined,
): CollectedFailure["finalDisposition"] {
  if (task) {
    const s = (task.status as string) ?? "open";
    if (s === "blocked") return "blocked";
    if (s === "closed") return "closed";
    if (s === "open") return "requeued";
    return "open";
  }
  if (eventName === "task.blocked") return "blocked";
  if (eventName === "task.requeued") return "requeued";
  return "open";
}

function extractErrorSnippet(data: Record<string, unknown> | undefined): string | undefined {
  if (!data) return undefined;
  const snippet =
    (data.failedGateOutputSnippet as string) ??
    (data.firstErrorLine as string) ??
    (data.summary as string) ??
    (data.reason as string);
  if (!snippet) return undefined;
  const trimmed = snippet.trim();
  if (trimmed.length <= 500) return trimmed;
  return `${trimmed.slice(0, 497)}...`;
}

function extractFailedCommand(data: Record<string, unknown> | undefined): string | undefined {
  if (!data) return undefined;
  return (data.failedGateCommand as string) ?? undefined;
}

/**
 * Collect agent failures since a given timestamp for a project.
 *
 * @param projectId - project to query
 * @param sinceIso - ISO timestamp of the last self-improvement run (inclusive).
 *                   Pass undefined or empty string to collect all-time failures.
 * @returns Array of structured failure records, empty when no failures found.
 */
export async function collectFailuresSince(
  projectId: string,
  sinceIso: string | undefined,
): Promise<CollectedFailure[]> {
  const since = sinceIso?.trim() || "1970-01-01T00:00:00.000Z";

  let events: OrchestratorEvent[];
  try {
    events = await eventLogService.readSinceByProjectId(projectId, since);
  } catch (err) {
    log.warn("Failed to read orchestrator events for failure collection", {
      projectId,
      since,
      err: err instanceof Error ? err.message : String(err),
    });
    return [];
  }

  const failureEvents = events.filter((e) => FAILURE_EVENTS.has(e.event));
  if (failureEvents.length === 0) return [];

  const taskIds = [...new Set(failureEvents.map((e) => e.taskId).filter(Boolean))];
  const taskMap = new Map<string, StoredTask>();
  if (taskIds.length > 0) {
    try {
      const allTasks = await taskStore.listAll(projectId);
      for (const t of allTasks) {
        taskMap.set(t.id, t);
      }
    } catch (err) {
      log.warn("Failed to load tasks for failure collection", {
        projectId,
        err: err instanceof Error ? err.message : String(err),
      });
    }
  }

  const seen = new Map<string, CollectedFailure>();

  for (const evt of failureEvents) {
    const taskId = evt.taskId;
    if (!taskId) continue;

    const data = evt.data;
    const rawType = (data?.failureType as string) ?? undefined;
    const failureType = classifyFailureType(rawType);
    const task = taskMap.get(taskId);
    const attemptCount =
      (data?.attempt as number) ??
      (data?.cumulativeAttempts as number) ??
      (task ? getCumulativeAttemptsFromIssue(task) : 0);

    const failure: CollectedFailure = {
      taskId,
      failureType,
      ...(rawType && { rawFailureType: rawType }),
      failedCommand: extractFailedCommand(data),
      errorSnippet: extractErrorSnippet(data),
      attemptCount,
      finalDisposition: resolveDisposition(evt.event, task),
      timestamp: evt.timestamp,
    };

    const existing = seen.get(taskId);
    if (!existing || evt.timestamp > existing.timestamp) {
      seen.set(taskId, failure);
    }
  }

  return [...seen.values()];
}

/**
 * Format collected failures into a text block suitable for inclusion
 * in the self-improvement audit agent prompt.
 */
export function formatFailuresForPrompt(failures: CollectedFailure[]): string {
  if (failures.length === 0) return "";

  const lines: string[] = [
    `## Agent Failures Since Last Self-Improvement Run (${failures.length} total)`,
    "",
  ];

  for (const f of failures) {
    lines.push(`### Task ${f.taskId}`);
    lines.push(`- **Failure type:** ${f.failureType}${f.rawFailureType ? ` (${f.rawFailureType})` : ""}`);
    lines.push(`- **Attempts:** ${f.attemptCount}`);
    lines.push(`- **Disposition:** ${f.finalDisposition}`);
    if (f.failedCommand) {
      lines.push(`- **Failed command:** \`${f.failedCommand}\``);
    }
    if (f.errorSnippet) {
      lines.push(`- **Error snippet:**`);
      lines.push("```");
      lines.push(f.errorSnippet);
      lines.push("```");
    }
    lines.push("");
  }

  return lines.join("\n");
}
