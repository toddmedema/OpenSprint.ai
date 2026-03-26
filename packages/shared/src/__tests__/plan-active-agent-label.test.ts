import { describe, it, expect } from "vitest";
import {
  formatPlanChatRunningAgentsLabel,
  truncatePlanNameForRunningAgentsDropdown,
  PLAN_NAME_TRUNCATION_ELLIPSIS,
} from "../plan-active-agent-label.js";

describe("truncatePlanNameForRunningAgentsDropdown", () => {
  it("returns the full name with no ellipsis when length is at most 20", () => {
    expect(truncatePlanNameForRunningAgentsDropdown("Short plan")).toBe("Short plan");
    expect(truncatePlanNameForRunningAgentsDropdown("12345678901234567890")).toBe(
      "12345678901234567890"
    );
  });

  it("truncates at the last space at or before 20 characters and adds ellipsis", () => {
    // "One two three four five " is 24 chars; first 20: "One two three four f" — last space before 20 is after "four"
    const name = "One two three four five six seven";
    expect(truncatePlanNameForRunningAgentsDropdown(name)).toBe(
      `One two three four${PLAN_NAME_TRUNCATION_ELLIPSIS}`
    );
  });

  it("uses a hard cut at 20 when there is no space in the window", () => {
    const name = "abcdefghijklmnopqrstuvwxyz";
    expect(truncatePlanNameForRunningAgentsDropdown(name)).toBe(
      `abcdefghijklmnopqrst${PLAN_NAME_TRUNCATION_ELLIPSIS}`
    );
  });

  it("normalizes internal whitespace before measuring", () => {
    expect(truncatePlanNameForRunningAgentsDropdown("Too    many     spaces")).toBe(
      "Too many spaces"
    );
  });
});

describe("formatPlanChatRunningAgentsLabel", () => {
  it("prefixes with Plan chat - and applies truncation rules", () => {
    expect(formatPlanChatRunningAgentsLabel("Auth Plan")).toBe("Plan chat - Auth Plan");
    const long = "One two three four five six seven";
    expect(formatPlanChatRunningAgentsLabel(long)).toBe(
      `Plan chat - One two three four${PLAN_NAME_TRUNCATION_ELLIPSIS}`
    );
  });
});
