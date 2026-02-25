import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import type { ActiveAgent, Project } from "@opensprint/shared";
import { api } from "../../api/client";

export interface AgentWithProject {
  project: Project;
  agent: ActiveAgent;
}

export interface GlobalState {
  /** Active agents across all projects (for navbar dropdown) */
  globalActiveAgents: AgentWithProject[];
  /** Whether any projects exist (used to show/hide GlobalActiveAgentsList) */
  hasProjects: boolean;
  /** True after first fetchGlobalActiveAgents completes — used to avoid showing "No agents running" during initial load */
  globalAgentsLoadedOnce: boolean;
  async: {
    globalAgents: { loading: boolean; error: string | null };
  };
}

const initialState: GlobalState = {
  globalActiveAgents: [],
  hasProjects: false,
  globalAgentsLoadedOnce: false,
  async: {
    globalAgents: { loading: false, error: null },
  },
};

export const fetchGlobalActiveAgents = createAsyncThunk(
  "global/fetchGlobalActiveAgents",
  async (): Promise<{ entries: AgentWithProject[]; hasProjects: boolean }> => {
    const projects = await api.projects.list();
    if (projects.length === 0) return { entries: [], hasProjects: false };
    const results = await Promise.all(
      projects.map(async (p) => {
        try {
          const agents = await api.agents.active(p.id);
          return (Array.isArray(agents) ? agents : []).map((agent) => ({
            project: p,
            agent,
          }));
        } catch {
          return [];
        }
      })
    );
    return { entries: results.flat(), hasProjects: true };
  }
);

const globalSlice = createSlice({
  name: "global",
  initialState,
  reducers: {
    resetGlobal() {
      return initialState;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchGlobalActiveAgents.pending, (state) => {
        state.async.globalAgents.loading = true;
        state.async.globalAgents.error = null;
      })
      .addCase(fetchGlobalActiveAgents.fulfilled, (state, action) => {
        const payload = action.payload ?? { entries: [], hasProjects: false };
        state.globalActiveAgents = payload.entries ?? [];
        state.hasProjects = payload.hasProjects ?? false;
        state.globalAgentsLoadedOnce = true;
        state.async.globalAgents.loading = false;
      })
      .addCase(fetchGlobalActiveAgents.rejected, (state, action) => {
        state.globalActiveAgents = [];
        state.hasProjects = false;
        state.globalAgentsLoadedOnce = true;
        state.async.globalAgents.loading = false;
        state.async.globalAgents.error = action.error.message ?? "Failed to load agents";
      });
  },
});

export const { resetGlobal } = globalSlice.actions;
export default globalSlice.reducer;
