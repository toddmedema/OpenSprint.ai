import { spawn, exec } from 'child_process';
import { promisify } from 'util';
import type { AgentType, AgentConfig } from '@opensprint/shared';

const execAsync = promisify(exec);

export interface AgentInvokeOptions {
  /** The agent config to use */
  config: AgentConfig;
  /** The prompt/message to send */
  prompt: string;
  /** System-level instructions */
  systemPrompt?: string;
  /** Conversation history for context */
  conversationHistory?: Array<{ role: 'user' | 'assistant'; content: string }>;
  /** Working directory for CLI agents */
  cwd?: string;
  /** Callback for streaming output chunks */
  onChunk?: (chunk: string) => void;
}

export interface AgentResponse {
  content: string;
  raw?: unknown;
}

/**
 * Unified agent invocation interface.
 * Supports Claude API, Cursor CLI, and Custom CLI agents.
 */
export class AgentClient {
  /**
   * Invoke an agent and get a response.
   */
  async invoke(options: AgentInvokeOptions): Promise<AgentResponse> {
    switch (options.config.type) {
      case 'claude':
        return this.invokeClaudeCli(options);
      case 'cursor':
        return this.invokeCursorCli(options);
      case 'custom':
        return this.invokeCustomCli(options);
      default:
        throw new Error(`Unsupported agent type: ${options.config.type}`);
    }
  }

  /**
   * Invoke agent with a task file (for Build phase).
   * Spawns the agent as a subprocess and streams output.
   */
  spawnWithTaskFile(
    config: AgentConfig,
    taskFilePath: string,
    cwd: string,
    onOutput: (chunk: string) => void,
    onExit: (code: number | null) => void,
  ): { kill: () => void } {
    let command: string;
    let args: string[];

    switch (config.type) {
      case 'claude':
        command = 'claude';
        args = ['--task-file', taskFilePath];
        if (config.model) {
          args.push('--model', config.model);
        }
        break;
      case 'cursor':
        command = 'cursor-agent';
        args = ['--input', taskFilePath];
        if (config.model) {
          args.push('--model', config.model);
        }
        break;
      case 'custom':
        if (!config.cliCommand) {
          throw new Error('Custom agent requires a CLI command');
        }
        const parts = config.cliCommand.split(' ');
        command = parts[0];
        args = [...parts.slice(1), taskFilePath];
        break;
      default:
        throw new Error(`Unsupported agent type: ${config.type}`);
    }

    const child = spawn(command, args, {
      cwd,
      stdio: ['pipe', 'pipe', 'pipe'],
      env: { ...process.env },
    });

    child.stdout.on('data', (data: Buffer) => {
      onOutput(data.toString());
    });

    child.stderr.on('data', (data: Buffer) => {
      onOutput(data.toString());
    });

    child.on('close', (code) => {
      onExit(code);
    });

    child.on('error', (err) => {
      onOutput(`[Agent process error: ${err.message}]\n`);
      onExit(1);
    });

    return {
      kill: () => {
        child.kill('SIGTERM');
        setTimeout(() => {
          if (!child.killed) {
            child.kill('SIGKILL');
          }
        }, 5000);
      },
    };
  }

  // ─── Private Invocation Methods ───

  private async invokeClaudeCli(options: AgentInvokeOptions): Promise<AgentResponse> {
    const { config, prompt, systemPrompt, conversationHistory } = options;

    // Build conversation context for Claude CLI
    let fullPrompt = '';
    if (systemPrompt) {
      fullPrompt += systemPrompt + '\n\n';
    }
    if (conversationHistory) {
      for (const msg of conversationHistory) {
        fullPrompt += `${msg.role === 'user' ? 'Human' : 'Assistant'}: ${msg.content}\n\n`;
      }
    }
    fullPrompt += `Human: ${prompt}\n\nAssistant:`;

    try {
      const modelArg = config.model ? `--model ${config.model}` : '';
      const { stdout } = await execAsync(
        `claude ${modelArg} --print "${fullPrompt.replace(/"/g, '\\"')}"`,
        {
          cwd: options.cwd || process.cwd(),
          timeout: 120000,
          maxBuffer: 10 * 1024 * 1024,
        },
      );

      const content = stdout.trim();
      if (options.onChunk) {
        options.onChunk(content);
      }

      return { content };
    } catch (error: unknown) {
      const err = error as { message: string; stderr?: string };
      throw new Error(`Claude CLI invocation failed: ${err.stderr || err.message}`);
    }
  }

  private async invokeCursorCli(options: AgentInvokeOptions): Promise<AgentResponse> {
    const { config, prompt } = options;

    try {
      const modelArg = config.model ? `--model ${config.model}` : '';
      const { stdout } = await execAsync(
        `cursor-agent ${modelArg} --input "${prompt.replace(/"/g, '\\"')}"`,
        {
          cwd: options.cwd || process.cwd(),
          timeout: 120000,
          maxBuffer: 10 * 1024 * 1024,
        },
      );

      const content = stdout.trim();
      if (options.onChunk) {
        options.onChunk(content);
      }

      return { content };
    } catch (error: unknown) {
      const err = error as { message: string; stderr?: string };
      throw new Error(`Cursor CLI invocation failed: ${err.stderr || err.message}`);
    }
  }

  private async invokeCustomCli(options: AgentInvokeOptions): Promise<AgentResponse> {
    const { config, prompt } = options;

    if (!config.cliCommand) {
      throw new Error('Custom agent requires a CLI command');
    }

    try {
      const { stdout } = await execAsync(
        `${config.cliCommand} "${prompt.replace(/"/g, '\\"')}"`,
        {
          cwd: options.cwd || process.cwd(),
          timeout: 120000,
          maxBuffer: 10 * 1024 * 1024,
        },
      );

      const content = stdout.trim();
      if (options.onChunk) {
        options.onChunk(content);
      }

      return { content };
    } catch (error: unknown) {
      const err = error as { message: string; stderr?: string };
      throw new Error(`Custom CLI invocation failed: ${err.stderr || err.message}`);
    }
  }
}
