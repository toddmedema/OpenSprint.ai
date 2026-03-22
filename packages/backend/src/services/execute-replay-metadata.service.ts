/**
 * Optional replay metadata for Execute assignments: base branch SHA plus active promoted behavior
 * and template ids read from {@link BehaviorVersionStore} (not project settings or last audit SHA).
 */

import type { ProjectSettings } from "@opensprint/shared";
import { getCommitShaAtBranchTip } from "../utils/git-repo-state.js";
import { readActivePromotedForExecuteReplay } from "./behavior-version-store.service.js";

export interface ExecuteReplayMetadata {
  baseCommitSha: string;
  behaviorVersionId?: string;
  templateVersionId?: string;
}

function experimentsEnabled(settings: ProjectSettings): boolean {
  return settings.runAgentEnhancementExperiments === true;
}

/**
 * Resolve replay metadata for a new coding/review assignment, or null when behavior versioning is not active.
 */
export async function resolveExecuteReplayMetadata(
  projectId: string,
  settings: ProjectSettings,
  repoPath: string,
  baseBranch: string
): Promise<ExecuteReplayMetadata | null> {
  const storeBinding = await readActivePromotedForExecuteReplay(projectId);
  const experiments = experimentsEnabled(settings);
  if (!experiments && !storeBinding) {
    return null;
  }

  const baseCommitSha = await getCommitShaAtBranchTip(repoPath, baseBranch);
  if (!baseCommitSha) {
    return null;
  }

  if (!storeBinding) {
    return { baseCommitSha };
  }

  return {
    baseCommitSha,
    behaviorVersionId: storeBinding.behaviorVersionId,
    ...(storeBinding.templateVersionId && { templateVersionId: storeBinding.templateVersionId }),
  };
}
