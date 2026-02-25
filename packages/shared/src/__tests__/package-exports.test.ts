/**
 * Integration test: verifies that @opensprint/shared package exports resolve
 * correctly. Exports use fallback: dist (production) first, src (dev) when dist
 * is absent. Both Vite (frontend) and tsx (backend) resolve during development;
 * production build uses compiled dist/ for node dist/index.js.
 */
import { describe, it, expect } from "vitest";
import * as shared from "@opensprint/shared";

describe("package exports (src/index.ts resolution)", () => {
  it("exports constants", () => {
    expect(shared.API_PREFIX).toBeDefined();
    expect(shared.OPENSPRINT_PATHS).toBeDefined();
  });

  it("exports plan template utilities", () => {
    expect(shared.getPlanTemplate).toBeDefined();
    expect(typeof shared.getPlanTemplate).toBe("function");
  });

  it("exports task ID utilities", () => {
    expect(shared.getEpicId).toBeDefined();
    expect(typeof shared.getEpicId).toBe("function");
  });

  it("exports deployment utilities", () => {
    expect(shared.getDefaultDeploymentTarget).toBeDefined();
    expect(typeof shared.getDefaultDeploymentTarget).toBe("function");
  });

  it("exports agent metadata (AGENT_ROLE_DESCRIPTIONS, AGENT_ROLE_PHASES)", () => {
    expect(shared.AGENT_ROLE_DESCRIPTIONS).toBeDefined();
    expect(shared.AGENT_ROLE_PHASES).toBeDefined();
    expect(typeof shared.AGENT_ROLE_DESCRIPTIONS).toBe("object");
    expect(typeof shared.AGENT_ROLE_PHASES).toBe("object");
    expect(Object.keys(shared.AGENT_ROLE_DESCRIPTIONS).length).toBe(9);
    expect(Object.keys(shared.AGENT_ROLE_PHASES).length).toBe(9);
  });
});
