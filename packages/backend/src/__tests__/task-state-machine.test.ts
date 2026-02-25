import { describe, it, expect } from "vitest";
import { validateTransition } from "../services/task-state-machine.js";

describe("TaskStateMachine", () => {
  describe("validateTransition", () => {
    it("allows idle → coding via start_task", () => {
      expect(validateTransition("t1", "idle", "start_task")).toBe(true);
    });

    it("allows coding → review via enter_review", () => {
      expect(validateTransition("t1", "coding", "enter_review")).toBe(true);
    });

    it("allows coding → idle via complete", () => {
      expect(validateTransition("t1", "coding", "complete")).toBe(true);
    });

    it("allows coding → idle via fail", () => {
      expect(validateTransition("t1", "coding", "fail")).toBe(true);
    });

    it("allows review → idle via complete", () => {
      expect(validateTransition("t1", "review", "complete")).toBe(true);
    });

    it("allows review → idle via fail", () => {
      expect(validateTransition("t1", "review", "fail")).toBe(true);
    });

    it("rejects enter_review from review (already in review)", () => {
      expect(validateTransition("t1", "review", "enter_review")).toBe(false);
    });

    it("rejects enter_review from idle (no coding phase)", () => {
      expect(validateTransition("t1", "idle", "enter_review")).toBe(false);
    });

    it("rejects start_task from coding (already started)", () => {
      expect(validateTransition("t1", "coding", "start_task")).toBe(false);
    });

    it("rejects start_task from review", () => {
      expect(validateTransition("t1", "review", "start_task")).toBe(false);
    });
  });
});
