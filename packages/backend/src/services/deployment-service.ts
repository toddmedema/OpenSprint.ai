import { exec } from 'child_process';
import { promisify } from 'util';
import type { DeploymentConfig } from '@opensprint/shared';
import { ProjectService } from './project.service.js';
import { broadcastToProject } from '../websocket/index.js';

const execAsync = promisify(exec);

export interface DeploymentResult {
  success: boolean;
  url?: string;
  error?: string;
  timestamp: string;
}

/**
 * Manages deployment after successful Build cycles.
 * Supports Expo.dev (EAS Build/Update) and custom pipelines.
 */
export class DeploymentService {
  private projectService = new ProjectService();

  /**
   * Deploy the project using the configured deployment mode.
   */
  async deploy(projectId: string): Promise<DeploymentResult> {
    const settings = await this.projectService.getSettings(projectId);
    const project = await this.projectService.getProject(projectId);

    try {
      let result: DeploymentResult;

      switch (settings.deployment.mode) {
        case 'expo':
          result = await this.deployExpo(project.repoPath, settings.deployment);
          break;
        case 'custom':
          result = await this.deployCustom(project.repoPath, settings.deployment);
          break;
        default:
          result = {
            success: false,
            error: `Unknown deployment mode: ${settings.deployment.mode}`,
            timestamp: new Date().toISOString(),
          };
      }

      return result;
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error),
        timestamp: new Date().toISOString(),
      };
    }
  }

  /**
   * Deploy using Expo.dev / EAS.
   */
  private async deployExpo(
    repoPath: string,
    config: DeploymentConfig,
  ): Promise<DeploymentResult> {
    try {
      // Run EAS Update for preview deployment
      const { stdout } = await execAsync(
        'npx eas-cli update --auto --non-interactive --json',
        {
          cwd: repoPath,
          timeout: 600000, // 10 min timeout
          env: { ...process.env },
        },
      );

      // Parse EAS output for URL
      try {
        const output = JSON.parse(stdout);
        return {
          success: true,
          url: output.url || output.link,
          timestamp: new Date().toISOString(),
        };
      } catch {
        return {
          success: true,
          url: undefined,
          timestamp: new Date().toISOString(),
        };
      }
    } catch (error: unknown) {
      const err = error as { stderr?: string; message: string };
      return {
        success: false,
        error: `Expo deployment failed: ${err.stderr || err.message}`,
        timestamp: new Date().toISOString(),
      };
    }
  }

  /**
   * Run EAS Build for full native builds.
   */
  async buildExpo(
    repoPath: string,
    platform: 'ios' | 'android' | 'all',
    profile: string = 'preview',
  ): Promise<DeploymentResult> {
    try {
      const platformArg = platform === 'all' ? '--platform all' : `--platform ${platform}`;
      const { stdout } = await execAsync(
        `npx eas-cli build ${platformArg} --profile ${profile} --non-interactive --json`,
        {
          cwd: repoPath,
          timeout: 1800000, // 30 min timeout
          env: { ...process.env },
        },
      );

      try {
        const output = JSON.parse(stdout);
        return {
          success: true,
          url: output.buildUrl || output.url,
          timestamp: new Date().toISOString(),
        };
      } catch {
        return {
          success: true,
          timestamp: new Date().toISOString(),
        };
      }
    } catch (error: unknown) {
      const err = error as { stderr?: string; message: string };
      return {
        success: false,
        error: `Expo build failed: ${err.stderr || err.message}`,
        timestamp: new Date().toISOString(),
      };
    }
  }

  /**
   * Deploy using a custom pipeline command.
   */
  private async deployCustom(
    repoPath: string,
    config: DeploymentConfig,
  ): Promise<DeploymentResult> {
    if (!config.customCommand) {
      return {
        success: false,
        error: 'No custom deployment command configured',
        timestamp: new Date().toISOString(),
      };
    }

    try {
      const { stdout } = await execAsync(config.customCommand, {
        cwd: repoPath,
        timeout: 600000,
        env: { ...process.env },
      });

      return {
        success: true,
        url: undefined,
        timestamp: new Date().toISOString(),
      };
    } catch (error: unknown) {
      const err = error as { stderr?: string; message: string };
      return {
        success: false,
        error: `Custom deployment failed: ${err.stderr || err.message}`,
        timestamp: new Date().toISOString(),
      };
    }
  }
}

export const deploymentService = new DeploymentService();
