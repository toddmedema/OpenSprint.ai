import { describe, it, expect } from "vitest";
import type { Task } from "@opensprint/shared";
import { mergeExecuteSelectedTaskData } from "./mergeExecuteSelectedTask";

const baseTask = (overrides: Partial<Task> = {}): Task =>
  ({
    id: "os-1.1",
    title: "T",
    description: "",
    type: "task",
    status: "open",
    priority: 2,
    assignee: null,
    labels: [],
    dependencies: [],
    epicId: "os-1",
    kanbanColumn: "waiting_to_merge",
    createdAt: "",
    updatedAt: "",
    startedAt: null,
    completedAt: null,
    ...overrides,
  }) as Task;

describe("mergeExecuteSelectedTaskData", () => {
  it("returns null when both sources are null", () => {
    expect(mergeExecuteSelectedTaskData(null, null)).toBeNull();
  });

  it("returns detail alone when store is null", () => {
    const d = baseTask({ mergeGateState: "validating" });
    expect(mergeExecuteSelectedTaskData(d, null)).toBe(d);
  });

  it("returns store alone when detail is null", () => {
    const s = baseTask({ mergeGateState: "blocked_on_baseline" });
    expect(mergeExecuteSelectedTaskData(null, s)).toBe(s);
  });

  it("overlays live merge fields and column from Redux when ids match", () => {
    const detail = baseTask({
      mergeGateState: "validating",
      mergeWaitingOnMain: false,
      priority: 2,
    });
    const store = baseTask({
      mergeGateState: "blocked_on_baseline",
      mergeWaitingOnMain: true,
      mergePausedUntil: "2099-01-01T00:00:00.000Z",
      kanbanColumn: "waiting_to_merge",
      priority: 3,
    });
    const merged = mergeExecuteSelectedTaskData(detail, store);
    expect(merged).toEqual(
      expect.objectContaining({
        ...detail,
        priority: 3,
        mergeGateState: "blocked_on_baseline",
        mergeWaitingOnMain: true,
        mergePausedUntil: "2099-01-01T00:00:00.000Z",
      })
    );
  });

  it("does not merge when task ids differ", () => {
    const detail = baseTask({ id: "a" });
    const store = baseTask({ id: "b", mergeGateState: "merging" });
    expect(mergeExecuteSelectedTaskData(detail, store)).toBe(detail);
  });

  it("overlays lastExecutionSummary from Redux when present", () => {
    const detail = baseTask({ lastExecutionSummary: "old summary" });
    const store = baseTask({ lastExecutionSummary: "Merge paused: baseline failing" });
    const merged = mergeExecuteSelectedTaskData(detail, store);
    expect(merged?.lastExecutionSummary).toBe("Merge paused: baseline failing");
  });

  it("falls back to detail lastExecutionSummary when Redux value is null", () => {
    const detail = baseTask({ lastExecutionSummary: "detail summary" });
    const store = baseTask({ lastExecutionSummary: null });
    const merged = mergeExecuteSelectedTaskData(detail, store);
    expect(merged?.lastExecutionSummary).toBe("detail summary");
  });
});
