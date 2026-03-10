import { describe, it, expect } from "vitest";
import { DESIGN_TOKEN_CONTRACT, getDesignTokenVar } from "./designTokens";

describe("designTokens", () => {
  it("defines the shared design-token contract groups", () => {
    expect(Object.keys(DESIGN_TOKEN_CONTRACT)).toEqual([
      "surface",
      "text",
      "stroke",
      "accent",
      "status",
    ]);
  });

  it("builds CSS variable names for token lookups", () => {
    expect(getDesignTokenVar("surface", "page")).toBe("--ui-surface-page");
    expect(getDesignTokenVar("accent", "primary")).toBe("--ui-accent-primary");
    expect(getDesignTokenVar("status", "error")).toBe("--ui-status-error");
  });
});

