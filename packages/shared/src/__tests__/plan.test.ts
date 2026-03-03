import { describe, expect, it } from "vitest";
import { sortPlansByStatus } from "../types/plan.js";
import type { Plan, PlanStatus } from "../types/plan.js";

function createPlan(id: string, status: PlanStatus): Plan {
  return {
    metadata: {
      planId: id,
      epicId: `epic-${id}`,
      shippedAt: null,
      complexity: "medium",
    },
    content: `# ${id}`,
    status,
    taskCount: 1,
    doneTaskCount: 0,
    dependencyCount: 0,
  };
}

describe("sortPlansByStatus", () => {
  it.each([
    {
      name: "orders planning before building before complete",
      input: [
        createPlan("plan-done", "complete"),
        createPlan("plan-planning", "planning"),
        createPlan("plan-building", "building"),
      ],
      expected: ["plan-planning", "plan-building", "plan-done"],
    },
    {
      name: "preserves relative order inside the same status bucket",
      input: [
        createPlan("plan-a", "building"),
        createPlan("plan-b", "building"),
        createPlan("plan-c", "planning"),
      ],
      expected: ["plan-c", "plan-a", "plan-b"],
    },
  ])("$name", ({ input, expected }) => {
    expect(sortPlansByStatus(input).map((plan) => plan.metadata.planId)).toEqual(expected);
  });

  it("returns a new array without mutating the input order", () => {
    const plans = [createPlan("plan-done", "complete"), createPlan("plan-planning", "planning")];

    const sorted = sortPlansByStatus(plans);

    expect(sorted).not.toBe(plans);
    expect(plans.map((plan) => plan.status)).toEqual(["complete", "planning"]);
  });

  it("handles an empty array", () => {
    expect(sortPlansByStatus([])).toEqual([]);
  });

  it("sends unknown statuses to the end via the fallback order", () => {
    const plans = [
      createPlan("plan-unknown", "planning" as never),
      createPlan("plan-planning", "planning"),
      { ...createPlan("plan-custom", "planning"), status: "custom" as never },
    ];

    expect(sortPlansByStatus(plans).map((plan) => plan.metadata.planId)).toEqual([
      "plan-unknown",
      "plan-planning",
      "plan-custom",
    ]);
  });
});
