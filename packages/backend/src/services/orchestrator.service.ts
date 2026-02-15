import type { OrchestratorStatus } from '@opensprint/shared';

/**
 * Build orchestrator service.
 * Manages the single-agent build loop: poll bd ready → assign → spawn agent → monitor → handle result.
 */
export class OrchestratorService {
  /** Per-project orchestrator state */
  private state = new Map<string, OrchestratorStatus>();

  /** Get default status */
  private defaultStatus(): OrchestratorStatus {
    return {
      running: false,
      currentTask: null,
      currentPhase: null,
      queueDepth: 0,
      totalCompleted: 0,
      totalFailed: 0,
    };
  }

  /** Start the build orchestrator for a project */
  async start(projectId: string): Promise<OrchestratorStatus> {
    const status = this.state.get(projectId) ?? this.defaultStatus();

    if (status.running) {
      return status;
    }

    status.running = true;
    this.state.set(projectId, status);

    // TODO: Start the orchestrator loop
    // 1. Poll bd ready --json
    // 2. Pick highest-priority task
    // 3. Assign via bd update <id> --status in_progress --assignee agent-1
    // 4. Create task branch
    // 5. Assemble task directory (prompt.md, config.json, context/)
    // 6. Spawn agent CLI subprocess
    // 7. Monitor output + 5-min inactivity timeout
    // 8. Handle result.json → review cycle or done
    // 9. Loop

    return status;
  }

  /** Pause the build orchestrator */
  async pause(projectId: string): Promise<OrchestratorStatus> {
    const status = this.state.get(projectId) ?? this.defaultStatus();
    status.running = false;
    this.state.set(projectId, status);
    return status;
  }

  /** Get orchestrator status */
  async getStatus(projectId: string): Promise<OrchestratorStatus> {
    return this.state.get(projectId) ?? this.defaultStatus();
  }
}
