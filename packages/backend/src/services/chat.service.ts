import fs from 'fs/promises';
import path from 'path';
import { v4 as uuid } from 'uuid';
import type {
  Conversation,
  ConversationMessage,
  ChatRequest,
  ChatResponse,
} from '@opensprint/shared';
import { OPENSPRINT_PATHS } from '@opensprint/shared';
import { ProjectService } from './project.service.js';

export class ChatService {
  private projectService = new ProjectService();

  /** Get conversations directory for a project */
  private async getConversationsDir(projectId: string): Promise<string> {
    const project = await this.projectService.getProject(projectId);
    return path.join(project.repoPath, OPENSPRINT_PATHS.conversations);
  }

  /** Find or create a conversation for a given context */
  private async getOrCreateConversation(
    projectId: string,
    context: string,
  ): Promise<Conversation> {
    const dir = await this.getConversationsDir(projectId);

    // Look for existing conversation with this context
    try {
      const files = await fs.readdir(dir);
      for (const file of files) {
        if (file.endsWith('.json')) {
          const data = await fs.readFile(path.join(dir, file), 'utf-8');
          const conv = JSON.parse(data) as Conversation;
          if (conv.context === context) {
            return conv;
          }
        }
      }
    } catch {
      // Directory may not exist yet
    }

    // Create new conversation
    const conversation: Conversation = {
      id: uuid(),
      context: context as Conversation['context'],
      messages: [],
    };

    await fs.mkdir(dir, { recursive: true });
    await fs.writeFile(
      path.join(dir, `${conversation.id}.json`),
      JSON.stringify(conversation, null, 2),
    );

    return conversation;
  }

  /** Save a conversation to disk */
  private async saveConversation(projectId: string, conversation: Conversation): Promise<void> {
    const dir = await this.getConversationsDir(projectId);
    await fs.writeFile(
      path.join(dir, `${conversation.id}.json`),
      JSON.stringify(conversation, null, 2),
    );
  }

  /** Send a message to the planning agent */
  async sendMessage(projectId: string, body: ChatRequest): Promise<ChatResponse> {
    const context = body.context ?? 'design';
    const conversation = await this.getOrCreateConversation(projectId, context);

    // Add user message
    const userMessage: ConversationMessage = {
      role: 'user',
      content: body.message,
      timestamp: new Date().toISOString(),
    };
    conversation.messages.push(userMessage);

    // TODO: Invoke the configured planning agent with conversation history + PRD context
    // TODO: Parse agent response for PRD changes
    // TODO: Apply PRD changes if present
    // TODO: Broadcast prd.updated event via WebSocket

    // Placeholder response
    const assistantMessage: ConversationMessage = {
      role: 'assistant',
      content: 'Agent integration pending. This is a placeholder response.',
      timestamp: new Date().toISOString(),
    };
    conversation.messages.push(assistantMessage);

    await this.saveConversation(projectId, conversation);

    return {
      message: assistantMessage.content,
    };
  }

  /** Get conversation history */
  async getHistory(projectId: string, context: string): Promise<Conversation> {
    return this.getOrCreateConversation(projectId, context);
  }
}
