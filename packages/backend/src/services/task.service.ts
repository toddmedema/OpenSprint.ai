import fs from 'fs/promises';
import path from 'path';
import type { Task, AgentSession } from '@opensprint/shared';
import { OPENSPRINT_PATHS } from '@opensprint/shared';
import { ProjectService } from './project.service.js';
import { BeadsService } from './beads.service.js';

export class TaskService {
  private projectService = new ProjectService();
  private beads = new BeadsService();

  /** List all tasks for a project (wraps bd list --json) */
  async listTasks(projectId: string): Promise<Task[]> {
    const project = await this.projectService.getProject(projectId);
    const result = await this.beads.list(project.repoPath);
    // TODO: Transform beads output to full Task[] with computed fields
    return result as unknown as Task[];
  }

  /** Get ready tasks (wraps bd ready --json) */
  async getReadyTasks(projectId: string): Promise<Task[]> {
    const project = await this.projectService.getProject(projectId);
    const result = await this.beads.ready(project.repoPath);
    // TODO: Transform beads output to full Task[] with computed fields
    return result as unknown as Task[];
  }

  /** Get a single task (wraps bd show --json) */
  async getTask(projectId: string, taskId: string): Promise<Task> {
    const project = await this.projectService.getProject(projectId);
    const result = await this.beads.show(project.repoPath, taskId);
    // TODO: Transform beads output to full Task with computed fields
    return result as unknown as Task;
  }

  /** Get all agent sessions for a task */
  async getTaskSessions(projectId: string, taskId: string): Promise<AgentSession[]> {
    const project = await this.projectService.getProject(projectId);
    const sessionsDir = path.join(project.repoPath, OPENSPRINT_PATHS.sessions);
    const sessions: AgentSession[] = [];

    try {
      const files = await fs.readdir(sessionsDir);
      for (const file of files) {
        if (file.startsWith(`${taskId}-`) && file.endsWith('.json')) {
          const data = await fs.readFile(path.join(sessionsDir, file), 'utf-8');
          sessions.push(JSON.parse(data) as AgentSession);
        }
      }
    } catch {
      // No sessions directory yet
    }

    return sessions.sort((a, b) => a.attempt - b.attempt);
  }

  /** Get a specific agent session for a task */
  async getTaskSession(
    projectId: string,
    taskId: string,
    attempt: number,
  ): Promise<AgentSession> {
    const project = await this.projectService.getProject(projectId);
    const sessionPath = path.join(
      project.repoPath,
      OPENSPRINT_PATHS.sessions,
      `${taskId}-${attempt}.json`,
    );
    const data = await fs.readFile(sessionPath, 'utf-8');
    return JSON.parse(data) as AgentSession;
  }
}
