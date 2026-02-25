import type { Middleware } from "@reduxjs/toolkit";
import {
  appendAgentOutput,
  setAgentOutputBackfill,
  setSelectedTaskId,
} from "../slices/executeSlice";
import {
  createAgentOutputFilter,
  filterAgentOutput,
} from "../../utils/agentOutputFilter";

/**
 * Middleware that holds an isolated agent output filter instance.
 * Intercepts appendAgentOutput to filter chunks before the reducer,
 * setAgentOutputBackfill to filter backfill output before the reducer,
 * and setSelectedTaskId to reset the filter when switching tasks.
 */
export const agentOutputFilterMiddleware: Middleware = () => {
  const filter = createAgentOutputFilter();

  return (next) => (action) => {
    if (setSelectedTaskId.match(action)) {
      filter.reset();
    }
    if (appendAgentOutput.match(action)) {
      const filtered = filter.filter(action.payload.chunk);
      return next(appendAgentOutput({ taskId: action.payload.taskId, chunk: filtered }));
    }
    if (setAgentOutputBackfill.match(action)) {
      const filtered = filterAgentOutput(action.payload.output);
      return next(
        setAgentOutputBackfill({ taskId: action.payload.taskId, output: filtered })
      );
    }
    return next(action);
  };
};
