import { describe, it, expect, vi, beforeEach } from "vitest";
import { resolveExecuteReplayMetadata } from "../services/execute-replay-metadata.service.js";
import * as gitRepoState from "../utils/git-repo-state.js";

const { mockReadActivePromotedForExecuteReplay } = vi.hoisted(() => ({
  mockReadActivePromotedForExecuteReplay: vi.fn(),
}));

vi.mock("../services/behavior-version-store.service.js", () => ({
  readActivePromotedForExecuteReplay: mockReadActivePromotedForExecuteReplay,
}));

vi.spyOn(gitRepoState, "getCommitShaAtBranchTip");

describe("resolveExecuteReplayMetadata", () => {
  beforeEach(() => {
    vi.mocked(gitRepoState.getCommitShaAtBranchTip).mockResolvedValue("base-sha-111");
    mockReadActivePromotedForExecuteReplay.mockResolvedValue(null);
  });

  it("returns null when experiments are off and store has no active promoted version", async () => {
    const meta = await resolveExecuteReplayMetadata(
      "p1",
      { runAgentEnhancementExperiments: false } as import("@opensprint/shared").ProjectSettings,
      "/tmp/repo",
      "main"
    );
    expect(meta).toBeNull();
    expect(mockReadActivePromotedForExecuteReplay).toHaveBeenCalledWith("p1");
    expect(gitRepoState.getCommitShaAtBranchTip).not.toHaveBeenCalled();
  });

  it("resolves base SHA and store binding when runAgentEnhancementExperiments is true", async () => {
    mockReadActivePromotedForExecuteReplay.mockResolvedValue({
      behaviorVersionId: "bv-99",
      templateVersionId: "tv-1",
    });
    const meta = await resolveExecuteReplayMetadata(
      "p1",
      {
        runAgentEnhancementExperiments: true,
      } as import("@opensprint/shared").ProjectSettings,
      "/tmp/repo",
      "main"
    );
    expect(meta).toEqual({
      baseCommitSha: "base-sha-111",
      behaviorVersionId: "bv-99",
      templateVersionId: "tv-1",
    });
    expect(gitRepoState.getCommitShaAtBranchTip).toHaveBeenCalledWith("/tmp/repo", "main");
  });

  it("resolves from BehaviorVersionStore when experiments are off but an active promoted version exists", async () => {
    mockReadActivePromotedForExecuteReplay.mockResolvedValue({
      behaviorVersionId: "bv-from-db",
      templateVersionId: "tpl-z",
    });
    const meta = await resolveExecuteReplayMetadata(
      "p1",
      { runAgentEnhancementExperiments: false } as import("@opensprint/shared").ProjectSettings,
      "/tmp/repo",
      "develop"
    );
    expect(meta).toEqual({
      baseCommitSha: "base-sha-111",
      behaviorVersionId: "bv-from-db",
      templateVersionId: "tpl-z",
    });
  });

  it("returns only baseCommitSha when experiments are on but the store has no active version yet", async () => {
    const meta = await resolveExecuteReplayMetadata(
      "p1",
      {
        runAgentEnhancementExperiments: true,
      } as import("@opensprint/shared").ProjectSettings,
      "/tmp/repo",
      "main"
    );
    expect(meta).toEqual({ baseCommitSha: "base-sha-111" });
  });
});
