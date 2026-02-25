/**
 * TaskPhaseCoordinator — safe join point for parallel test + review results.
 *
 * When coding succeeds, tests and review run concurrently. This coordinator
 * collects both outcomes and calls a single resolution handler when both
 * are complete, eliminating the race where two async paths mutate slot state.
 */

import type { TestResults, ReviewAgentResult } from "@opensprint/shared";
import { createLogger } from "../utils/logger.js";

const log = createLogger("phase-coordinator");

export interface TestOutcome {
  status: "passed" | "failed" | "error";
  results?: TestResults;
  rawOutput?: string;
  errorMessage?: string;
}

export interface ReviewOutcome {
  status: "approved" | "rejected" | "no_result" | "error";
  result?: ReviewAgentResult | null;
  exitCode: number | null;
}

export type PhaseResolution = (test: TestOutcome, review: ReviewOutcome) => Promise<void>;

export class TaskPhaseCoordinator {
  private testOutcome: TestOutcome | null = null;
  private reviewOutcome: ReviewOutcome | null = null;
  private resolved = false;

  constructor(
    private readonly taskId: string,
    private readonly resolve: PhaseResolution
  ) {}

  setTestOutcome(outcome: TestOutcome): void {
    if (this.resolved) return;
    this.testOutcome = outcome;
    log.info("Test outcome received", { taskId: this.taskId, status: outcome.status });
    this.tryResolve();
  }

  setReviewOutcome(outcome: ReviewOutcome): void {
    if (this.resolved) return;
    this.reviewOutcome = outcome;
    log.info("Review outcome received", { taskId: this.taskId, status: outcome.status });
    this.tryResolve();
  }

  private tryResolve(): void {
    if (this.resolved || !this.testOutcome || !this.reviewOutcome) return;
    this.resolved = true;
    log.info("Both outcomes ready, resolving", {
      taskId: this.taskId,
      test: this.testOutcome.status,
      review: this.reviewOutcome.status,
    });
    this.resolve(this.testOutcome, this.reviewOutcome).catch((err) => {
      log.error("Phase resolution failed", { taskId: this.taskId, err });
    });
  }
}
