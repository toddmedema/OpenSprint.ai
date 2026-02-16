import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Provider } from "react-redux";
import { configureStore } from "@reduxjs/toolkit";
import { PlanPhase } from "./PlanPhase";
import projectReducer from "../../store/slices/projectSlice";
import planReducer from "../../store/slices/planSlice";
import buildReducer from "../../store/slices/buildSlice";

const mockArchive = vi.fn().mockResolvedValue(undefined);
const mockPlansList = vi.fn().mockResolvedValue({
  plans: [
    {
      metadata: {
        planId: "archive-test-feature",
        beadEpicId: "epic-1",
        gateTaskId: "epic-1.0",
        complexity: "medium",
      },
      content: "# Archive Test\n\nContent.",
      status: "building",
      taskCount: 2,
      completedTaskCount: 0,
      dependencyCount: 0,
    },
  ],
  edges: [],
});
const mockPlansGet = vi.fn().mockResolvedValue({
  metadata: {
    planId: "archive-test-feature",
    beadEpicId: "epic-1",
    gateTaskId: "epic-1.0",
    complexity: "medium",
  },
  content: "# Archive Test\n\nContent.",
  status: "building",
  taskCount: 2,
  completedTaskCount: 0,
  dependencyCount: 0,
});
vi.mock("../../api/client", () => ({
  api: {
    plans: {
      list: (...args: unknown[]) => mockPlansList(...args),
      get: (...args: unknown[]) => mockPlansGet(...args),
      archive: (...args: unknown[]) => mockArchive(...args),
    },
    tasks: { list: vi.fn().mockResolvedValue([]) },
    chat: { history: vi.fn().mockResolvedValue({ messages: [] }) },
  },
}));

function createStore() {
  return configureStore({
    reducer: {
      project: projectReducer,
      plan: planReducer,
      build: buildReducer,
    },
    preloadedState: {
      plan: {
        plans: [
          {
            metadata: {
              planId: "archive-test-feature",
              beadEpicId: "epic-1",
              gateTaskId: "epic-1.0",
              complexity: "medium",
            },
            content: "# Archive Test\n\nContent.",
            status: "building",
            taskCount: 2,
            completedTaskCount: 0,
            dependencyCount: 0,
          },
        ],
        dependencyGraph: null,
        selectedPlanId: "archive-test-feature",
        chatMessages: {},
        loading: false,
        decomposing: false,
        shippingPlanId: null,
        reshippingPlanId: null,
        archivingPlanId: null,
        error: null,
      },
      build: {
        tasks: [
          {
            id: "epic-1.1",
            title: "Task A",
            epicId: "epic-1",
            kanbanColumn: "ready" as const,
            priority: 0,
            assignee: null,
          },
          {
            id: "epic-1.2",
            title: "Task B",
            epicId: "epic-1",
            kanbanColumn: "ready" as const,
            priority: 1,
            assignee: null,
          },
        ],
        plans: [],
        orchestratorRunning: false,
        awaitingApproval: false,
        selectedTaskId: null,
        taskDetail: null,
        agentOutput: [],
        completionState: null,
        archivedSessions: [],
        archivedLoading: false,
        loading: false,
        error: null,
      },
    },
  });
}

describe("PlanPhase archive", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    Element.prototype.scrollIntoView = vi.fn();
  });

  it("renders archive icon button in plan details sidebar when a plan is selected", async () => {
    const store = createStore();
    render(
      <Provider store={store}>
        <PlanPhase projectId="proj-1" />
      </Provider>,
    );

    const archiveButton = screen.getByTitle("Archive plan (mark all ready/open tasks as done)");
    expect(archiveButton).toBeInTheDocument();
  });

  it("calls archive API when archive button is clicked", async () => {
    const store = createStore();
    const user = userEvent.setup();
    render(
      <Provider store={store}>
        <PlanPhase projectId="proj-1" />
      </Provider>,
    );

    const archiveButton = screen.getByTitle("Archive plan (mark all ready/open tasks as done)");
    await user.click(archiveButton);

    expect(mockArchive).toHaveBeenCalledWith("proj-1", "archive-test-feature");
  });
});
