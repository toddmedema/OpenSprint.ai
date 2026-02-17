import { describe, it, expect } from "vitest";
import type { DeploymentRecord } from "../types/deploy.js";

describe("DeploymentRecord", () => {
  it("should allow rolled_back status", () => {
    const record: DeploymentRecord = {
      id: "deploy-1",
      projectId: "proj-1",
      status: "rolled_back",
      startedAt: "2025-01-01T12:00:00.000Z",
      completedAt: "2025-01-01T12:01:00.000Z",
      log: [],
      rolledBackBy: "deploy-2",
    };
    expect(record.status).toBe("rolled_back");
    expect(record.rolledBackBy).toBe("deploy-2");
  });

  it("should allow commitHash, target, mode fields", () => {
    const record: DeploymentRecord = {
      id: "deploy-1",
      projectId: "proj-1",
      status: "success",
      startedAt: "2025-01-01T12:00:00.000Z",
      completedAt: "2025-01-01T12:01:00.000Z",
      log: [],
      commitHash: "abc123",
      target: "staging",
      mode: "expo",
    };
    expect(record.commitHash).toBe("abc123");
    expect(record.target).toBe("staging");
    expect(record.mode).toBe("expo");
  });
});
