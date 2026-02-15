/** The four lifecycle phases of an OpenSprint project */
export type ProjectPhase = 'design' | 'plan' | 'build' | 'validate';

/** Core project entity */
export interface Project {
  id: string;
  name: string;
  description: string;
  repoPath: string;
  currentPhase: ProjectPhase;
  createdAt: string;
  updatedAt: string;
  /** Overall progress 0–100 (build tasks done / total). PRD §6.1 */
  progressPercent?: number;
}

/** Entry in the global project index (~/.opensprint/projects.json) */
export interface ProjectIndexEntry {
  id: string;
  name: string;
  description: string;
  repoPath: string;
  createdAt: string;
}

/** Global project index file structure */
export interface ProjectIndex {
  projects: ProjectIndexEntry[];
}

/** Project creation request */
export interface CreateProjectRequest {
  name: string;
  description: string;
  repoPath: string;
  planningAgent: AgentConfigInput;
  codingAgent: AgentConfigInput;
  deployment: DeploymentConfigInput;
  hilConfig: HilConfigInput;
}

// Forward references for agent/deployment config — defined in settings.ts
import type { AgentConfigInput, DeploymentConfigInput, HilConfigInput } from './settings.js';
