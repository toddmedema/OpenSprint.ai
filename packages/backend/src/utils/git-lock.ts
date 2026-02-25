/**
 * Shared git index lock handling.
 * Used before any git command that touches the index (add, commit, merge, etc.)
 * to avoid "Unable to create '.git/index.lock': File exists" when another
 * process holds the lock or left a stale lock (e.g. after a crash).
 */

import fs from "fs/promises";
import path from "path";
import { createLogger } from "./logger.js";

const log = createLogger("git-lock");

/** Max time (ms) to wait for .git/index.lock to clear before removing it */
export const GIT_LOCK_TIMEOUT_MS = 15_000;
/** Polling interval (ms) when waiting for git lock to clear */
export const GIT_LOCK_POLL_MS = 500;
/** Lock older than this (ms) is considered stale and may be removed */
export const GIT_LOCK_STALE_AGE_MS = 30_000;

/**
 * Resolve the path to the index.lock file for the given repo.
 * Works for the main working tree (repoPath/.git is a directory).
 * For worktrees, repoPath/.git may be a file; we still use repoPath/.git/index.lock
 * as the conventional path (git uses the linked GIT_DIR for the actual index).
 */
function getIndexLockPath(repoPath: string): string {
  return path.join(repoPath, ".git", "index.lock");
}

/**
 * Wait for .git/index.lock to be released, removing it if stale.
 * Call this before running any git command that touches the index (add, commit, etc.)
 * to prevent "Another git process seems to be running" errors.
 */
export async function waitForGitReady(repoPath: string): Promise<void> {
  const lockPath = getIndexLockPath(repoPath);
  const start = Date.now();

  while (Date.now() - start < GIT_LOCK_TIMEOUT_MS) {
    try {
      await fs.access(lockPath);
    } catch {
      return; // Lock file doesn't exist — git is ready
    }

    const elapsed = Date.now() - start;
    if (elapsed > GIT_LOCK_TIMEOUT_MS / 2) {
      try {
        const stat = await fs.stat(lockPath);
        const lockAge = Date.now() - stat.mtimeMs;
        if (lockAge > GIT_LOCK_STALE_AGE_MS) {
          log.warn("Removing stale .git/index.lock", {
            repoPath,
            ageSec: Math.round(lockAge / 1000),
          });
          await fs.unlink(lockPath);
          return;
        }
      } catch {
        return; // Lock disappeared while checking
      }
    }

    await new Promise((resolve) => setTimeout(resolve, GIT_LOCK_POLL_MS));
  }

  try {
    log.warn("Git lock wait timed out, force-removing .git/index.lock", { repoPath });
    await fs.unlink(lockPath);
  } catch {
    // Lock may have been removed concurrently
  }
}
