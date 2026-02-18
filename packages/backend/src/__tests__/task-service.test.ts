import { describe, it, expect, beforeEach, vi } from "vitest";
import { TaskService } from "../services/task.service.js";
import { beadsCache } from "../services/beads-cache.js";
import type { BeadsIssue } from "../services/beads.service.js";

vi.mock("../services/project.service.js", () => ({
  ProjectService: vi.fn().mockImplementation(() => ({
    getProject: vi.fn().mockResolvedValue({
      id: "proj-1",
      repoPath: "/tmp/test-repo",
    }),
  })),
}));

describe("TaskService", () => {
  let taskService: TaskService;
  let beadsShowCalls: number;
  let beadsListAllCalls: number;
  let beadsReadyCalls: number;

  beforeEach(async () => {
    beadsCache.clear();
    beadsShowCalls = 0;
    beadsListAllCalls = 0;
    beadsReadyCalls = 0;

    const { BeadsService } = await import("../services/beads.service.js");
    vi.spyOn(BeadsService.prototype, "show").mockImplementation(async () => {
      beadsShowCalls++;
      return {
        id: "task-1",
        title: "Test Task",
        description: "Test description",
        issue_type: "task",
        status: "open",
        priority: 1,
        assignee: null,
        labels: [],
        created_at: "2024-01-01T00:00:00Z",
        updated_at: "2024-01-01T00:00:00Z",
        dependencies: [],
      } as BeadsIssue;
    });
    vi.spyOn(BeadsService.prototype, "listAll").mockImplementation(async () => {
      beadsListAllCalls++;
      return [
        {
          id: "task-1",
          title: "Test Task",
          status: "open",
          issue_type: "task",
          dependencies: [],
        },
      ] as BeadsIssue[];
    });
    vi.spyOn(BeadsService.prototype, "ready").mockImplementation(async () => {
      beadsReadyCalls++;
      return [];
    });

    taskService = new TaskService();
  });

  it("getTask does not call beads.ready (avoids N bd show calls)", async () => {
    const task = await taskService.getTask("proj-1", "task-1");
    expect(task).toBeDefined();
    expect(task.id).toBe("task-1");
    expect(task.title).toBe("Test Task");
    expect(beadsReadyCalls).toBe(0);
    expect(beadsShowCalls).toBe(1);
    expect(beadsListAllCalls).toBe(1);
  });

  it("getTask uses cache on second call (reduces bd invocations)", async () => {
    await taskService.getTask("proj-1", "task-1");
    await taskService.getTask("proj-1", "task-1");
    expect(beadsShowCalls).toBe(1);
    expect(beadsListAllCalls).toBe(1);
  });
});
