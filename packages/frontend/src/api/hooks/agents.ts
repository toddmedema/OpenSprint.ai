import { useQuery } from "@tanstack/react-query";
import type { ActiveAgent, Project } from "@opensprint/shared";
import { api } from "../client";
import { queryKeys } from "../queryKeys";

export interface AgentWithProject {
  project: Project;
  agent: ActiveAgent;
}

export function useGlobalActiveAgents(options?: { enabled?: boolean; refetchInterval?: number }) {
  return useQuery({
    queryKey: queryKeys.agents.global(),
    queryFn: async (): Promise<{ entries: AgentWithProject[]; hasProjects: boolean }> => {
      const projects = await api.projects.list();
      if (projects.length === 0) {
        return { entries: [], hasProjects: false };
      }
      const results = await Promise.all(
        projects.map(async (project) => {
          try {
            const agents = await api.agents.active(project.id);
            return (Array.isArray(agents) ? agents : []).map((agent) => ({
              project,
              agent,
            }));
          } catch {
            return [];
          }
        })
      );
      return { entries: results.flat(), hasProjects: true };
    },
    enabled: options?.enabled !== false,
    refetchInterval: options?.refetchInterval,
  });
}
