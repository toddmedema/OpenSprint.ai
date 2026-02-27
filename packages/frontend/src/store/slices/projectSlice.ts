import { createSlice } from "@reduxjs/toolkit";
import type { Project } from "@opensprint/shared";

/** Project slice holds only client state; server state (project data) comes from useProject(projectId) via TanStack Query.
 *  State shape kept for backwards compat with tests that preload project. */
export interface ProjectState {
  data: Project | null;
  loading: boolean;
  error: string | null;
}

const initialState: ProjectState = {
  data: null,
  loading: false,
  error: null,
};

const projectSlice = createSlice({
  name: "project",
  initialState,
  reducers: {
    resetProject() {
      return initialState;
    },
  },
});

export const { resetProject } = projectSlice.actions;
export default projectSlice.reducer;
