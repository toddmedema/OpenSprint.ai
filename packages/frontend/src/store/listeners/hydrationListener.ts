import { createListenerMiddleware, isFulfilled } from "@reduxjs/toolkit";
import { fetchMoreTasks } from "../slices/executeSlice";
import { fetchMoreFeedback } from "../slices/evalSlice";
import type { FetchTasksArg } from "../slices/executeSlice";

function getProjectIdFromFetchTasksArg(arg: FetchTasksArg): string {
  return typeof arg === "string" ? arg : arg.projectId;
}

/**
 * Gradual hydration: after first batch of tasks/feedback loads, automatically
 * fetch remaining batches in chunks of 100 until all are loaded. Keeps initial
 * load fast while hydrating the rest in the background.
 */
export const hydrationListener = createListenerMiddleware();

// Tasks: when fetchTasks or fetchMoreTasks fulfills and hasMoreTasks, fetch next page
hydrationListener.startListening({
  predicate: (action) =>
    isFulfilled(action) &&
    (action.type === "execute/fetchTasks/fulfilled" || action.type === "execute/fetchMoreTasks/fulfilled"),
  effect: (action, listenerApi) => {
    const state = listenerApi.getState() as { execute?: { hasMoreTasks?: boolean; async?: { tasks?: { loading?: boolean } } } };
    if (!state.execute?.hasMoreTasks || state.execute?.async?.tasks?.loading) return;
    const projectId =
      action.type === "execute/fetchMoreTasks/fulfilled"
        ? (action.meta.arg as string)
        : getProjectIdFromFetchTasksArg(action.meta.arg as FetchTasksArg);
    listenerApi.dispatch(fetchMoreTasks(projectId));
  },
});

// Feedback: when fetchFeedback or fetchMoreFeedback fulfills and hasMoreFeedback, fetch next page
hydrationListener.startListening({
  predicate: (action) =>
    isFulfilled(action) &&
    (action.type === "eval/fetchFeedback/fulfilled" || action.type === "eval/fetchMoreFeedback/fulfilled"),
  effect: (action, listenerApi) => {
    const state = listenerApi.getState() as { eval?: { hasMoreFeedback?: boolean; async?: { feedback?: { loading?: boolean } } } };
    if (!state.eval?.hasMoreFeedback || state.eval?.async?.feedback?.loading) return;
    const projectId =
      action.type === "eval/fetchMoreFeedback/fulfilled"
        ? (action.meta.arg as string)
        : (action.meta.arg as { projectId?: string }).projectId ?? (action.meta.arg as string);
    listenerApi.dispatch(fetchMoreFeedback(projectId));
  },
});
