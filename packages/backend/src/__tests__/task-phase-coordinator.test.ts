import type { TestResults, ReviewAgentResult } from "@opensprint/shared";
import { describe, it, expect, vi } from "vitest";
import {
  TaskPhaseCoordinator,
  type TestOutcome,
  type ReviewOutcome,
} from "../services/task-phase-coordinator.js";

describe("TaskPhaseCoordinator", () => {
  const testPassed: TestOutcome = { status: "passed" };
  const testFailedResults: TestResults = { passed: 3, failed: 2, total: 5, rawOutput: "" };
  const testFailed: TestOutcome = { status: "failed", results: testFailedResults };
  const reviewApproved: ReviewOutcome = { status: "approved", result: null, exitCode: 0 };
  const reviewRejectedResult: ReviewAgentResult = {
    status: "rejected",
    issues: ["nit"],
    summary: "Bad",
    notes: "",
  };
  const reviewRejected: ReviewOutcome = {
    status: "rejected",
    result: reviewRejectedResult,
    exitCode: 0,
  };

  it("calls resolve when both outcomes arrive (test first)", async () => {
    const resolve = vi.fn().mockResolvedValue(undefined);
    const coord = new TaskPhaseCoordinator("t1", resolve);

    coord.setTestOutcome(testPassed);
    expect(resolve).not.toHaveBeenCalled();

    coord.setReviewOutcome(reviewApproved);
    expect(resolve).toHaveBeenCalledWith(testPassed, reviewApproved);
  });

  it("calls resolve when both outcomes arrive (review first)", async () => {
    const resolve = vi.fn().mockResolvedValue(undefined);
    const coord = new TaskPhaseCoordinator("t1", resolve);

    coord.setReviewOutcome(reviewRejected);
    expect(resolve).not.toHaveBeenCalled();

    coord.setTestOutcome(testFailed);
    expect(resolve).toHaveBeenCalledWith(testFailed, reviewRejected);
  });

  it("resolves only once even if outcomes are set multiple times", () => {
    const resolve = vi.fn().mockResolvedValue(undefined);
    const coord = new TaskPhaseCoordinator("t1", resolve);

    coord.setTestOutcome(testPassed);
    coord.setReviewOutcome(reviewApproved);
    coord.setTestOutcome(testFailed);
    coord.setReviewOutcome(reviewRejected);

    expect(resolve).toHaveBeenCalledTimes(1);
  });

  it("ignores outcomes after resolution", () => {
    const resolve = vi.fn().mockResolvedValue(undefined);
    const coord = new TaskPhaseCoordinator("t1", resolve);

    coord.setTestOutcome(testPassed);
    coord.setReviewOutcome(reviewApproved);
    expect(resolve).toHaveBeenCalledTimes(1);

    coord.setTestOutcome(testFailed);
    expect(resolve).toHaveBeenCalledTimes(1);
  });

  it("does not throw when resolve rejects", () => {
    const resolve = vi.fn().mockRejectedValue(new Error("boom"));
    const coord = new TaskPhaseCoordinator("t1", resolve);

    expect(() => {
      coord.setTestOutcome(testPassed);
      coord.setReviewOutcome(reviewApproved);
    }).not.toThrow();
  });
});
