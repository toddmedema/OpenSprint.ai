import { createListenerMiddleware, isFulfilled } from "@reduxjs/toolkit";
import { updateTaskPriority } from "../slices/executeSlice";
import { getQueryClient } from "../../queryClient";
import { queryKeys } from "../../api/queryKeys";

/**
 * When priority update succeeds, invalidate tasks list and task detail so
 * TanStack Query cache stays in sync with server.
 */
export const executeListeners = createListenerMiddleware();

executeListeners.startListening({
  predicate: (action): action is ReturnType<typeof updateTaskPriority.fulfilled> =>
    isFulfilled(action) && updateTaskPriority.fulfilled.match(action),
  effect: (action) => {
    try {
      const qc = getQueryClient();
      const { taskId } = action.payload;
      const projectId = action.meta.arg.projectId;
      void qc.invalidateQueries({ queryKey: queryKeys.tasks.list(projectId) });
      void qc.invalidateQueries({
        queryKey: queryKeys.tasks.detail(projectId, taskId),
      });
    } catch {
      // QueryClient may not be set in tests
    }
  },
});
