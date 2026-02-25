/**
 * Task lifecycle state machine — encodes valid phase transitions.
 *
 * Phases:
 *   idle    → coding  (task picked up, agent spawned)
 *   coding  → review  (coder succeeded, reviewer spawned)
 *   coding  → idle    (fail or complete without review)
 *   review  → idle    (review done: approved/rejected/failed)
 *
 * "idle" represents no active slot for the task.
 */

import { createLogger } from "../utils/logger.js";

const log = createLogger("state-machine");

export type TaskPhase = "coding" | "review";
type PhaseOrIdle = TaskPhase | "idle";

const VALID_TRANSITIONS: Record<PhaseOrIdle, PhaseOrIdle[]> = {
  idle: ["coding"],
  coding: ["review", "idle"],
  review: ["idle"],
};

export type TransitionType = "start_task" | "enter_review" | "complete" | "fail";

const TRANSITION_MAP: Record<
  TransitionType,
  { expectedFrom: PhaseOrIdle | null; to: PhaseOrIdle }
> = {
  start_task: { expectedFrom: null, to: "coding" },
  enter_review: { expectedFrom: "coding", to: "review" },
  complete: { expectedFrom: null, to: "idle" },
  fail: { expectedFrom: null, to: "idle" },
};

/**
 * Validate a task phase transition. Returns true if valid, false if not.
 * Logs a warning on invalid transitions rather than throwing, to avoid
 * breaking the orchestrator loop on edge cases.
 */
export function validateTransition(
  taskId: string,
  currentPhase: PhaseOrIdle,
  transitionType: TransitionType
): boolean {
  const rule = TRANSITION_MAP[transitionType];

  if (rule.expectedFrom !== null && currentPhase !== rule.expectedFrom) {
    log.warn("Unexpected source phase for transition", {
      taskId,
      transition: transitionType,
      expected: rule.expectedFrom,
      actual: currentPhase,
    });
    return false;
  }

  const valid = VALID_TRANSITIONS[currentPhase];
  if (!valid.includes(rule.to)) {
    log.warn("Invalid state transition", {
      taskId,
      from: currentPhase,
      to: rule.to,
      transition: transitionType,
    });
    return false;
  }

  return true;
}
