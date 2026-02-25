import { describe, it, expect } from "vitest";
import {
  getTestCommandForFramework,
  resolveTestCommand,
  getAgentName,
  getAgentNameForRole,
  isAgentAssignee,
} from "../constants/index.js";

describe("getTestCommandForFramework", () => {
  it("returns empty string for null", () => {
    expect(getTestCommandForFramework(null)).toBe("");
  });

  it("returns empty string for none", () => {
    expect(getTestCommandForFramework("none")).toBe("");
  });

  it("returns command for known framework", () => {
    expect(getTestCommandForFramework("jest")).toBe("npm test");
    expect(getTestCommandForFramework("vitest")).toBe("npx vitest run");
  });
});

describe("resolveTestCommand", () => {
  it("returns testCommand when set", () => {
    expect(resolveTestCommand({ testCommand: "pytest", testFramework: null })).toBe("pytest");
  });

  it("returns framework command when testCommand not set", () => {
    expect(resolveTestCommand({ testCommand: null, testFramework: "vitest" })).toBe(
      "npx vitest run"
    );
  });

  it("returns npm test when neither set", () => {
    expect(resolveTestCommand({ testCommand: null, testFramework: null })).toBe("npm test");
  });

  it("returns npm test when framework is none", () => {
    expect(resolveTestCommand({ testCommand: null, testFramework: "none" })).toBe("npm test");
  });
});

describe("getAgentName", () => {
  it("returns Frodo for slot 0", () => {
    expect(getAgentName(0)).toBe("Frodo");
  });
  it("returns Samwise for slot 1", () => {
    expect(getAgentName(1)).toBe("Samwise");
  });
  it("wraps with modulo (slot 13 → Frodo)", () => {
    expect(getAgentName(13)).toBe("Frodo");
  });
});

describe("getAgentNameForRole", () => {
  it("returns role-specific names", () => {
    expect(getAgentNameForRole("coder", 0)).toBe("Frodo");
    expect(getAgentNameForRole("reviewer", 0)).toBe("Boromir");
    expect(getAgentNameForRole("dreamer", 0)).toBe("Gandalf");
  });
  it("wraps with modulo", () => {
    expect(getAgentNameForRole("reviewer", 5)).toBe(getAgentNameForRole("reviewer", 0));
  });
  it("falls back to coder list for unknown role", () => {
    expect(getAgentNameForRole("unknown", 0)).toBe("Frodo");
  });
});

describe("isAgentAssignee", () => {
  it("returns true for known agent names", () => {
    expect(isAgentAssignee("Frodo")).toBe(true);
    expect(isAgentAssignee("Boromir")).toBe(true);
  });
  it("returns false for agent-N pattern", () => {
    expect(isAgentAssignee("agent-1")).toBe(false);
  });
  it("returns false for null/undefined/empty", () => {
    expect(isAgentAssignee(null)).toBe(false);
    expect(isAgentAssignee(undefined)).toBe(false);
    expect(isAgentAssignee("")).toBe(false);
  });
});
