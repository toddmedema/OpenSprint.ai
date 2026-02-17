import { describe, it, expect } from "vitest";
import { getEpicId } from "../bead-ids.js";

describe("getEpicId", () => {
  it("returns epic prefix when id ends with .digits (task under epic)", () => {
    expect(getEpicId("opensprint.dev-xyz.2.1")).toBe("opensprint.dev-xyz.2");
    expect(getEpicId("opensprint.dev-8rx.10.0")).toBe("opensprint.dev-8rx.10");
    expect(getEpicId("bd-a3f8.1")).toBe("bd-a3f8");
  });

  it("returns id unchanged when it does not end with .digits (top-level epic)", () => {
    expect(getEpicId("opensprint.dev-xyz")).toBe("opensprint.dev-xyz");
    expect(getEpicId("bd-a3f8")).toBe("bd-a3f8");
  });

  it("strips last numeric segment when id ends with .digits", () => {
    expect(getEpicId("opensprint.dev-xyz.2")).toBe("opensprint.dev-xyz");
    expect(getEpicId("opensprint.dev-8rx.10")).toBe("opensprint.dev-8rx");
  });

  it("handles single-segment ids", () => {
    expect(getEpicId("epic1")).toBe("epic1");
  });

  it("handles ids with multiple numeric segments", () => {
    expect(getEpicId("a.b.c.123")).toBe("a.b.c");
  });
});
