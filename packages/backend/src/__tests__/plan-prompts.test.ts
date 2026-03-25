import { describe, it, expect } from "vitest";
import { DECOMPOSE_SYSTEM_PROMPT } from "../services/plan/plan-prompts.js";

describe("DECOMPOSE_SYSTEM_PROMPT", () => {
  it("contains the scale/speed/cost instruction paragraph", () => {
    expect(DECOMPOSE_SYSTEM_PROMPT).toContain(
      "**Scale, speed, and cost:**",
    );
  });

  it("references all three constraint categories", () => {
    expect(DECOMPOSE_SYSTEM_PROMPT).toContain("scale (users, data volume, growth)");
    expect(DECOMPOSE_SYSTEM_PROMPT).toContain("speed (latency, throughput)");
    expect(DECOMPOSE_SYSTEM_PROMPT).toContain("cost (budget, infrastructure)");
  });

  it("instructs Technical Approach handling when constraints are present", () => {
    expect(DECOMPOSE_SYSTEM_PROMPT).toContain(
      "ensure each relevant plan's Technical Approach reflects them",
    );
  });

  it("instructs Assumptions note when constraints are absent for affected plans", () => {
    expect(DECOMPOSE_SYSTEM_PROMPT).toContain(
      "add a brief note in the Assumptions section of plans likely affected by scale/speed/cost",
    );
  });

  it("does not alter the JSON output shape", () => {
    expect(DECOMPOSE_SYSTEM_PROMPT).toContain('"plans"');
    expect(DECOMPOSE_SYSTEM_PROMPT).toContain('"title"');
    expect(DECOMPOSE_SYSTEM_PROMPT).toContain('"content"');
    expect(DECOMPOSE_SYSTEM_PROMPT).toContain('"complexity"');
    expect(DECOMPOSE_SYSTEM_PROMPT).toContain('"dependsOnPlans"');
    expect(DECOMPOSE_SYSTEM_PROMPT).toContain('"mockups"');
  });
});
