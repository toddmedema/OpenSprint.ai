# Git Working Mode Setting

## Overview

Add a new "Git working mode" setting to Agent Config that allows users to choose between **Worktree** (current default) and **Branches** modes. Worktree mode uses isolated git worktrees per task; Branches mode runs agents directly in the main repo on task branches with concurrency disabled.

## Acceptance Criteria

- [ ] Agent Config tab displays a "Git working mode" selector with options: Worktree (default) and Branches
- [ ] When Branches is selected, maxConcurrentCoders is forced to 1 and the Parallelism section is HIDDEN
- [ ] In Worktree mode, behavior is unchanged (worktrees at `/tmp/opensprint-worktrees/<task-id>`, parallel coders allowed)
- [ ] In Branches mode: pre-agent creates/checks out branch in main repo; agent runs in repo root; post-agent merges to main and deletes branch; no worktree created or removed
- [ ] Settings persist to `.opensprint/settings.json` and survive project reload
- [ ] Recovery (GUPP) works in both modes; assignment.json references repoPath when in Branches mode

## Technical Approach

1. **Data model:** Add `gitWorkingMode: "worktree" | "branches"` to `ProjectSettings` (default: `"worktree"`).
2. **PhaseExecutor:** When `gitWorkingMode === "branches"`:
   - Call `branchManager.createOrCheckoutBranch(repoPath, branchName)` instead of `createTaskWorktree`
   - Set `slot.worktreePath = repoPath` (agent runs in main repo)
   - Ensure `symlinkNodeModules` is skipped or no-op when repoPath === wtPath
3. **MergeCoordinator:** When `gitWorkingMode === "branches"`, skip `removeTaskWorktree` (no worktree was created).
4. **Orchestrator:** When `gitWorkingMode === "branches"`, treat `maxConcurrentCoders` as 1 regardless of stored value (or enforce in UI).
5. **UI:** Add radio/select in Agent Config; when maxCoders = 1 (Branches mode or explicit setting), HIDE the Parallelism section and show explanatory text.

## Dependencies

- None (self-contained feature)

## Data Model Changes

- `ProjectSettings`: add optional `gitWorkingMode?: "worktree" | "branches"` (default `"worktree"`)
- `parseSettings()`: ensure default when missing
- Backend schema: extend agent-config or settings validation if applicable

## API Specification

- **GET/PUT** `/projects/:id/settings` — existing endpoint; `gitWorkingMode` included in request/response body
- No new endpoints

## UI/UX Requirements

- Place "Git working mode" in Agent Config tab, above or below the Low/High complexity agent selectors
- Use radio buttons or a select: "Worktree" (default) | "Branches"
- Helper text: "Worktree: isolated directories per task, supports parallel agents. Branches: agents work in main repo on task branches, one at a time."
- When maxCoders = 1 (Branches mode or Worktree with maxConcurrentCoders set to 1): HIDE the entire Parallelism section (Max Concurrent Coders, Unknown Scope Strategy); show info: "Branches mode uses a single coder." or "Single coder — parallelism controls hidden."

## Edge Cases and Error Handling

- **User has uncommitted changes in main repo when Branches mode starts:** Pre-agent should ensure main is clean or stash; document that user should commit/stash before Execute in Branches mode
- **Switching mode mid-execution:** If an agent is running, changing the setting takes effect on next task; document or warn when switching
- **Recovery:** assignment.json stores `worktreePath`; in Branches mode this equals repoPath; orphan recovery and GUPP must handle both
- **removeTaskWorktree in Branches:** Do not call it; calling it would attempt to remove a non-existent worktree and may error

## Testing Strategy

- Unit: `parseSettings` with/without `gitWorkingMode`; default behavior
- Unit: PhaseExecutor branch: when `gitWorkingMode === "branches"`, verify `createOrCheckoutBranch` called, `createTaskWorktree` not called
- Unit: MergeCoordinator: when Branches, verify `removeTaskWorktree` not called
- Integration: Full Execute flow in Branches mode: task completes, merge succeeds, branch deleted
- E2E: Change setting in UI, save, reload project, verify setting persisted

## Estimated Complexity

medium
