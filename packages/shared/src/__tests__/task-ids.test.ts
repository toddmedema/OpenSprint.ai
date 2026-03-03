import { describe, expect, it } from "vitest";
import { getEpicId } from "../task-ids.js";

describe("getEpicId", () => {
  it.each([
    { id: "opensprint.dev-xyz.2.1", expected: "opensprint.dev-xyz.2" },
    { id: "opensprint.dev-8rx.10.0", expected: "opensprint.dev-8rx.10" },
    { id: "bd-a3f8.1", expected: "bd-a3f8" },
    { id: "opensprint.dev-xyz.2", expected: "opensprint.dev-xyz" },
    { id: "opensprint.dev-8rx.10", expected: "opensprint.dev-8rx" },
    { id: "opensprint.dev-xyz", expected: "opensprint.dev-xyz" },
    { id: "bd-a3f8", expected: "bd-a3f8" },
    { id: "epic1", expected: "epic1" },
    { id: "a.b.c.123", expected: "a.b.c" },
  ])("returns $expected for $id", ({ id, expected }) => {
    expect(getEpicId(id)).toBe(expected);
  });
});
