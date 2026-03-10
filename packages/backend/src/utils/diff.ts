/**
 * Server-side line-based diff for PRD/SPEC content.
 * Uses the same algorithm as frontend PrdDiffView (diff library, diffLines with newlineIsToken: true)
 * so results are consistent.
 */

import * as Diff from "diff";

/** Single line in a PRD diff result */
export interface PrdDiffLine {
  type: "add" | "remove" | "context";
  text: string;
  oldLineNumber?: number;
  newLineNumber?: number;
}

/** Result of diffing two text contents (shared format for API responses) */
export interface PrdDiffResult {
  lines: PrdDiffLine[];
  summary?: {
    additions: number;
    deletions: number;
  };
}

/**
 * Splits a chunk value into logical lines. With newlineIsToken: true, trailing \n
 * produces an extra ""; we treat that as "no extra line" so line count matches editors.
 */
function chunkLines(value: string): string[] {
  const lines = value.split("\n");
  if (value.endsWith("\n") && lines.length > 0 && lines[lines.length - 1] === "") {
    lines.pop();
  }
  return lines;
}

/**
 * Computes a line-based diff between old and new content and returns the shared
 * PrdDiffResult format (lines with type, text, line numbers, and summary).
 * Uses the same diff library and options as PrdDiffView for consistency.
 */
export function computeLineDiff(oldContent: string, newContent: string): PrdDiffResult {
  const parts = Diff.diffLines(oldContent, newContent, { newlineIsToken: true });

  const lines: PrdDiffLine[] = [];
  let oldLineNumber = 1;
  let newLineNumber = 1;
  let additions = 0;
  let deletions = 0;

  for (const part of parts) {
    const lineTexts = chunkLines(part.value);

    if (part.added) {
      for (const text of lineTexts) {
        lines.push({
          type: "add",
          text,
          newLineNumber: newLineNumber++,
        });
        additions++;
      }
    } else if (part.removed) {
      for (const text of lineTexts) {
        lines.push({
          type: "remove",
          text,
          oldLineNumber: oldLineNumber++,
        });
        deletions++;
      }
    } else {
      for (const text of lineTexts) {
        lines.push({
          type: "context",
          text,
          oldLineNumber: oldLineNumber++,
          newLineNumber: newLineNumber++,
        });
      }
    }
  }

  return {
    lines,
    summary: { additions, deletions },
  };
}
