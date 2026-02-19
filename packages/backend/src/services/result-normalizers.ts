import type { CodingAgentResult, ReviewAgentResult } from "@opensprint/shared";

/** Normalize coding agent status variants to canonical "success" / "failure". Mutates in place. */
export function normalizeCodingStatus(result: CodingAgentResult): void {
  const s = result.status.toLowerCase().trim();
  if (["completed", "complete", "done", "passed"].includes(s)) {
    (result as { status: string }).status = "success";
  }
}

/** Normalize review agent status variants to canonical "approved" / "rejected". Mutates in place. */
export function normalizeReviewStatus(result: ReviewAgentResult): void {
  const s = String(result.status).toLowerCase().trim();
  if (["approve", "success", "accept", "accepted"].includes(s)) {
    (result as { status: string }).status = "approved";
  } else if (["reject", "fail", "failed"].includes(s)) {
    (result as { status: string }).status = "rejected";
  }
}
