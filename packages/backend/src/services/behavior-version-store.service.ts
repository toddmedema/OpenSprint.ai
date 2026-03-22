/**
 * Persists promoted behavior version records and the active promoted pointer per project.
 * Execute-session replay metadata reads the active version and template id from this store
 * (not from selfImprovementLastCommitSha or plan version numbers).
 */

import { taskStore } from "./task-store.service.js";
import { BehaviorVersionStore } from "./behavior-version-store.core.js";

export { BehaviorVersionStore } from "./behavior-version-store.core.js";

/** Run store mutations under the task store write lock (same transaction as other task DB writes). */
export async function runBehaviorVersionStoreWrite<T>(fn: (store: BehaviorVersionStore) => Promise<T>): Promise<T> {
  return taskStore.runWrite(async (client) => {
    const scoped = new BehaviorVersionStore(() => client);
    return fn(scoped);
  });
}

/** Resolve active behavior + template for Execute under the write lock (may insert sync rows). */
export async function resolveActiveBehaviorForExecute(
  projectId: string,
  activeBehaviorVersionId: string | undefined,
  promotedVersions?: Array<{ id: string; promotedAt: string }>
): Promise<{ behaviorVersionId: string; templateVersionId?: string } | null> {
  return taskStore.runWrite(async (client) => {
    const scoped = new BehaviorVersionStore(() => client);
    return scoped.resolveActiveForExecute(projectId, activeBehaviorVersionId, promotedVersions);
  });
}

/** Active promoted behavior for replay metadata — reads {@link BehaviorVersionStore} only. */
export async function readActivePromotedForExecuteReplay(
  projectId: string
): Promise<{ behaviorVersionId: string; templateVersionId?: string } | null> {
  const client = await taskStore.getDb();
  const scoped = new BehaviorVersionStore(() => client);
  return scoped.readActivePromotedReplayBinding(projectId);
}
