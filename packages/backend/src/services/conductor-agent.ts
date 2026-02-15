import type { AgentConfig } from '@opensprint/shared';
import { AgentClient } from './agent-client.js';
import { ContextAssembler } from './context-assembler.js';

const CONDUCTOR_SYSTEM_PROMPT = `You are a context conductor for an AI software development system.
Your role is to intelligently summarize and prioritize context for coding agents working on tasks.

Given a set of context files (PRD sections, Plan markdown, dependency outputs), produce a
concise, focused context summary that contains only the information relevant to the specific
task at hand. Remove redundant or irrelevant information while preserving critical details.

Output a single markdown document that serves as the optimized context for the coding agent.`;

/**
 * Conductor agent for intelligent context summarization (v2.0).
 * Instead of passing raw Plan + dependency diffs, the conductor
 * summarizes relevant context into a concise prompt.
 */
export class ConductorAgent {
  private agentClient = new AgentClient();
  private contextAssembler = new ContextAssembler();

  /**
   * Summarize context for a task using the conductor agent.
   */
  async summarizeContext(
    agentConfig: AgentConfig,
    repoPath: string,
    taskTitle: string,
    taskDescription: string,
    planContent: string,
    prdExcerpt: string,
    dependencyOutputs: Array<{ taskId: string; diff: string; summary: string }>,
  ): Promise<string> {
    const contextParts: string[] = [];

    contextParts.push(`# Task: ${taskTitle}\n\n${taskDescription}\n`);
    contextParts.push(`# Plan Specification\n\n${planContent}\n`);

    if (prdExcerpt) {
      contextParts.push(`# Product Requirements\n\n${prdExcerpt}\n`);
    }

    if (dependencyOutputs.length > 0) {
      contextParts.push(`# Dependency Outputs\n\n`);
      for (const dep of dependencyOutputs) {
        contextParts.push(`## ${dep.taskId}\n${dep.summary}\n\nDiff:\n\`\`\`\n${dep.diff.slice(0, 5000)}\n\`\`\`\n`);
      }
    }

    const fullContext = contextParts.join('\n---\n\n');

    // If context is small enough, skip summarization
    if (fullContext.length < 10000) {
      return fullContext;
    }

    try {
      const response = await this.agentClient.invoke({
        config: agentConfig,
        prompt: `Summarize the following context for a coding agent working on "${taskTitle}":\n\n${fullContext}`,
        systemPrompt: CONDUCTOR_SYSTEM_PROMPT,
        cwd: repoPath,
      });

      return response.content;
    } catch (error) {
      console.error('Conductor agent summarization failed, using raw context:', error);
      return fullContext;
    }
  }
}

export const conductorAgent = new ConductorAgent();
