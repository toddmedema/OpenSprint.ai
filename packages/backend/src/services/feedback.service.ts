import fs from 'fs/promises';
import path from 'path';
import { v4 as uuid } from 'uuid';
import type { FeedbackItem, FeedbackSubmitRequest } from '@opensprint/shared';
import { OPENSPRINT_PATHS } from '@opensprint/shared';
import { ProjectService } from './project.service.js';

export class FeedbackService {
  private projectService = new ProjectService();

  /** Get feedback directory for a project */
  private async getFeedbackDir(projectId: string): Promise<string> {
    const project = await this.projectService.getProject(projectId);
    return path.join(project.repoPath, OPENSPRINT_PATHS.feedback);
  }

  /** List all feedback items */
  async listFeedback(projectId: string): Promise<FeedbackItem[]> {
    const feedbackDir = await this.getFeedbackDir(projectId);
    const items: FeedbackItem[] = [];

    try {
      const files = await fs.readdir(feedbackDir);
      for (const file of files) {
        if (file.endsWith('.json')) {
          const data = await fs.readFile(path.join(feedbackDir, file), 'utf-8');
          items.push(JSON.parse(data) as FeedbackItem);
        }
      }
    } catch {
      // No feedback yet
    }

    return items.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }

  /** Submit new feedback */
  async submitFeedback(
    projectId: string,
    body: FeedbackSubmitRequest,
  ): Promise<FeedbackItem> {
    const feedbackDir = await this.getFeedbackDir(projectId);
    const id = uuid();

    const item: FeedbackItem = {
      id,
      text: body.text,
      category: 'bug', // TODO: AI categorization
      mappedPlanId: null,
      createdTaskIds: [],
      status: 'pending',
      createdAt: new Date().toISOString(),
    };

    await fs.writeFile(
      path.join(feedbackDir, `${id}.json`),
      JSON.stringify(item, null, 2),
    );

    // TODO: Invoke planning agent to categorize and map feedback
    // TODO: Create beads tickets from mapped feedback
    // TODO: Broadcast feedback.mapped event via WebSocket

    return item;
  }

  /** Get a single feedback item */
  async getFeedback(projectId: string, feedbackId: string): Promise<FeedbackItem> {
    const feedbackDir = await this.getFeedbackDir(projectId);
    const data = await fs.readFile(path.join(feedbackDir, `${feedbackId}.json`), 'utf-8');
    return JSON.parse(data) as FeedbackItem;
  }
}
