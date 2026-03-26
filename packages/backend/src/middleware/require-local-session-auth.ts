import type { Request, Response, NextFunction } from "express";
import { AppError } from "./error-handler.js";
import { ErrorCodes } from "./error-codes.js";
import { requestHasLocalSessionCredential } from "../services/local-session-auth.service.js";

/**
 * Requires an Authorization: Bearer session token, or a localhost browser Origin / Referer.
 * Blocks naive curl/scripts with no such headers on sensitive local-only routes.
 */
export function requireLocalSessionAuth(req: Request, _res: Response, next: NextFunction): void {
  if (
    requestHasLocalSessionCredential(
      req.headers.authorization,
      req.headers.origin,
      req.headers.referer
    )
  ) {
    next();
    return;
  }
  next(
    new AppError(
      403,
      ErrorCodes.LOCAL_SESSION_AUTH_REQUIRED,
      "This endpoint requires a local browser session or Authorization: Bearer with the current server session token."
    )
  );
}
