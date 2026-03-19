import fs from "fs/promises";
import os from "os";
import path from "path";
import { ensureRepoHasInitialCommit } from "../utils/git-repo-state.js";
import { getGitNoHooksPath } from "../utils/git-no-hooks.js";
import { createLogger } from "../utils/logger.js";
import { shellExec as shellExecDefault } from "../utils/shell-exec.js";
import { BranchManager } from "./branch-manager.js";

const log = createLogger("validation-workspace");

export type ValidationWorkspaceKind = "baseline" | "merged_candidate";

export interface ValidationWorkspaceHandle {
  kind: ValidationWorkspaceKind;
  worktreePath: string;
  branchName: string | null;
  cleanup(): Promise<void>;
}

interface ValidationWorkspaceServiceDeps {
  shellExec?: typeof shellExecDefault;
  branchManager?: BranchManager;
}

function slugifyForGitRef(value: string): string {
  return (
    value
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9._/-]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 60) || "workspace"
  );
}

export class ValidationWorkspaceService {
  private shellExec: typeof shellExecDefault;
  private branchManager: BranchManager;

  constructor(deps: ValidationWorkspaceServiceDeps = {}) {
    this.shellExec = deps.shellExec ?? shellExecDefault;
    this.branchManager = deps.branchManager ?? new BranchManager();
  }

  private async createWorkspaceBaseDir(kind: ValidationWorkspaceKind): Promise<string> {
    const baseDir = path.join(os.tmpdir(), "opensprint-validation");
    await fs.mkdir(baseDir, { recursive: true });
    return fs.mkdtemp(path.join(baseDir, `${kind}-`));
  }

  private async cleanupWorktree(
    repoPath: string,
    worktreePath: string,
    branchName: string | null
  ): Promise<void> {
    try {
      await this.shellExec(`git worktree remove '${worktreePath.replace(/'/g, `'\\''`)}' --force`, {
        cwd: repoPath,
        timeout: 30_000,
      });
    } catch (err) {
      log.warn("Failed to remove validation worktree via git; falling back to fs cleanup", {
        worktreePath,
        err: err instanceof Error ? err.message : String(err),
      });
    }
    await fs.rm(path.dirname(worktreePath), { recursive: true, force: true }).catch(() => {});
    if (branchName) {
      await this.shellExec(`git branch -D ${branchName}`, {
        cwd: repoPath,
        timeout: 30_000,
      }).catch(() => {});
    }
  }

  async createBaselineWorkspace(
    repoPath: string,
    baseBranch: string
  ): Promise<ValidationWorkspaceHandle> {
    await ensureRepoHasInitialCommit(repoPath, baseBranch);
    const baseDir = await this.createWorkspaceBaseDir("baseline");
    const worktreePath = path.join(baseDir, "workspace");
    const noHooks = getGitNoHooksPath();
    await this.shellExec(
      `git -c core.hooksPath="${noHooks}" worktree add --detach '${worktreePath.replace(/'/g, `'\\''`)}' ${baseBranch}`,
      {
        cwd: repoPath,
        timeout: 30_000,
      }
    );
    await this.branchManager.symlinkNodeModules(repoPath, worktreePath);

    return {
      kind: "baseline",
      worktreePath,
      branchName: null,
      cleanup: async () => {
        await this.cleanupWorktree(repoPath, worktreePath, null);
      },
    };
  }

  async createMergeCandidateWorkspace(
    repoPath: string,
    taskId: string,
    baseBranch: string
  ): Promise<ValidationWorkspaceHandle> {
    await ensureRepoHasInitialCommit(repoPath, baseBranch);
    const baseDir = await this.createWorkspaceBaseDir("merged_candidate");
    const worktreePath = path.join(baseDir, "workspace");
    const branchName = `opensprint/validation/${slugifyForGitRef(taskId)}-${Date.now().toString(36)}`;
    const noHooks = getGitNoHooksPath();
    await this.shellExec(
      `git -c core.hooksPath="${noHooks}" worktree add -b ${branchName} '${worktreePath.replace(/'/g, `'\\''`)}' ${baseBranch}`,
      {
        cwd: repoPath,
        timeout: 30_000,
      }
    );
    await this.branchManager.symlinkNodeModules(repoPath, worktreePath);

    return {
      kind: "merged_candidate",
      worktreePath,
      branchName,
      cleanup: async () => {
        await this.cleanupWorktree(repoPath, worktreePath, branchName);
      },
    };
  }
}

export const validationWorkspaceService = new ValidationWorkspaceService();
