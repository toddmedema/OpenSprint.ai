import type { ActiveAgent } from "@opensprint/shared";

/** Internal entry stored in the registry (includes projectId for filtering) */
export interface ActiveAgentEntry {
  id: string;
  projectId: string;
  phase: string;
  label: string;
  startedAt: string;
  /** Branch name (Build phase only) */
  branchName?: string;
}

/**
 * Central registry for in-flight agent invocations.
 * Used by all phases (Dream, Plan, Build, Verify) to track active agents.
 */
export class ActiveAgentsService {
  private agents = new Map<string, ActiveAgentEntry>();

  /**
   * Register an active agent.
   * @param id - Unique agent/task identifier
   * @param projectId - Project the agent is running for
   * @param phase - Phase (e.g. "spec", "plan", "execute", "ensure", "deploy" or "coding", "review")
   * @param label - Human-readable label (e.g. task title)
   * @param startedAt - ISO timestamp when the agent started
   * @param branchName - Optional branch name (Build phase)
   */
  register(
    id: string,
    projectId: string,
    phase: string,
    label: string,
    startedAt: string,
    branchName?: string,
  ): void {
    this.agents.set(id, {
      id,
      projectId,
      phase,
      label,
      startedAt,
      branchName,
    });
  }

  /**
   * Unregister an active agent by id.
   * Safe to call if the agent was never registered.
   */
  unregister(id: string): void {
    this.agents.delete(id);
  }

  /**
   * List active agents, optionally filtered by projectId.
   * @param projectId - If provided, returns only agents for that project
   * @returns Array of ActiveAgent (projectId omitted from response for project-scoped API)
   */
  list(projectId?: string): ActiveAgent[] {
    const entries = projectId
      ? [...this.agents.values()].filter((e) => e.projectId === projectId)
      : [...this.agents.values()];

    return entries.map((e) => ({
      id: e.id,
      phase: e.phase,
      label: e.label,
      startedAt: e.startedAt,
      ...(e.branchName != null && { branchName: e.branchName }),
    }));
  }
}

export const activeAgentsService = new ActiveAgentsService();
