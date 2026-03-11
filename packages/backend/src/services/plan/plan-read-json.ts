/**
 * Read plan JSON from repo file (e.g. when agent writes plan to file instead of response).
 * Internal module used by PlanDecomposeGenerateService.
 */
import fs from "fs/promises";
import path from "path";
import { createLogger } from "../../utils/logger.js";
import { getErrorMessage } from "../../utils/error-utils.js";

const log = createLogger("plan-read-json");

export async function readPlanJsonFromRepo(
  repoPath: string,
  relativePath: string
): Promise<Record<string, unknown> | null> {
  const normalizedRepo = path.resolve(repoPath);
  const resolved = path.resolve(normalizedRepo, relativePath);
  const relative = path.relative(normalizedRepo, resolved);
  if (relative.startsWith("..") || path.isAbsolute(relative)) {
    log.warn("Plan file path escapes repo, ignoring", { relativePath, resolved });
    return null;
  }
  try {
    const raw = await fs.readFile(resolved, "utf-8");
    const parsed = JSON.parse(raw) as Record<string, unknown>;
    if (parsed && (typeof parsed.title === "string" || typeof parsed.plan_title === "string")) {
      return parsed;
    }
    return null;
  } catch (err) {
    log.warn("Failed to read plan JSON from file", {
      path: resolved,
      err: getErrorMessage(err),
    });
    return null;
  }
}
