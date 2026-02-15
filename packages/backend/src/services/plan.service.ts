import fs from 'fs/promises';
import path from 'path';
import type { Plan, PlanMetadata, PlanDependencyGraph } from '@opensprint/shared';
import { OPENSPRINT_PATHS } from '@opensprint/shared';
import { ProjectService } from './project.service.js';
import { BeadsService } from './beads.service.js';

export class PlanService {
  private projectService = new ProjectService();
  private beads = new BeadsService();

  /** Get the plans directory for a project */
  private async getPlansDir(projectId: string): Promise<string> {
    const project = await this.projectService.getProject(projectId);
    return path.join(project.repoPath, OPENSPRINT_PATHS.plans);
  }

  /** List all Plans for a project */
  async listPlans(projectId: string): Promise<Plan[]> {
    const plansDir = await this.getPlansDir(projectId);
    const plans: Plan[] = [];

    try {
      const files = await fs.readdir(plansDir);
      for (const file of files) {
        if (file.endsWith('.md')) {
          const planId = file.replace('.md', '');
          const plan = await this.getPlan(projectId, planId);
          plans.push(plan);
        }
      }
    } catch {
      // No plans directory yet
    }

    return plans;
  }

  /** Get a single Plan by ID */
  async getPlan(projectId: string, planId: string): Promise<Plan> {
    const plansDir = await this.getPlansDir(projectId);
    const mdPath = path.join(plansDir, `${planId}.md`);
    const metaPath = path.join(plansDir, `${planId}.meta.json`);

    const content = await fs.readFile(mdPath, 'utf-8');

    let metadata: PlanMetadata;
    try {
      const metaData = await fs.readFile(metaPath, 'utf-8');
      metadata = JSON.parse(metaData) as PlanMetadata;
    } catch {
      metadata = {
        planId,
        beadEpicId: '',
        gateTaskId: '',
        shippedAt: null,
        complexity: 'medium',
      };
    }

    // Derive status from beads state
    let status: Plan['status'] = 'planning';
    if (metadata.shippedAt) {
      status = 'shipped';
      // TODO: Check if all tasks are done → 'complete'
    }

    return {
      metadata,
      content,
      status,
      taskCount: 0,
      completedTaskCount: 0,
      dependencyCount: 0,
    };
  }

  /** Create a new Plan */
  async createPlan(
    projectId: string,
    body: { title: string; content: string; complexity?: string },
  ): Promise<Plan> {
    const project = await this.projectService.getProject(projectId);
    const plansDir = await this.getPlansDir(projectId);

    // Generate plan ID from title
    const planId = body.title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');

    // Write markdown
    await fs.writeFile(path.join(plansDir, `${planId}.md`), body.content);

    // Create beads epic
    const epicResult = await this.beads.create(project.repoPath, body.title, { type: 'epic' });

    // Create gating task
    const gateResult = await this.beads.create(project.repoPath, 'Plan approval gate', { type: 'task' });

    // Write metadata
    const metadata: PlanMetadata = {
      planId,
      beadEpicId: '', // TODO: Parse from epicResult
      gateTaskId: '', // TODO: Parse from gateResult
      shippedAt: null,
      complexity: (body.complexity as PlanMetadata['complexity']) || 'medium',
    };

    await fs.writeFile(
      path.join(plansDir, `${planId}.meta.json`),
      JSON.stringify(metadata, null, 2),
    );

    return {
      metadata,
      content: body.content,
      status: 'planning',
      taskCount: 0,
      completedTaskCount: 0,
      dependencyCount: 0,
    };
  }

  /** Update a Plan's markdown */
  async updatePlan(
    projectId: string,
    planId: string,
    body: { content: string },
  ): Promise<Plan> {
    const plansDir = await this.getPlansDir(projectId);
    await fs.writeFile(path.join(plansDir, `${planId}.md`), body.content);
    return this.getPlan(projectId, planId);
  }

  /** Ship a Plan — close the gating task to unblock child tasks */
  async shipPlan(projectId: string, planId: string): Promise<Plan> {
    const plan = await this.getPlan(projectId, planId);
    const project = await this.projectService.getProject(projectId);

    if (plan.metadata.gateTaskId) {
      await this.beads.close(project.repoPath, plan.metadata.gateTaskId, 'Plan shipped');
    }

    // Update metadata
    const plansDir = await this.getPlansDir(projectId);
    plan.metadata.shippedAt = new Date().toISOString();
    await fs.writeFile(
      path.join(plansDir, `${planId}.meta.json`),
      JSON.stringify(plan.metadata, null, 2),
    );

    return { ...plan, status: 'shipped' };
  }

  /** Re-ship an updated Plan */
  async reshipPlan(projectId: string, planId: string): Promise<Plan> {
    // TODO: Verify all existing tasks are Done or none started
    // TODO: Generate delta tasks
    return this.shipPlan(projectId, planId);
  }

  /** Get the dependency graph for all Plans */
  async getDependencyGraph(projectId: string): Promise<PlanDependencyGraph> {
    const plans = await this.listPlans(projectId);
    return {
      plans,
      edges: [], // TODO: Build from beads dependency data
    };
  }
}
