import { describe, it, expect, vi, beforeEach } from "vitest";
import { AppError } from "../middleware/error-handler.js";
import { PrdFromCodebaseService } from "../services/prd-from-codebase.service.js";

const mockInvokePlanningAgent = vi.fn();
const mockBroadcastToProject = vi.fn();

vi.mock("../services/agent.service.js", () => ({
  agentService: {
    invokePlanningAgent: (...args: unknown[]) => mockInvokePlanningAgent(...args),
  },
}));

vi.mock("../websocket/index.js", () => ({
  broadcastToProject: (...args: unknown[]) => mockBroadcastToProject(...args),
}));

describe("PrdFromCodebaseService", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("updates PRD sections and broadcasts each change", async () => {
    const service = new PrdFromCodebaseService() as any;
    service.planService = {
      getCodebaseContext: vi.fn().mockResolvedValue({
        fileTree: "src/index.ts",
        keyFilesContent: "console.log('hi')",
      }),
    };
    service.projectService = {
      getSettings: vi.fn().mockResolvedValue({
        simpleComplexityAgent: { type: "cursor", model: null, cliCommand: null },
        complexComplexityAgent: { type: "claude", model: "claude-sonnet-4", cliCommand: null },
        hilConfig: { scopeChanges: "automated", architectureDecisions: "automated", dependencyModifications: "automated" },
      }),
      getRepoPath: vi.fn().mockResolvedValue("/repo"),
    };
    service.chatService = {
      parsePrdUpdatesFromContent: vi.fn().mockReturnValue([
        { section: "executive_summary", content: "Summary" },
        { section: "feature_list", content: "Features" },
      ]),
      addSketchAssistantMessage: vi.fn().mockResolvedValue(undefined),
    };
    service.prdService = {
      updateSections: vi.fn().mockResolvedValue([
        { section: "executive_summary", newVersion: 2 },
        { section: "feature_list", newVersion: 3 },
      ]),
    };
    mockInvokePlanningAgent.mockResolvedValue({
      content: "[PRD_UPDATE:executive_summary]\nSummary\n[/PRD_UPDATE]",
    });

    await service.generatePrdFromCodebase("proj-1");

    expect(mockInvokePlanningAgent).toHaveBeenCalledWith(
      expect.objectContaining({
        projectId: "proj-1",
        cwd: "/repo",
      })
    );
    expect(mockBroadcastToProject).toHaveBeenCalledTimes(2);
    expect(service.chatService.addSketchAssistantMessage).toHaveBeenCalled();
  });

  it("throws a user-facing error when the agent returns no PRD sections", async () => {
    const service = new PrdFromCodebaseService() as any;
    service.planService = {
      getCodebaseContext: vi.fn().mockResolvedValue({ fileTree: "", keyFilesContent: "" }),
    };
    service.projectService = {
      getSettings: vi.fn().mockResolvedValue({
        simpleComplexityAgent: { type: "cursor", model: null, cliCommand: null },
        complexComplexityAgent: { type: "claude", model: "claude-sonnet-4", cliCommand: null },
        hilConfig: { scopeChanges: "automated", architectureDecisions: "automated", dependencyModifications: "automated" },
      }),
      getRepoPath: vi.fn().mockResolvedValue("/repo"),
    };
    service.chatService = {
      parsePrdUpdatesFromContent: vi.fn().mockReturnValue([]),
    };
    mockInvokePlanningAgent.mockResolvedValue({ content: "No sections" });

    await expect(service.generatePrdFromCodebase("proj-1")).rejects.toMatchObject({
      code: "INVALID_INPUT",
    });
  });

  it("wraps planning-agent failures as AGENT_INVOKE_FAILED", async () => {
    const service = new PrdFromCodebaseService() as any;
    service.planService = {
      getCodebaseContext: vi.fn().mockResolvedValue({ fileTree: "", keyFilesContent: "" }),
    };
    service.projectService = {
      getSettings: vi.fn().mockResolvedValue({
        simpleComplexityAgent: { type: "cursor", model: null, cliCommand: null },
        complexComplexityAgent: { type: "claude", model: "claude-sonnet-4", cliCommand: null },
        hilConfig: { scopeChanges: "automated", architectureDecisions: "automated", dependencyModifications: "automated" },
      }),
      getRepoPath: vi.fn().mockResolvedValue("/repo"),
    };
    mockInvokePlanningAgent.mockRejectedValue(new Error("rate limit"));

    await expect(service.generatePrdFromCodebase("proj-1")).rejects.toMatchObject({
      code: "AGENT_INVOKE_FAILED",
    });
  });
});
