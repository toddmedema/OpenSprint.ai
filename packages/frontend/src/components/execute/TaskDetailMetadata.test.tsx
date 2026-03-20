import { describe, it, expect, vi, afterEach } from "vitest";
import { screen } from "@testing-library/react";
import type { Task } from "@opensprint/shared";
import { TaskDetailMetadata } from "./TaskDetailMetadata";
import { renderWithProviders } from "../../test/test-utils";

const baseTask = {
  id: "t1",
  title: "Task",
  description: "",
  type: "task" as const,
  status: "open" as const,
  priority: 1,
  assignee: null as string | null,
  labels: [] as string[],
  dependencies: [] as string[],
  epicId: null as string | null,
  createdAt: "2024-01-01T12:00:00Z",
  updatedAt: "2024-01-02T12:00:00Z",
};

describe("TaskDetailMetadata", () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it("shows Blocked on main hint when waiting_to_merge and mergeWaitingOnMain", () => {
    const task = {
      ...baseTask,
      kanbanColumn: "waiting_to_merge" as const,
      mergeWaitingOnMain: true,
    } as Task;

    renderWithProviders(
      <TaskDetailMetadata
        projectId="p1"
        selectedTask="t1"
        task={task}
        taskDetailLoading={false}
        taskDetailError={null}
        taskIdToStartedAt={{}}
        roleLabel={null}
        isDoneTask={false}
        isBlockedTask={false}
      />
    );

    expect(screen.getByText("Waiting to Merge")).toBeInTheDocument();
    expect(screen.getByTestId("task-detail-merge-waiting-on-main-hint")).toHaveTextContent(
      "· Blocked on main"
    );
    expect(screen.getByTestId("task-detail-merge-waiting-on-main-hint")).toHaveAttribute(
      "title",
      "Blocked on main"
    );
  });

  it("does not show Blocked on main hint when mergeWaitingOnMain is false", () => {
    const task = {
      ...baseTask,
      kanbanColumn: "waiting_to_merge" as const,
      mergeWaitingOnMain: false,
    } as Task;

    renderWithProviders(
      <TaskDetailMetadata
        projectId="p1"
        selectedTask="t1"
        task={task}
        taskDetailLoading={false}
        taskDetailError={null}
        taskIdToStartedAt={{}}
        roleLabel={null}
        isDoneTask={false}
        isBlockedTask={false}
      />
    );

    expect(screen.queryByTestId("task-detail-merge-waiting-on-main-hint")).not.toBeInTheDocument();
  });

  it("shows Retry eligible soon when mergePausedUntil is in the past (no mergeWaitingOnMain)", () => {
    vi.useFakeTimers({ now: new Date("2024-06-01T12:00:00Z").getTime() });

    const task = {
      ...baseTask,
      kanbanColumn: "waiting_to_merge" as const,
      mergePausedUntil: "2024-06-01T11:00:00Z",
    } as Task;

    renderWithProviders(
      <TaskDetailMetadata
        projectId="p1"
        selectedTask="t1"
        task={task}
        taskDetailLoading={false}
        taskDetailError={null}
        taskIdToStartedAt={{}}
        roleLabel={null}
        isDoneTask={false}
        isBlockedTask={false}
      />
    );

    const hint = screen.getByTestId("task-detail-merge-state-hint");
    expect(hint).toHaveTextContent("Retry eligible soon");
    expect(hint).toHaveAttribute("title", "Retry eligible soon");
  });

  it("shows Retry eligible suffix when waiting_to_merge and mergePausedUntil is set", () => {
    vi.useFakeTimers({ now: new Date("2024-06-01T12:00:00Z").getTime() });

    const task = {
      ...baseTask,
      kanbanColumn: "waiting_to_merge" as const,
      mergeGateState: "blocked_on_baseline" as const,
      mergeWaitingOnMain: true,
      mergePausedUntil: "2024-06-01T12:05:00Z",
    } as Task;

    renderWithProviders(
      <TaskDetailMetadata
        projectId="p1"
        selectedTask="t1"
        task={task}
        taskDetailLoading={false}
        taskDetailError={null}
        taskIdToStartedAt={{}}
        roleLabel={null}
        isDoneTask={false}
        isBlockedTask={false}
      />
    );

    const hint = screen.getByTestId("task-detail-merge-waiting-on-main-hint");
    expect(hint).toHaveTextContent("Blocked on main");
    expect(hint).toHaveTextContent("Retry eligible in 5m");
    expect(hint).toHaveAttribute("title", "Blocked on main · Retry eligible in 5m");
  });
});
