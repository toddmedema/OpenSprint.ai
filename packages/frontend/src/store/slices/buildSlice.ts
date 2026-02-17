/**
 * @deprecated Use executeSlice — build phase renamed to execute per SPEED phase names.
 * This file re-exports from executeSlice for backward compatibility.
 */
export {
  fetchTasks,
  fetchExecutePlans as fetchBuildPlans,
  fetchExecuteStatus as fetchBuildStatus,
  fetchTaskDetail,
  fetchArchivedSessions,
  markTaskDone,
  setSelectedTaskId,
  appendAgentOutput,
  setOrchestratorRunning,
  setAwaitingApproval,
  setCompletionState,
  taskUpdated,
  setTasks,
  setExecuteError as setBuildError,
  resetExecute as resetBuild,
} from "./executeSlice";
export type { ExecuteState as BuildState } from "./executeSlice";
export { default } from "./executeSlice";
