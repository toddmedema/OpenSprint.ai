import { describe, it, expect } from "vitest";
import { configureStore } from "@reduxjs/toolkit";
import connectionReducer, { setConnectionError } from "./connectionSlice";

function createStore(preloadedState?: { connection?: { connectionError: boolean } }) {
  return configureStore({
    reducer: { connection: connectionReducer },
    preloadedState,
  });
}

describe("connectionSlice", () => {
  it("initial state has connectionError false", () => {
    const store = createStore();
    expect(store.getState().connection.connectionError).toBe(false);
  });

  it("setConnectionError(true) sets connectionError", () => {
    const store = createStore();
    store.dispatch(setConnectionError(true));
    expect(store.getState().connection.connectionError).toBe(true);
  });

  it("setConnectionError(false) clears connectionError", () => {
    const store = createStore({ connection: { connectionError: true } });
    store.dispatch(setConnectionError(false));
    expect(store.getState().connection.connectionError).toBe(false);
  });
});
