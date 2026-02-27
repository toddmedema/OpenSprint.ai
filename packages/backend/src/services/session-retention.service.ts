/**
 * Hourly cleanup job for agent_sessions retention.
 * Keeps only the 100 most recent entries; prunes older entries and runs VACUUM.
 * Active/in-progress sessions are not in agent_sessions until archived, so no impact.
 */

import { taskStore } from "./task-store.service.js";
import { createLogger } from "../utils/logger.js";

const log = createLogger("session-retention");
const RETENTION_INTERVAL_MS = 60 * 60 * 1000; // 1 hour

export class SessionRetentionService {
  private interval: NodeJS.Timeout | null = null;

  start(): void {
    if (this.interval) return;

    this.interval = setInterval(() => {
      this.runCleanup().catch((err) => {
        log.warn("Session retention cleanup failed", { err });
      });
    }, RETENTION_INTERVAL_MS);

    log.info("Started", { intervalSec: RETENTION_INTERVAL_MS / 1000 });
  }

  stop(): void {
    if (this.interval) {
      clearInterval(this.interval);
      this.interval = null;
    }
  }

  private async runCleanup(): Promise<void> {
    try {
      const pruned = await taskStore.pruneAgentSessions();
      if (pruned > 0) {
        log.info("Session retention completed", { pruned });
      }
    } catch (err) {
      log.warn("Session retention error", { err });
      throw err;
    }
  }
}

export const sessionRetentionService = new SessionRetentionService();
