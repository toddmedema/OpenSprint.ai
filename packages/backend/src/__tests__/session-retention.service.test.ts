import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { SessionRetentionService } from "../services/session-retention.service.js";

vi.mock("../services/task-store.service.js", () => ({
  taskStore: {
    pruneAgentSessions: vi.fn(),
  },
}));

import { taskStore } from "../services/task-store.service.js";

describe("SessionRetentionService", () => {
  let service: SessionRetentionService;

  beforeEach(() => {
    service = new SessionRetentionService();
    vi.mocked(taskStore.pruneAgentSessions).mockResolvedValue(0);
  });

  afterEach(() => {
    service.stop();
  });

  it("should start and stop without errors", () => {
    service.start();
    service.stop();
  });

  it("should not start twice", () => {
    service.start();
    service.start();
    service.stop();
  });

  it("should call pruneAgentSessions on interval", async () => {
    vi.useFakeTimers();
    service.start();

    expect(taskStore.pruneAgentSessions).not.toHaveBeenCalled();

    vi.advanceTimersByTime(60 * 60 * 1000);
    await Promise.resolve();

    expect(taskStore.pruneAgentSessions).toHaveBeenCalledTimes(1);

    vi.advanceTimersByTime(60 * 60 * 1000);
    await Promise.resolve();

    expect(taskStore.pruneAgentSessions).toHaveBeenCalledTimes(2);

    vi.useRealTimers();
  });

  it("should not throw when pruneAgentSessions fails", async () => {
    vi.mocked(taskStore.pruneAgentSessions).mockRejectedValueOnce(new Error("db error"));

    vi.useFakeTimers();
    service.start();

    vi.advanceTimersByTime(60 * 60 * 1000);
    await Promise.resolve();

    expect(taskStore.pruneAgentSessions).toHaveBeenCalled();
    vi.useRealTimers();
  });
});
