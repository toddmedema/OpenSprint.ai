import type { Request, Response, NextFunction } from "express";
import { databaseRuntime } from "../services/database-runtime.service.js";
import { wrapAsync } from "./wrap-async.js";

/** Async DB gate: wrapped so Express forwards rejections to the error handler reliably. */
export const requireDatabase = wrapAsync(
  async (_req: Request, _res: Response, next: NextFunction): Promise<void> => {
    await databaseRuntime.requireDatabase();
    next();
  }
);
