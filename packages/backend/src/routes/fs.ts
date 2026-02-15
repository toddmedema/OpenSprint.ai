import { Router, Request } from "express";
import { readdir, stat } from "fs/promises";
import { join, resolve, dirname } from "path";
import { existsSync } from "fs";
import type { ApiResponse } from "@opensprint/shared";
import { detectTestFramework } from "../services/test-framework.service.js";

export const fsRouter = Router();

interface BrowseResult {
  current: string;
  parent: string | null;
  entries: { name: string; path: string; isDirectory: boolean }[];
}

// GET /fs/browse?path=/some/path — List directory contents
fsRouter.get("/browse", async (req: Request<object, object, object, { path?: string }>, res, next) => {
  try {
    const rawPath = req.query.path;
    const targetPath = rawPath?.trim() ? resolve(rawPath) : resolve(process.env.HOME || process.env.USERPROFILE || "/");

    if (!existsSync(targetPath)) {
      res.status(400).json({
        error: { code: "NOT_FOUND", message: "Directory does not exist" },
      });
      return;
    }

    const pathStat = await stat(targetPath);
    if (!pathStat.isDirectory()) {
      res.status(400).json({
        error: { code: "NOT_DIRECTORY", message: "Path is not a directory" },
      });
      return;
    }

    const entries = await readdir(targetPath, { withFileTypes: true });
    const dirEntries = entries
      .filter((e) => e.isDirectory())
      .map((e) => ({
        name: e.name,
        path: join(targetPath, e.name),
        isDirectory: true,
      }))
      .sort((a, b) => a.name.localeCompare(b.name, undefined, { sensitivity: "base" }));

    const parentPath = dirname(targetPath);
    const result: BrowseResult = {
      current: targetPath,
      parent: parentPath !== targetPath ? parentPath : null,
      entries: dirEntries,
    };

    const body: ApiResponse<BrowseResult> = { data: result };
    res.json(body);
  } catch (err) {
    next(err);
  }
});

// GET /fs/detect-test-framework?path=/some/path — Detect test framework from project files
fsRouter.get(
  "/detect-test-framework",
  async (req: Request<object, object, object, { path?: string }>, res, next) => {
    try {
      const rawPath = req.query.path?.trim();
      if (!rawPath) {
        res.status(400).json({
          error: { code: "INVALID_INPUT", message: "Path query parameter is required" },
        });
        return;
      }

      const targetPath = resolve(rawPath);
      if (!existsSync(targetPath)) {
        res.status(400).json({
          error: { code: "NOT_FOUND", message: "Directory does not exist" },
        });
        return;
      }

      const detected = await detectTestFramework(targetPath);
      const body: ApiResponse<{ framework: string; testCommand: string } | null> = { data: detected };
      res.json(body);
    } catch (err) {
      next(err);
    }
  },
);
