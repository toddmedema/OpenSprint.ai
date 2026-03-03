/**
 * Inline diff for a single PRD section — GitHub-style highlighting.
 * Renders removed text in red, added text in green, inline within the PRD content.
 */

import * as Diff from "diff";
import type { ScopeChangeProposedUpdate } from "@opensprint/shared";

export interface PrdSectionInlineDiffProps {
  /** Current section content */
  currentContent: string;
  /** Proposed update from Harmonizer */
  proposedUpdate: ScopeChangeProposedUpdate;
}

/**
 * Renders a section's diff inline with GitHub-style highlighting:
 * - Removed lines: red background, red text
 * - Added lines: green background, green text
 */
export function PrdSectionInlineDiff({
  currentContent,
  proposedUpdate,
}: PrdSectionInlineDiffProps) {
  const proposedContent = (proposedUpdate.content ?? "").trim();
  const current = currentContent.trim();

  const diffParts = Diff.diffLines(current, proposedContent, {
    newlineIsToken: true,
  });

  return (
    <div
      className="rounded-lg border border-theme-border bg-theme-surface-muted overflow-hidden font-mono text-sm"
      data-testid={`prd-inline-diff-${proposedUpdate.section}`}
    >
      {proposedUpdate.changeLogEntry && (
        <div className="px-3 py-1.5 bg-theme-border-subtle/50 border-b border-theme-border text-xs text-theme-muted">
          {proposedUpdate.changeLogEntry}
        </div>
      )}
      <div className="p-3 overflow-x-auto max-h-80 overflow-y-auto">
        {diffParts.length === 0 && current === "" && proposedContent === "" ? (
          <span className="text-theme-muted">(No content)</span>
        ) : (
          <pre className="m-0 whitespace-pre-wrap break-words font-mono text-sm">
            {diffParts.map((part, i) => {
              const bg = part.added
                ? "bg-theme-success-bg"
                : part.removed
                  ? "bg-theme-error-bg"
                  : "";
              const textColor = part.added
                ? "text-theme-success-text"
                : part.removed
                  ? "text-theme-error-text"
                  : "text-theme-text";
              const prefix = part.added ? "+ " : part.removed ? "- " : "  ";
              const lines = part.value.split("\n");
              return (
                <span key={i} className={`${bg} ${textColor}`}>
                  {lines.map((line, j) => (
                    <span key={j} className="block">
                      {prefix}
                      {line || "\u00a0"}
                    </span>
                  ))}
                </span>
              );
            })}
          </pre>
        )}
      </div>
    </div>
  );
}
