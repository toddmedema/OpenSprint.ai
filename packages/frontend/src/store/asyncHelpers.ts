import type { ActionReducerMapBuilder, AsyncThunk } from "@reduxjs/toolkit";
import type { Draft } from "immer";

/** Standard shape for a single async operation's loading/error state */
export type AsyncState = { loading: boolean; error: string | null };

/** Record of async states keyed by operation name */
export type AsyncStates<K extends string> = Record<K, AsyncState>;

/** Creates initial async states for a set of keys */
export function createInitialAsyncStates<K extends string>(keys: readonly K[]): AsyncStates<K> {
  return Object.fromEntries(
    keys.map((k) => [k, { loading: false, error: null }])
  ) as AsyncStates<K>;
}

type ThunkFulfilledAction = { payload: unknown };
type ThunkRejectedAction = { error: { message?: string }; payload?: unknown };

/** Options for customizing async handler behavior */
export interface AsyncHandlerOptions<S> {
  /** Run before any state update (e.g. to ensure nested state exists from partial preloadedState) */
  ensureState?: (state: Draft<S>) => void;
  onPending?: (state: Draft<S>) => void;
  onFulfilled?: (state: Draft<S>, action: ThunkFulfilledAction) => void;
  onRejected?: (state: Draft<S>, action: ThunkRejectedAction) => void;
  defaultError?: string;
}

/**
 * Adds pending/fulfilled/rejected handlers for an async thunk to a slice's extraReducers builder.
 * Standardizes loading and error state updates; use onFulfilled/onRejected for operation-specific logic.
 */
export function createAsyncHandlers<K extends string, S extends { async: AsyncStates<K> }>(
  key: K,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- Accept any AsyncThunk arg type; addCase narrows
  thunk: AsyncThunk<any, any, any>,
  builder: ActionReducerMapBuilder<S>,
  options?: AsyncHandlerOptions<S>
): void {
  builder
    .addCase(thunk.pending, (state) => {
      options?.ensureState?.(state);
      const asyncState = state.async as Record<K, AsyncState>;
      asyncState[key].loading = true;
      asyncState[key].error = null;
      options?.onPending?.(state);
    })
    .addCase(thunk.fulfilled, (state, action) => {
      options?.ensureState?.(state);
      const asyncState = state.async as Record<K, AsyncState>;
      asyncState[key].loading = false;
      options?.onFulfilled?.(state, action);
    })
    .addCase(thunk.rejected, (state, action) => {
      options?.ensureState?.(state);
      const asyncState = state.async as Record<K, AsyncState>;
      asyncState[key].loading = false;
      const err = action.error as { message?: string } | undefined;
      asyncState[key].error = err?.message ?? options?.defaultError ?? "Request failed";
      options?.onRejected?.(state, { error: err ?? {}, payload: action.payload });
    });
}
