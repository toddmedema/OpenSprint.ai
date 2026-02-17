import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import fs from "fs/promises";
import path from "path";
import os from "os";
import {
  OrchestratorService,
  formatReviewFeedback,
} from "../services/orchestrator.service.js";
import type { ReviewAgentResult } from "@opensprint/shared";
import { OPENSPRINT_PATHS } from "@opensprint/shared";

// ─── Mocks ───

const mockBroadcastToProject = vi.fn();
const mockSendAgentOutputToProject = vi.fn();

vi.mock("../websocket/index.js", () => ({
  broadcastToProject: (...args: unknown[]) => mockBroadcastToProject(...args),
  sendAgentOutputToProject: (...args: unknown[]) =>
    mockSendAgentOutputToProject(...args),
}));

const mockBeadsReady = vi.fn();
const mockBeadsShow = vi.fn();
const mockBeadsUpdate = vi.fn();
const mockBeadsClose = vi.fn();
const mockBeadsComment = vi.fn();
const mockBeadsHasLabel = vi.fn();
const mockBeadsAreAllBlockersClosed = vi.fn();
const mockBeadsGetCumulativeAttempts = vi.fn();
const mockBeadsSetCumulativeAttempts = vi.fn();
const mockBeadsAddLabel = vi.fn();

vi.mock("../services/beads.service.js", () => ({
  BeadsService: vi.fn().mockImplementation(() => ({
    ready: mockBeadsReady,
    show: mockBeadsShow,
    update: mockBeadsUpdate,
    close: mockBeadsClose,
    comment: mockBeadsComment,
    hasLabel: mockBeadsHasLabel,
    areAllBlockersClosed: mockBeadsAreAllBlockersClosed,
    getCumulativeAttempts: mockBeadsGetCumulativeAttempts,
    setCumulativeAttempts: mockBeadsSetCumulativeAttempts,
    addLabel: mockBeadsAddLabel,
  })),
}));

const mockGetProject = vi.fn();
const mockGetRepoPath = vi.fn();
const mockGetSettings = vi.fn();

vi.mock("../services/project.service.js", () => ({
  ProjectService: vi.fn().mockImplementation(() => ({
    getProject: mockGetProject,
    getRepoPath: mockGetRepoPath,
    getSettings: mockGetSettings,
  })),
}));

const mockCreateTaskWorktree = vi.fn();
const mockRemoveTaskWorktree = vi.fn();
const mockDeleteBranch = vi.fn();
const mockGetCommitCountAhead = vi.fn();
const mockCaptureBranchDiff = vi.fn();
const mockEnsureOnMain = vi.fn();
const mockWaitForGitReady = vi.fn();
const mockSymlinkNodeModules = vi.fn();
const mockMergeToMain = vi.fn();
const mockVerifyMerge = vi.fn();
const mockPushMain = vi.fn();
const mockGetChangedFiles = vi.fn();
const mockCommitWip = vi.fn();

vi.mock("../services/branch-manager.js", () => ({
  BranchManager: vi.fn().mockImplementation(() => ({
    createTaskWorktree: mockCreateTaskWorktree,
    removeTaskWorktree: mockRemoveTaskWorktree,
    deleteBranch: mockDeleteBranch,
    getCommitCountAhead: mockGetCommitCountAhead,
    captureBranchDiff: mockCaptureBranchDiff,
    captureUncommittedDiff: vi.fn().mockResolvedValue(""),
    ensureOnMain: mockEnsureOnMain,
    waitForGitReady: mockWaitForGitReady,
    symlinkNodeModules: mockSymlinkNodeModules,
    mergeToMain: mockMergeToMain,
    verifyMerge: mockVerifyMerge,
    pushMain: mockPushMain,
    getChangedFiles: mockGetChangedFiles,
    commitWip: mockCommitWip,
  })),
}));

const mockBuildContext = vi.fn();
const mockAssembleTaskDirectory = vi.fn();

vi.mock("../services/context-assembler.js", () => ({
  ContextAssembler: vi.fn().mockImplementation(() => ({
    buildContext: mockBuildContext,
    assembleTaskDirectory: mockAssembleTaskDirectory,
  })),
}));

const mockGetActiveDir = vi.fn();
const mockReadResult = vi.fn();
const mockClearResult = vi.fn();
const mockCreateSession = vi.fn();
const mockArchiveSession = vi.fn();

vi.mock("../services/session-manager.js", () => ({
  SessionManager: vi.fn().mockImplementation(() => ({
    getActiveDir: mockGetActiveDir,
    readResult: mockReadResult,
    clearResult: mockClearResult,
    createSession: mockCreateSession,
    archiveSession: mockArchiveSession,
  })),
}));

const mockRunScopedTests = vi.fn();

vi.mock("../services/test-runner.js", () => ({
  TestRunner: vi.fn().mockImplementation(() => ({
    runScopedTests: mockRunScopedTests,
  })),
}));

const mockInvokeCodingAgent = vi.fn();
const mockInvokeReviewAgent = vi.fn();

vi.mock("../services/agent.service.js", () => ({
  agentService: {
    invokeCodingAgent: mockInvokeCodingAgent,
    invokeReviewAgent: mockInvokeReviewAgent,
  },
}));

vi.mock("../services/deployment-service.js", () => ({
  deploymentService: { deploy: vi.fn().mockResolvedValue(undefined) },
}));

const mockRecoverOrphanedTasks = vi.fn();
const mockRecoverFromStaleHeartbeats = vi.fn();

vi.mock("../services/orphan-recovery.service.js", () => ({
  orphanRecoveryService: {
    recoverOrphanedTasks: mockRecoverOrphanedTasks,
    recoverFromStaleHeartbeats: mockRecoverFromStaleHeartbeats,
  },
}));

vi.mock("../services/heartbeat.service.js", () => ({
  heartbeatService: {
    writeHeartbeat: vi.fn().mockResolvedValue(undefined),
    deleteHeartbeat: vi.fn().mockResolvedValue(undefined),
  },
}));

const mockWriteJsonAtomic = vi.fn();

vi.mock("../utils/file-utils.js", () => ({
  writeJsonAtomic: (...args: unknown[]) => mockWriteJsonAtomic(...args),
}));

// ─── Tests ───

describe("OrchestratorService", () => {
  let orchestrator: OrchestratorService;
  let repoPath: string;
  const projectId = "test-project-1";

  beforeEach(async () => {
    vi.clearAllMocks();
    orchestrator = new OrchestratorService();

    repoPath = path.join(os.tmpdir(), `orchestrator-test-${Date.now()}`);
    await fs.mkdir(repoPath, { recursive: true });
    await fs.mkdir(path.join(repoPath, ".opensprint"), { recursive: true });

    mockGetProject.mockResolvedValue({ id: projectId });
    mockGetRepoPath.mockResolvedValue(repoPath);
    mockGetSettings.mockResolvedValue({
      testFramework: "vitest",
      codingAgent: { type: "claude", model: "claude-sonnet-4", cliCommand: null },
      reviewMode: "never",
    });
    mockRecoverOrphanedTasks.mockResolvedValue({ recovered: [] });
    mockRecoverFromStaleHeartbeats.mockResolvedValue({ recovered: [] });
  });

  afterEach(async () => {
    orchestrator.stopProject(projectId);
    try {
      await fs.rm(repoPath, { recursive: true, force: true });
    } catch {
      // ignore
    }
  });

  describe("formatReviewFeedback (exported helper)", () => {
    it("formats result with summary only", () => {
      const result: ReviewAgentResult = {
        status: "rejected",
        summary: "Tests do not adequately cover the ticket scope.",
        notes: "",
      };
      expect(formatReviewFeedback(result)).toBe(
        "Tests do not adequately cover the ticket scope.",
      );
    });

    it("formats result with summary and issues", () => {
      const result: ReviewAgentResult = {
        status: "rejected",
        summary: "Implementation has quality issues.",
        issues: ["Missing error handling", "Tests do not cover edge cases"],
        notes: "",
      };
      const formatted = formatReviewFeedback(result);
      expect(formatted).toContain("Implementation has quality issues.");
      expect(formatted).toContain("Issues to address:");
      expect(formatted).toContain("- Missing error handling");
      expect(formatted).toContain("- Tests do not cover edge cases");
    });
  });

  describe("getStatus", () => {
    it("returns default status when project exists", async () => {
      const status = await orchestrator.getStatus(projectId);
      expect(status).toEqual({
        currentTask: null,
        currentPhase: null,
        queueDepth: 0,
        totalCompleted: 0,
        totalFailed: 0,
      });
      expect(mockGetProject).toHaveBeenCalledWith(projectId);
    });
  });

  describe("getActiveAgents", () => {
    it("returns empty array when idle", async () => {
      const agents = await orchestrator.getActiveAgents(projectId);
      expect(agents).toEqual([]);
      expect(mockGetProject).toHaveBeenCalledWith(projectId);
    });
  });

  describe("stopProject", () => {
    it("does nothing when project has no state", () => {
      expect(() => orchestrator.stopProject(projectId)).not.toThrow();
    });

    it("cleans up state when project has state", async () => {
      // Get state by calling getStatus first
      await orchestrator.getStatus(projectId);
      orchestrator.stopProject(projectId);
      // After stop, getStatus would create fresh state
      const status = await orchestrator.getStatus(projectId);
      expect(status.currentTask).toBeNull();
    });
  });

  describe("nudge", () => {
    it("does not start loop when no ready tasks", async () => {
      mockBeadsReady.mockResolvedValue([]);

      await orchestrator.ensureRunning(projectId);
      orchestrator.nudge(projectId);

      // Give loop time to run
      await new Promise((r) => setTimeout(r, 100));

      // Should have broadcast build.status with null task
      expect(mockBroadcastToProject).toHaveBeenCalledWith(
        projectId,
        expect.objectContaining({
          type: "build.status",
          currentTask: null,
          queueDepth: 0,
        }),
      );
    });

    it("does not start second loop when one is already active", async () => {
      mockBeadsReady.mockResolvedValue([
        {
          id: "task-1",
          title: "Test task",
          issue_type: "task",
          priority: 2,
          status: "open",
        },
      ]);
      mockBeadsAreAllBlockersClosed.mockResolvedValue(true);
      mockBeadsGetCumulativeAttempts.mockResolvedValue(0);
      mockCreateTaskWorktree.mockResolvedValue(path.join(repoPath, "wt-1"));
      mockGetActiveDir.mockReturnValue(path.join(repoPath, "wt-1", ".opensprint", "active", "task-1"));
      mockBuildContext.mockResolvedValue({});
      mockAssembleTaskDirectory.mockResolvedValue(undefined);

      // Never actually spawn agent - make createTaskWorktree throw after first call to simulate
      // loop being "active" during the coding phase setup. Actually, the loop will call
      // executeCodingPhase which will call createTaskWorktree. If we make the agent spawn
      // return a handle that never exits, the loop stays "active".
      const mockKill = vi.fn();
      mockInvokeCodingAgent.mockReturnValue({
        kill: mockKill,
        pid: 12345,
      });

      await orchestrator.ensureRunning(projectId);

      // First nudge starts the loop. Second nudge while loop is active should return early.
      const broadcastCallsBefore = mockBroadcastToProject.mock.calls.length;
      orchestrator.nudge(projectId);
      orchestrator.nudge(projectId);
      await new Promise((r) => setTimeout(r, 200));
      // Should not have started a second runLoop - we'd see duplicate agent.started if so
      const agentStartedCalls = mockBroadcastToProject.mock.calls.filter(
        (c: [string, { type?: string }]) => c[1]?.type === "agent.started",
      );
      expect(agentStartedCalls.length).toBeLessThanOrEqual(1);
    });
  });

  describe("ensureRunning - crash recovery", () => {
    it("performs crash recovery when persisted state has dead PID and no commits", async () => {
      const persistedState = {
        projectId,
        currentTaskId: "task-crashed",
        currentTaskTitle: "Crashed task",
        currentPhase: "coding" as const,
        branchName: "opensprint/task-crashed",
        worktreePath: null,
        agentPid: 999999999, // Non-existent PID (dead)
        attempt: 1,
        startedAt: new Date().toISOString(),
        lastTransition: new Date().toISOString(),
        queueDepth: 0,
        totalCompleted: 0,
        totalFailed: 0,
      };

      const statePath = path.join(repoPath, OPENSPRINT_PATHS.orchestratorState);
      await fs.writeFile(statePath, JSON.stringify(persistedState), "utf-8");

      mockGetCommitCountAhead.mockResolvedValue(0);
      mockCaptureBranchDiff.mockResolvedValue("");

      await orchestrator.ensureRunning(projectId);

      // Wait for async recovery
      await new Promise((r) => setTimeout(r, 150));

      // Should have cleared persisted state (unlink)
      const statePathAfter = path.join(repoPath, OPENSPRINT_PATHS.orchestratorState);
      await expect(fs.access(statePathAfter)).rejects.toThrow();

      // Should have removed worktree
      expect(mockRemoveTaskWorktree).toHaveBeenCalledWith(repoPath, "task-crashed");

      // Should have deleted branch (no commits to preserve)
      expect(mockDeleteBranch).toHaveBeenCalledWith(repoPath, "opensprint/task-crashed");

      // Should have commented on task
      expect(mockBeadsComment).toHaveBeenCalledWith(
        repoPath,
        "task-crashed",
        "Agent crashed (backend restart). No committed work found, task requeued.",
      );

      // Should have requeued task
      expect(mockBeadsUpdate).toHaveBeenCalledWith(repoPath, "task-crashed", {
        status: "open",
        assignee: "",
      });

      // Should have broadcast task.updated
      expect(mockBroadcastToProject).toHaveBeenCalledWith(
        projectId,
        expect.objectContaining({
          type: "task.updated",
          taskId: "task-crashed",
          status: "open",
          assignee: null,
        }),
      );
    });

    it("preserves branch when crash recovery finds committed work", async () => {
      const persistedState = {
        projectId,
        currentTaskId: "task-crashed-2",
        currentTaskTitle: "Task with work",
        currentPhase: "coding" as const,
        branchName: "opensprint/task-crashed-2",
        worktreePath: null,
        agentPid: 999999999,
        attempt: 1,
        startedAt: new Date().toISOString(),
        lastTransition: new Date().toISOString(),
        queueDepth: 0,
        totalCompleted: 0,
        totalFailed: 0,
      };

      const statePath = path.join(repoPath, OPENSPRINT_PATHS.orchestratorState);
      await fs.writeFile(statePath, JSON.stringify(persistedState), "utf-8");

      mockGetCommitCountAhead.mockResolvedValue(2);
      mockCaptureBranchDiff.mockResolvedValue("diff content");

      await orchestrator.ensureRunning(projectId);

      await new Promise((r) => setTimeout(r, 150));

      // Should NOT have deleted branch (has commits)
      expect(mockDeleteBranch).not.toHaveBeenCalled();

      // Should have commented about preserving branch
      expect(mockBeadsComment).toHaveBeenCalledWith(
        repoPath,
        "task-crashed-2",
        "Agent crashed (backend restart). Branch preserved with 2 commits for next attempt.",
      );

      // Should still requeue
      expect(mockBeadsUpdate).toHaveBeenCalledWith(repoPath, "task-crashed-2", {
        status: "open",
        assignee: "",
      });
    });

    it("starts fresh when persisted state has no active task", async () => {
      const persistedState = {
        projectId,
        currentTaskId: null,
        currentTaskTitle: null,
        currentPhase: null,
        branchName: null,
        worktreePath: null,
        agentPid: null,
        attempt: 1,
        startedAt: null,
        lastTransition: new Date().toISOString(),
        queueDepth: 0,
        totalCompleted: 5,
        totalFailed: 1,
      };

      const statePath = path.join(repoPath, OPENSPRINT_PATHS.orchestratorState);
      await fs.writeFile(statePath, JSON.stringify(persistedState), "utf-8");

      mockBeadsReady.mockResolvedValue([]);

      await orchestrator.ensureRunning(projectId);

      await new Promise((r) => setTimeout(r, 150));

      // State file should be cleared
      await expect(
        fs.access(path.join(repoPath, OPENSPRINT_PATHS.orchestratorState)),
      ).rejects.toThrow();
    });
  });

  describe("ensureRunning - full loop with task completion", () => {
    it("completes task when coding succeeds and reviewMode is never", async () => {
      const task = {
        id: "task-complete-1",
        title: "Complete me",
        issue_type: "task",
        priority: 2,
        status: "open",
      };

      const wtPathComplete = path.join(repoPath, "wt-complete");
      await fs.mkdir(path.join(wtPathComplete, "node_modules"), {
        recursive: true,
      });

      mockBeadsReady.mockResolvedValue([task]);
      mockBeadsAreAllBlockersClosed.mockResolvedValue(true);
      mockBeadsGetCumulativeAttempts.mockResolvedValue(0);
      mockCreateTaskWorktree.mockResolvedValue(wtPathComplete);
      mockGetActiveDir.mockReturnValue(
        path.join(repoPath, "wt-complete", ".opensprint", "active", "task-complete-1"),
      );
      mockBuildContext.mockResolvedValue({});
      mockAssembleTaskDirectory.mockResolvedValue(undefined);
      mockGetChangedFiles.mockResolvedValue([]);
      mockRunScopedTests.mockResolvedValue({
        passed: 3,
        failed: 0,
        rawOutput: "tests passed",
      });
      mockReadResult.mockResolvedValue({ status: "success", summary: "Done" });

      let onExit: (code: number | null) => Promise<void> = async () => {};
      mockInvokeCodingAgent.mockImplementation(
        (
          _p: string,
          _c: unknown,
          opts: { onExit?: (code: number | null) => Promise<void> },
        ) => {
          onExit = opts.onExit ?? (async () => {});
          return { kill: vi.fn(), pid: 12345 };
        },
      );

      await orchestrator.ensureRunning(projectId);

      await new Promise((r) => setTimeout(r, 300));

      mockBeadsShow.mockResolvedValue({ ...task, status: "in_progress" });
      mockMergeToMain.mockResolvedValue(undefined);
      mockCreateSession.mockResolvedValue({ id: "sess-1" });
      mockArchiveSession.mockResolvedValue(undefined);

      await onExit(0);

      await new Promise((r) => setTimeout(r, 300));

      // Should have merged and closed
      expect(mockBeadsClose).toHaveBeenCalledWith(
        repoPath,
        "task-complete-1",
        "Done",
      );
      expect(mockMergeToMain).toHaveBeenCalledWith(
        repoPath,
        "opensprint/task-complete-1",
      );
      expect(mockBroadcastToProject).toHaveBeenCalledWith(
        projectId,
        expect.objectContaining({
          type: "agent.completed",
          taskId: "task-complete-1",
          status: "approved",
        }),
      );
    });
  });

  describe("progressive backoff - test failure retry", () => {
    it("retries immediately when tests fail (attempt 1, not demotion point)", async () => {
      const task = {
        id: "task-test-fail",
        title: "Task with test failure",
        issue_type: "task",
        priority: 2,
        status: "open",
      };

      const wtPath = path.join(repoPath, "wt-fail");
      await fs.mkdir(path.join(wtPath, "node_modules"), { recursive: true });

      mockBeadsReady.mockResolvedValue([task]);
      mockBeadsAreAllBlockersClosed.mockResolvedValue(true);
      mockBeadsGetCumulativeAttempts.mockResolvedValue(0);
      mockCreateTaskWorktree.mockResolvedValue(wtPath);
      mockGetActiveDir.mockReturnValue(
        path.join(repoPath, "wt-fail", ".opensprint", "active", "task-test-fail"),
      );
      mockBuildContext.mockResolvedValue({});
      mockAssembleTaskDirectory.mockResolvedValue(undefined);
      mockGetChangedFiles.mockResolvedValue([]);
      // Agent succeeds but tests fail
      mockReadResult.mockResolvedValue({ status: "success", summary: "Code done" });
      mockRunScopedTests.mockResolvedValue({
        passed: 1,
        failed: 2,
        rawOutput: "2 tests failed",
      });

      let onExit: (code: number | null) => Promise<void> = async () => {};
      mockInvokeCodingAgent.mockImplementation(
        (
          _p: string,
          _c: unknown,
          opts: { onExit?: (code: number | null) => Promise<void> },
        ) => {
          onExit = opts.onExit ?? (async () => {});
          return { kill: vi.fn(), pid: 12345 };
        },
      );

      await orchestrator.ensureRunning(projectId);
      await new Promise((r) => setTimeout(r, 300));

      mockBeadsSetCumulativeAttempts.mockResolvedValue(undefined);

      await onExit(0);
      await new Promise((r) => setTimeout(r, 400));

      // Should have added failure comment
      expect(mockBeadsComment).toHaveBeenCalledWith(
        repoPath,
        "task-test-fail",
        expect.stringContaining("Attempt 1 failed [test_failure]"),
      );

      // Should have archived session
      expect(mockArchiveSession).toHaveBeenCalled();

      // Should have set cumulative attempts for retry
      expect(mockBeadsSetCumulativeAttempts).toHaveBeenCalledWith(
        repoPath,
        "task-test-fail",
        1,
      );

      // Should retry (executeCodingPhase called again) - removeTaskWorktree then createTaskWorktree
      expect(mockRemoveTaskWorktree).toHaveBeenCalledWith(repoPath, "task-test-fail");
      // Second call to createTaskWorktree for retry
      expect(mockCreateTaskWorktree.mock.calls.length).toBeGreaterThanOrEqual(1);
    });
  });
});
