import { execFile } from "node:child_process";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { promisify } from "node:util";
import type { CreateProjectRequest } from "@opensprint/shared";
import type { DbClient } from "../db/client.js";
import type { ProjectService } from "../services/project.service.js";
import { setSettingsInStore } from "../services/settings-store.service.js";
import { cleanupTestProject } from "./test-project-cleanup.js";
import { resetProjectScopedTestData } from "./test-db-helper.js";

const execFileAsync = promisify(execFile);

interface ReusedProjectFixtureOptions {
  suitePrefix: string;
  projectService: ProjectService;
  createProjectInput: Omit<CreateProjectRequest, "repoPath">;
  repoDirName?: string;
  dbClient?: DbClient | null;
}

export interface ReusedProjectFixture {
  suiteTempDir: string;
  repoPath: string;
  projectId: string;
  reset: () => Promise<void>;
  cleanup: () => Promise<void>;
}

function cloneJson<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

async function resetGitRepoToHead(repoPath: string): Promise<void> {
  try {
    await execFileAsync("git", ["reset", "--hard", "HEAD"], { cwd: repoPath });
    await execFileAsync("git", ["clean", "-fd"], { cwd: repoPath });
  } catch {
    // Ignore: some tests create files outside git control or remove the repo intentionally.
  }
}

export async function createReusedProjectFixture(
  options: ReusedProjectFixtureOptions
): Promise<ReusedProjectFixture> {
  const suiteTempDir = await fs.mkdtemp(path.join(os.tmpdir(), options.suitePrefix));
  const originalHome = process.env.HOME;
  process.env.HOME = suiteTempDir;

  const repoPath = path.join(suiteTempDir, options.repoDirName ?? "project");
  const project = await options.projectService.createProject({
    ...options.createProjectInput,
    repoPath,
  });
  const baselineSettings = cloneJson(await options.projectService.getSettings(project.id));

  return {
    suiteTempDir,
    repoPath,
    projectId: project.id,
    reset: async () => {
      if (options.dbClient) {
        await resetProjectScopedTestData(options.dbClient, project.id);
      }
      await setSettingsInStore(project.id, cloneJson(baselineSettings));
      await resetGitRepoToHead(repoPath);
    },
    cleanup: async () => {
      await cleanupTestProject({
        projectId: project.id,
        projectService: options.projectService,
      });
      process.env.HOME = originalHome;
      await fs.rm(suiteTempDir, { recursive: true, force: true });
    },
  };
}
