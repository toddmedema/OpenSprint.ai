import { describe, it, expect } from "vitest";
import {
  scoreExperiment,
  decideExperimentOutcome,
} from "../services/experiment-scoring.service.js";
import type { SelfImprovementMetrics } from "../services/self-improvement-runner.service.js";

function makeMetrics(overrides: Partial<SelfImprovementMetrics> = {}): SelfImprovementMetrics {
  return {
    taskSuccessRate: 0.8,
    retryRate: 0.1,
    reviewPassRate: 0.9,
    avgLatencyMs: 5000,
    avgCostUsd: 0.5,
    ...overrides,
  };
}

describe("scoreExperiment", () => {
  it("reports positive delta when candidate has higher success rate", () => {
    const baseline = makeMetrics({ taskSuccessRate: 0.7 });
    const candidate = makeMetrics({ taskSuccessRate: 0.9 });
    const result = scoreExperiment(baseline, candidate);
    expect(result.successRateDelta).toBeCloseTo(0.2, 5);
    expect(result.guardrailTriggered).toBe(false);
    expect(result.guardrailDetails).toEqual([]);
  });

  it("reports negative delta when candidate has lower success rate", () => {
    const baseline = makeMetrics({ taskSuccessRate: 0.9 });
    const candidate = makeMetrics({ taskSuccessRate: 0.6 });
    const result = scoreExperiment(baseline, candidate);
    expect(result.successRateDelta).toBeCloseTo(-0.3, 5);
  });

  it("triggers retry rate guardrail when regression exceeds threshold", () => {
    const baseline = makeMetrics({ retryRate: 0.1 });
    const candidate = makeMetrics({ retryRate: 0.30 });
    const result = scoreExperiment(baseline, candidate);
    expect(result.guardrailTriggered).toBe(true);
    expect(result.guardrailDetails).toHaveLength(1);
    expect(result.guardrailDetails[0]).toContain("Retry rate regression");
  });

  it("does not trigger retry guardrail within threshold", () => {
    const baseline = makeMetrics({ retryRate: 0.1 });
    const candidate = makeMetrics({ retryRate: 0.2 });
    const result = scoreExperiment(baseline, candidate);
    expect(result.guardrailDetails.filter((d) => d.includes("Retry"))).toHaveLength(0);
  });

  it("triggers review pass rate guardrail on regression", () => {
    const baseline = makeMetrics({ reviewPassRate: 0.9 });
    const candidate = makeMetrics({ reviewPassRate: 0.7 });
    const result = scoreExperiment(baseline, candidate);
    expect(result.guardrailTriggered).toBe(true);
    expect(result.guardrailDetails.some((d) => d.includes("Review pass rate"))).toBe(true);
  });

  it("triggers latency guardrail when exceeding 2x baseline", () => {
    const baseline = makeMetrics({ avgLatencyMs: 5000 });
    const candidate = makeMetrics({ avgLatencyMs: 15000 });
    const result = scoreExperiment(baseline, candidate);
    expect(result.guardrailTriggered).toBe(true);
    expect(result.guardrailDetails.some((d) => d.includes("Latency regression"))).toBe(true);
  });

  it("triggers cost guardrail when exceeding 2x baseline", () => {
    const baseline = makeMetrics({ avgCostUsd: 0.5 });
    const candidate = makeMetrics({ avgCostUsd: 1.5 });
    const result = scoreExperiment(baseline, candidate);
    expect(result.guardrailTriggered).toBe(true);
    expect(result.guardrailDetails.some((d) => d.includes("Cost regression"))).toBe(true);
  });

  it("does not trigger latency guardrail when baseline is zero", () => {
    const baseline = makeMetrics({ avgLatencyMs: 0 });
    const candidate = makeMetrics({ avgLatencyMs: 10000 });
    const result = scoreExperiment(baseline, candidate);
    expect(result.guardrailDetails.filter((d) => d.includes("Latency"))).toHaveLength(0);
  });

  it("does not trigger cost guardrail when baseline is zero", () => {
    const baseline = makeMetrics({ avgCostUsd: 0 });
    const candidate = makeMetrics({ avgCostUsd: 2.0 });
    const result = scoreExperiment(baseline, candidate);
    expect(result.guardrailDetails.filter((d) => d.includes("Cost"))).toHaveLength(0);
  });

  it("handles undefined optional metrics gracefully", () => {
    const baseline: SelfImprovementMetrics = { taskSuccessRate: 0.8 };
    const candidate: SelfImprovementMetrics = { taskSuccessRate: 0.9 };
    const result = scoreExperiment(baseline, candidate);
    expect(result.successRateDelta).toBeCloseTo(0.1, 5);
    expect(result.guardrailTriggered).toBe(false);
  });

  it("can trigger multiple guardrails simultaneously", () => {
    const baseline = makeMetrics({
      retryRate: 0.05,
      reviewPassRate: 0.95,
      avgLatencyMs: 1000,
      avgCostUsd: 0.1,
    });
    const candidate = makeMetrics({
      retryRate: 0.5,
      reviewPassRate: 0.5,
      avgLatencyMs: 5000,
      avgCostUsd: 0.5,
    });
    const result = scoreExperiment(baseline, candidate);
    expect(result.guardrailTriggered).toBe(true);
    expect(result.guardrailDetails.length).toBeGreaterThanOrEqual(3);
  });
});

describe("decideExperimentOutcome", () => {
  describe("reject on success rate regression", () => {
    it("rejects when candidate success rate is worse regardless of autonomy level", () => {
      const baseline = makeMetrics({ taskSuccessRate: 0.9 });
      const candidate = makeMetrics({ taskSuccessRate: 0.7 });

      for (const level of ["confirm_all", "major_only", "full"] as const) {
        const result = decideExperimentOutcome(baseline, candidate, level);
        expect(result.decision).toBe("reject");
        expect(result.reason).toContain("worse");
      }
    });
  });

  describe("confirm_all autonomy", () => {
    it("queues approval even when candidate is better with no guardrails", () => {
      const baseline = makeMetrics({ taskSuccessRate: 0.7 });
      const candidate = makeMetrics({ taskSuccessRate: 0.9 });
      const result = decideExperimentOutcome(baseline, candidate, "confirm_all");
      expect(result.decision).toBe("approval_needed");
      expect(result.reason).toContain("confirm_all");
    });

    it("queues approval when candidate matches baseline", () => {
      const baseline = makeMetrics({ taskSuccessRate: 0.8 });
      const candidate = makeMetrics({ taskSuccessRate: 0.8 });
      const result = decideExperimentOutcome(baseline, candidate, "confirm_all");
      expect(result.decision).toBe("approval_needed");
    });
  });

  describe("major_only autonomy", () => {
    it("auto-promotes when candidate clearly improves success rate with no guardrails", () => {
      const baseline = makeMetrics({ taskSuccessRate: 0.7 });
      const candidate = makeMetrics({ taskSuccessRate: 0.9 });
      const result = decideExperimentOutcome(baseline, candidate, "major_only");
      expect(result.decision).toBe("promote");
      expect(result.reason).toContain("Auto-promoting");
    });

    it("queues approval when candidate matches baseline (no clear improvement)", () => {
      const baseline = makeMetrics({ taskSuccessRate: 0.8 });
      const candidate = makeMetrics({ taskSuccessRate: 0.8 });
      const result = decideExperimentOutcome(baseline, candidate, "major_only");
      expect(result.decision).toBe("approval_needed");
      expect(result.reason).toContain("does not clearly improve");
    });

    it("queues approval when guardrails are triggered even with improvement", () => {
      const baseline = makeMetrics({ taskSuccessRate: 0.7, retryRate: 0.05 });
      const candidate = makeMetrics({ taskSuccessRate: 0.9, retryRate: 0.5 });
      const result = decideExperimentOutcome(baseline, candidate, "major_only");
      expect(result.decision).toBe("approval_needed");
      expect(result.guardrailTriggered).toBe(true);
    });
  });

  describe("full autonomy", () => {
    it("auto-promotes when candidate improves success rate with no guardrails", () => {
      const baseline = makeMetrics({ taskSuccessRate: 0.7 });
      const candidate = makeMetrics({ taskSuccessRate: 0.9 });
      const result = decideExperimentOutcome(baseline, candidate, "full");
      expect(result.decision).toBe("promote");
      expect(result.reason).toContain("Auto-promoting");
    });

    it("auto-promotes when candidate matches baseline with no guardrails", () => {
      const baseline = makeMetrics({ taskSuccessRate: 0.8 });
      const candidate = makeMetrics({ taskSuccessRate: 0.8 });
      const result = decideExperimentOutcome(baseline, candidate, "full");
      expect(result.decision).toBe("promote");
    });

    it("queues approval when guardrails triggered even with improvement", () => {
      const baseline = makeMetrics({ taskSuccessRate: 0.7, retryRate: 0.05 });
      const candidate = makeMetrics({ taskSuccessRate: 0.9, retryRate: 0.5 });
      const result = decideExperimentOutcome(baseline, candidate, "full");
      expect(result.decision).toBe("approval_needed");
      expect(result.guardrailTriggered).toBe(true);
    });

    it("queues approval when guardrails triggered without improvement", () => {
      const baseline = makeMetrics({ taskSuccessRate: 0.8, avgLatencyMs: 1000 });
      const candidate = makeMetrics({ taskSuccessRate: 0.8, avgLatencyMs: 5000 });
      const result = decideExperimentOutcome(baseline, candidate, "full");
      expect(result.decision).toBe("approval_needed");
    });
  });

  describe("result shape", () => {
    it("includes all expected fields in the result", () => {
      const baseline = makeMetrics();
      const candidate = makeMetrics();
      const result = decideExperimentOutcome(baseline, candidate, "full");
      expect(result).toHaveProperty("decision");
      expect(result).toHaveProperty("reason");
      expect(result).toHaveProperty("successRateDelta");
      expect(result).toHaveProperty("guardrailTriggered");
      expect(result).toHaveProperty("guardrailDetails");
      expect(typeof result.reason).toBe("string");
      expect(typeof result.successRateDelta).toBe("number");
      expect(typeof result.guardrailTriggered).toBe("boolean");
      expect(Array.isArray(result.guardrailDetails)).toBe(true);
    });
  });

  describe("edge cases", () => {
    it("handles zero success rates for both baseline and candidate", () => {
      const baseline = makeMetrics({ taskSuccessRate: 0 });
      const candidate = makeMetrics({ taskSuccessRate: 0 });
      const result = decideExperimentOutcome(baseline, candidate, "full");
      expect(result.decision).toBe("promote");
    });

    it("handles perfect success rates for both", () => {
      const baseline = makeMetrics({ taskSuccessRate: 1.0 });
      const candidate = makeMetrics({ taskSuccessRate: 1.0 });
      const result = decideExperimentOutcome(baseline, candidate, "full");
      expect(result.decision).toBe("promote");
    });

    it("handles unknown autonomy level gracefully", () => {
      const baseline = makeMetrics();
      const candidate = makeMetrics();
      const result = decideExperimentOutcome(baseline, candidate, "unknown_level" as never);
      expect(result.decision).toBe("approval_needed");
      expect(result.reason).toContain("Unknown autonomy level");
    });

    it("very small negative delta below threshold is treated as equal", () => {
      const baseline = makeMetrics({ taskSuccessRate: 0.8 });
      const candidate = makeMetrics({ taskSuccessRate: 0.7999 });
      const result = decideExperimentOutcome(baseline, candidate, "full");
      expect(result.decision).toBe("promote");
    });

    it("very small positive delta below threshold is not treated as improvement under major_only", () => {
      const baseline = makeMetrics({ taskSuccessRate: 0.8 });
      const candidate = makeMetrics({ taskSuccessRate: 0.8005 });
      const result = decideExperimentOutcome(baseline, candidate, "major_only");
      expect(result.decision).toBe("approval_needed");
    });
  });
});
