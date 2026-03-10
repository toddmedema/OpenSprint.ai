/**
 * PRD diff API response types. Match @opensprint/shared (PrdProposedDiffResponse, PrdVersionDiffResponse).
 * Import here so the client type-checks when workspace resolves shared from another tree.
 */

export interface PrdDiffLine {
  type: "add" | "remove" | "context";
  text: string;
  oldLineNumber?: number;
  newLineNumber?: number;
}

export interface PrdDiffResult {
  lines: PrdDiffLine[];
  summary?: { additions: number; deletions: number };
}

export interface PrdProposedDiffResponse {
  requestId: string;
  diff: PrdDiffResult;
}

export interface PrdVersionDiffResponse {
  fromVersion: string;
  toVersion: string;
  diff: PrdDiffResult;
}
