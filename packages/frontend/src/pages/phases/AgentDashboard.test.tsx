import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { Provider } from "react-redux";
import { configureStore } from "@reduxjs/toolkit";
import { AgentDashboard } from "./AgentDashboard";
import buildReducer from "../../store/slices/buildSlice";

const mockBuildStatus = vi.fn().mockResolvedValue({
  running: false,
  totalCompleted: 0,
  totalFailed: 0,
  queueDepth: 0,
});

const mockAgentsActive = vi.fn().mockResolvedValue([]);

vi.mock("../../api/client", () => ({
  api: {
    build: {
      status: (...args: unknown[]) => mockBuildStatus(...args),
    },
    agents: {
      active: (...args: unknown[]) => mockAgentsActive(...args),
    },
  },
}));

function createStore() {
  return configureStore({
    reducer: { build: buildReducer },
  });
}

function renderAgentDashboard() {
  return render(
    <Provider store={createStore()}>
      <AgentDashboard projectId="proj-1" />
    </Provider>,
  );
}

describe("AgentDashboard", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders header with title and subtitle", async () => {
    renderAgentDashboard();

    expect(screen.getByText("Agent Dashboard")).toBeInTheDocument();
    expect(screen.getByText("Monitor and manage all agent instances")).toBeInTheDocument();
  });

  it("does not render redundant Connected text in top bar", () => {
    renderAgentDashboard();

    expect(screen.queryByText("Connected")).not.toBeInTheDocument();
  });

  it("fetches build status on mount", async () => {
    renderAgentDashboard();

    expect(mockBuildStatus).toHaveBeenCalledWith("proj-1");
    expect(mockAgentsActive).toHaveBeenCalledWith("proj-1");
  });
});
