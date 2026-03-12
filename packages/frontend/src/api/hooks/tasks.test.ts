import { describe, expect, it } from "vitest";
import {
  getExecuteTasksRefetchInterval,
  TASKS_LIVE_POLL_MS,
  TASKS_WS_SAFETY_POLL_MS,
} from "./tasks";

describe("getExecuteTasksRefetchInterval", () => {
  it("uses fast polling when websocket is disconnected", () => {
    expect(getExecuteTasksRefetchInterval(false)).toBe(TASKS_LIVE_POLL_MS);
  });

  it("uses low-frequency safety polling when websocket is connected", () => {
    expect(getExecuteTasksRefetchInterval(true)).toBe(TASKS_WS_SAFETY_POLL_MS);
  });
});
