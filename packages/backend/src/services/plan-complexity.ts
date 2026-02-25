import type { PlanComplexity } from "@opensprint/shared";
import {
  taskStore as taskStoreSingleton,
  type TaskStoreService,
  type StoredTask,
} from "./task-store.service.js";

const VALID_COMPLEXITIES: PlanComplexity[] = ["low", "medium", "high", "very_high"];

/**
 * Resolve the plan complexity for a task by looking up its parent epic's plan in the task store.
 * Returns undefined if no complexity is found.
 */
export async function getPlanComplexityForTask(
  projectId: string,
  _repoPath: string,
  task: StoredTask,
  taskStore?: TaskStoreService
): Promise<PlanComplexity | undefined> {
  const store = taskStore ?? taskStoreSingleton;
  const parentId = store.getParentId(task.id);
  if (!parentId) return undefined;

  try {
    const plan = await store.planGetByEpicId(projectId, parentId);
    if (!plan?.metadata?.complexity) return undefined;
    const complexity = plan.metadata.complexity as string;
    if (VALID_COMPLEXITIES.includes(complexity as PlanComplexity)) {
      return complexity as PlanComplexity;
    }
  } catch {
    // Parent or plan might not exist
  }

  return undefined;
}
