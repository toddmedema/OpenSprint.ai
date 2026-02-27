import { describe, it, expect } from "vitest";
import { configureStore } from "@reduxjs/toolkit";
import projectReducer, { resetProject, type ProjectState } from "./projectSlice";
import type { Project } from "@opensprint/shared";

const mockProject: Project = {
  id: "proj-1",
  name: "Test Project",
  repoPath: "/path/to/repo",
  currentPhase: "sketch",
  createdAt: "2025-01-01T00:00:00Z",
  updatedAt: "2025-01-01T00:00:00Z",
};

describe("projectSlice", () => {
  describe("initial state", () => {
    it("has correct initial state", () => {
      const store = configureStore({ reducer: { project: projectReducer } });
      const state = store.getState().project as ProjectState;
      expect(state.data).toBeNull();
      expect(state.loading).toBe(false);
      expect(state.error).toBeNull();
    });
  });

  describe("resetProject", () => {
    it("resets state to initial values", () => {
      const store = configureStore({ reducer: { project: projectReducer } });
      store.dispatch(resetProject());
      const state = store.getState().project as ProjectState;
      expect(state.data).toBeNull();
      expect(state.loading).toBe(false);
      expect(state.error).toBeNull();
    });

    it("clears preloaded project data", () => {
      const store = configureStore({
        reducer: { project: projectReducer },
        preloadedState: {
          project: { data: mockProject, loading: false, error: null },
        },
      });
      expect(store.getState().project.data).toEqual(mockProject);
      store.dispatch(resetProject());
      const state = store.getState().project as ProjectState;
      expect(state.data).toBeNull();
    });
  });
});
