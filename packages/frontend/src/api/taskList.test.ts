import { describe, it, expect } from "vitest";
import { normalizeTaskListResponse } from "./taskList";
import type { Task } from "@opensprint/shared";

const task = { id: "os-1", title: "Task" } as Task;

describe("normalizeTaskListResponse", () => {
  it("returns array responses unchanged", () => {
    expect(normalizeTaskListResponse([task])).toEqual([task]);
  });

  it("returns paginated items when present", () => {
    expect(normalizeTaskListResponse({ items: [task], total: 1 })).toEqual([task]);
  });

  it("returns an empty array for missing or malformed responses", () => {
    expect(normalizeTaskListResponse(undefined)).toEqual([]);
    expect(normalizeTaskListResponse({ items: undefined, total: 0 })).toEqual([]);
  });
});
