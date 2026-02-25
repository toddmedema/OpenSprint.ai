/**
 * Runtime directory for per-project state that must NOT live inside the git repo.
 *
 * The orchestrator continuously writes to files like events.jsonl,
 * agent-stats.json, and orchestrator-counters.json. When these live inside
 * the project repo, they make the working tree dirty and block git merge /
 * rebase with "local changes would be overwritten" errors.
 *
 * This module redirects those writes to an OS temp directory, keyed by a
 * stable hash of the repo path so the location survives server restarts
 * (within the same boot session).
 */

import crypto from "crypto";
import fs from "fs/promises";
import os from "os";
import path from "path";

const BASE_DIR = path.join(os.tmpdir(), "opensprint-runtime");

const ensuredDirs = new Set<string>();

function repoHash(repoPath: string): string {
  return crypto.createHash("sha256").update(path.resolve(repoPath)).digest("hex").slice(0, 12);
}

/** Stable runtime directory for a given project repo. */
export function getProjectRuntimeDir(repoPath: string): string {
  return path.join(BASE_DIR, repoHash(repoPath));
}

/**
 * Resolve a runtime-only file path into the temp dir.
 * Accepts paths like ".opensprint/events.jsonl" (from OPENSPRINT_PATHS) and
 * strips the leading ".opensprint/" since the runtime dir replaces that prefix.
 */
export function getRuntimePath(repoPath: string, relativePath: string): string {
  const stripped = relativePath.replace(/^\.opensprint\//, "");
  return path.join(getProjectRuntimeDir(repoPath), stripped);
}

/** Ensure the runtime directory exists (cached so we only mkdir once per process). */
export async function ensureRuntimeDir(repoPath: string): Promise<string> {
  const dir = getProjectRuntimeDir(repoPath);
  if (!ensuredDirs.has(dir)) {
    await fs.mkdir(dir, { recursive: true });
    ensuredDirs.add(dir);
  }
  return dir;
}
