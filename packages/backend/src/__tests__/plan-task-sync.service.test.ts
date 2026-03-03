import { describe, it, expect, vi, beforeEach } from "vitest";

const mockPlanGet = vi.fn();
const mockListAll = vi.fn();
const mockUpdate = vi.fn();
const mockSyncForPush = vi.fn();
const mockBroadcastToProject = vi.fn();

vi.mock("../services/task-store.service.js", () => ({
  taskStore: {
    planGet: (...args: unknown[]) => mockPlanGet(...args),
    listAll: (...args: unknown[]) => mockListAll(...args),
    update: (...args: unknown[]) => mockUpdate(...args),
    syncForPush: (...args: unknown[]) => mockSyncForPush(...args),
  },
}));

vi.mock("../websocket/index.js", () => ({
  broadcastToProject: (...args: unknown[]) => mockBroadcastToProject(...args),
}));

const { syncPlanTasksFromContent } = await import("../services/plan-task-sync.service.js");

describe("plan-task-sync.service", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("no-ops when the plan markdown has no tasks section", async () => {
    await syncPlanTasksFromContent("proj-1", "plan-1", "# Feature\n\n## Overview\n\nNothing");
    expect(mockPlanGet).not.toHaveBeenCalled();
  });

  it("updates matching child tasks by stable child order and broadcasts once", async () => {
    mockPlanGet.mockResolvedValue({ metadata: { epicId: "os-1" } });
    mockListAll.mockResolvedValue([
      { id: "os-1", issue_type: "epic" },
      { id: "os-1.2", issue_type: "task", title: "Old 2", description: "Old description" },
      { id: "os-1.1", issue_type: "task", title: "Old 1", description: "Old description" },
    ]);
    mockUpdate.mockResolvedValue(undefined);
    mockSyncForPush.mockResolvedValue(undefined);

    await syncPlanTasksFromContent(
      "proj-1",
      "plan-1",
      `# Feature

## Tasks

### First task
Updated first

### Second task
Updated second`
    );

    expect(mockUpdate).toHaveBeenNthCalledWith(1, "proj-1", "os-1.1", {
      title: "First task",
      description: "Updated first",
    });
    expect(mockUpdate).toHaveBeenNthCalledWith(2, "proj-1", "os-1.2", {
      title: "Second task",
      description: "Updated second",
    });
    expect(mockSyncForPush).toHaveBeenCalledWith("proj-1");
    expect(mockBroadcastToProject).toHaveBeenCalledWith("proj-1", {
      type: "plan.updated",
      planId: "plan-1",
    });
  });
});
