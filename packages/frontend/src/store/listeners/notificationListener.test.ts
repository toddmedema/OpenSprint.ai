import { describe, it, expect, beforeEach, vi } from "vitest";
import { configureStore } from "@reduxjs/toolkit";
import { waitFor } from "@testing-library/react";
import notificationReducer from "../slices/notificationSlice";
import connectionReducer, { setConnectionError } from "../slices/connectionSlice";
import websocketReducer, { setDeliverToast } from "../slices/websocketSlice";
import { notificationListener } from "./notificationListener";

const mockIsConnectionError = vi.fn();

vi.mock("../../api/client", () => ({
  isConnectionError: (...args: unknown[]) => mockIsConnectionError(...args),
}));

function createStore() {
  return configureStore({
    reducer: {
      notification: notificationReducer,
      connection: connectionReducer,
      websocket: websocketReducer,
    },
    middleware: (getDefaultMiddleware) =>
      getDefaultMiddleware().prepend(notificationListener.middleware),
  });
}

describe("notificationListener", () => {
  beforeEach(() => {
    mockIsConnectionError.mockReset();
  });

  it("keeps not-found rejections quiet", () => {
    const store = createStore();
    store.dispatch({
      type: "execute/fetchTasks/rejected",
      meta: { requestStatus: "rejected", requestId: "req-1" },
      error: { message: "Task missing", code: "ISSUE_NOT_FOUND" },
    });

    expect(store.getState().notification.items).toHaveLength(0);
  });

  it("turns connection errors into the global banner and clears deliver toast", async () => {
    const store = createStore();
    store.dispatch(setDeliverToast({ message: "Delivering", variant: "started" }));
    mockIsConnectionError.mockReturnValue(true);

    store.dispatch({
      type: "plan/fetchPlans/rejected",
      meta: { requestStatus: "rejected", requestId: "req-2" },
      error: { message: "Network down" },
    });

    await waitFor(() => {
      expect(store.getState().connection.connectionError).toBe(true);
      expect(store.getState().websocket.deliverToast).toBeNull();
      expect(store.getState().notification.items).toHaveLength(0);
    });
  });

  it("maps generic rejected actions to actionable notification text", async () => {
    const store = createStore();
    mockIsConnectionError.mockReturnValue(false);

    store.dispatch({
      type: "plan/fetchPlans/rejected",
      meta: { requestStatus: "rejected", requestId: "req-3" },
      error: { message: "Rejected" },
    });

    await waitFor(() => {
      expect(store.getState().notification.items).toHaveLength(1);
      expect(store.getState().notification.items[0].message).toBe(
        "Failed to load plans. Refresh the page or try again."
      );
    });
  });

  it("clears the connection banner when an API thunk succeeds", async () => {
    const store = createStore();
    store.dispatch(setConnectionError(true));

    store.dispatch({
      type: "plan/fetchPlans/fulfilled",
      meta: { requestStatus: "fulfilled", requestId: "req-4" },
      payload: {},
    });

    await waitFor(() => {
      expect(store.getState().connection.connectionError).toBe(false);
    });
  });
});
