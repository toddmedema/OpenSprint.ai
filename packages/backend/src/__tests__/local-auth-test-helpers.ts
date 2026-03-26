import type { Test } from "supertest";
import { getLocalSessionToken } from "../services/local-session-auth.service.js";

/** Attach bearer token for Vitest (matches ensureLocalSessionToken test default). */
export function withLocalSessionAuth(req: Test): Test {
  return req.set("Authorization", `Bearer ${getLocalSessionToken()}`);
}
