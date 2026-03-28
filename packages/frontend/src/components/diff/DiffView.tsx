import { useCallback, useEffect, useRef, useState } from "react";

export type DiffLineType = "add" | "remove" | "context";

export interface DiffLine {
  type: DiffLineType;
  text: string;
  oldLineNumber?: number;
  newLineNumber?: number;
}

export interface DiffResult {
  lines: DiffLine[];
  summary?: { additions: number; deletions: number };
}

export type DiffViewMode = "rendered" | "raw";

export interface DiffViewProps {
  diff: DiffResult;
  fromContent?: string;
  toContent?: string;
  defaultMode?: DiffViewMode;
}

export const INITIAL_LINE_CAP = 500;

const LINE_ARIA: Record<DiffLineType, string> = {
  add: "Added line",
  remove: "Removed line",
  context: "Context line",
};

export function DiffView({ diff, defaultMode = "raw" }: DiffViewProps) {
  const [mode, setMode] = useState<DiffViewMode>(defaultMode);
  const [focusedIndex, setFocusedIndex] = useState<number | null>(null);
  const [expanded, setExpanded] = useState(false);
  const lineRefs = useRef<(HTMLDivElement | null)[]>([]);

  const { lines, summary } = diff;
  const isCapped = lines.length > INITIAL_LINE_CAP && !expanded;
  const visibleLines = isCapped ? lines.slice(0, INITIAL_LINE_CAP) : lines;
  const hiddenCount = lines.length - visibleLines.length;

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (visibleLines.length === 0) return;
      const maxIdx = visibleLines.length - 1;
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setFocusedIndex((i) => (i === null ? 0 : Math.min(i + 1, maxIdx)));
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setFocusedIndex((i) => (i === null ? maxIdx : Math.max(i - 1, 0)));
      } else if (e.key === "Home") {
        e.preventDefault();
        setFocusedIndex(0);
      } else if (e.key === "End") {
        e.preventDefault();
        setFocusedIndex(maxIdx);
      }
    },
    [visibleLines.length],
  );

  useEffect(() => {
    if (focusedIndex === null) return;
    lineRefs.current[focusedIndex]?.focus();
  }, [focusedIndex]);

  return (
    <div
      className="rounded-lg border border-theme-border bg-theme-surface-muted overflow-hidden"
      data-testid="diff-view"
    >
      {/* Toggle bar */}
      <div
        className="flex items-center gap-2 px-3 py-2 bg-theme-border-subtle/50 border-b border-theme-border"
        data-testid="diff-view-toggle-bar"
      >
        <div
          role="radiogroup"
          aria-label="Diff view mode"
          className="inline-flex rounded-md border border-theme-border overflow-hidden text-xs"
        >
          <button
            type="button"
            role="radio"
            aria-checked={mode === "rendered"}
            onClick={() => setMode("rendered")}
            className={`px-3 py-1 focus:outline-none focus-visible:ring-2 focus-visible:ring-theme-ring ${
              mode === "rendered"
                ? "bg-theme-accent text-white"
                : "bg-theme-surface text-theme-text hover:bg-theme-surface-muted"
            }`}
          >
            Rendered
          </button>
          <button
            type="button"
            role="radio"
            aria-checked={mode === "raw"}
            onClick={() => setMode("raw")}
            className={`px-3 py-1 focus:outline-none focus-visible:ring-2 focus-visible:ring-theme-ring ${
              mode === "raw"
                ? "bg-theme-accent text-white"
                : "bg-theme-surface text-theme-text hover:bg-theme-surface-muted"
            }`}
          >
            Raw
          </button>
        </div>
        {summary != null && (
          <span className="ml-auto text-xs text-theme-muted" data-testid="diff-view-summary">
            +{summary.additions} −{summary.deletions}
          </span>
        )}
      </div>

      {/* Content area */}
      {mode === "raw" ? (
        <div
          className="font-mono text-xs overflow-x-auto max-h-[24rem] overflow-y-auto focus:outline-none focus-visible:ring-2 focus-visible:ring-theme-ring focus-visible:ring-inset"
          role="textbox"
          tabIndex={0}
          aria-label="Diff lines"
          onKeyDown={handleKeyDown}
          onBlur={(e) => {
            if (!e.currentTarget.contains(e.relatedTarget)) setFocusedIndex(null);
          }}
          data-testid="diff-view-raw"
        >
          {lines.length === 0 ? (
            <div className="p-3 text-theme-muted" data-testid="diff-view-no-changes">
              No changes
            </div>
          ) : (
            <>
              <pre className="m-0 p-0 whitespace-pre-wrap break-words">
                {visibleLines.map((line, i) => {
                  const isAdd = line.type === "add";
                  const isRemove = line.type === "remove";
                  const bg = isAdd
                    ? "bg-theme-success-bg"
                    : isRemove
                      ? "bg-theme-error-bg"
                      : "";
                  const textColor = isAdd
                    ? "text-theme-success-text"
                    : isRemove
                      ? "text-theme-error-text"
                      : "text-theme-text";
                  const marker = isAdd ? "+" : isRemove ? "-" : " ";
                  const ariaLabel = LINE_ARIA[line.type];
                  const oldNum =
                    line.oldLineNumber != null ? String(line.oldLineNumber) : "";
                  const newNum =
                    line.newLineNumber != null ? String(line.newLineNumber) : "";
                  return (
                    <div
                      key={i}
                      ref={(el) => {
                        lineRefs.current[i] = el;
                      }}
                      role="listitem"
                      aria-label={`${ariaLabel}: ${line.text.slice(0, 80)}${line.text.length > 80 ? "…" : ""}`}
                      tabIndex={-1}
                      className={`flex min-w-0 border-l-2 ${isAdd ? "border-l-theme-success-border" : isRemove ? "border-l-theme-error-border" : "border-l-transparent"} ${bg} ${textColor} ${focusedIndex === i ? "ring-1 ring-inset ring-theme-ring" : ""}`}
                      data-line-type={line.type}
                    >
                      <span
                        className="shrink-0 w-10 text-right pr-2 py-0.5 text-theme-muted select-none"
                        aria-hidden="true"
                        data-testid={`line-old-${i}`}
                      >
                        {oldNum}
                      </span>
                      <span
                        className="shrink-0 w-10 text-right pr-2 py-0.5 text-theme-muted select-none border-r border-theme-border-subtle"
                        aria-hidden="true"
                        data-testid={`line-new-${i}`}
                      >
                        {newNum}
                      </span>
                      <span
                        className="shrink-0 w-4 text-center py-0.5 select-none"
                        aria-hidden="true"
                        data-testid={`line-marker-${i}`}
                      >
                        {marker}
                      </span>
                      <span className="flex-1 py-0.5 pl-1">{line.text || "\u00a0"}</span>
                    </div>
                  );
                })}
              </pre>
              {isCapped && (
                <div className="px-3 py-2 border-t border-theme-border bg-theme-surface-muted">
                  <button
                    type="button"
                    onClick={() => setExpanded(true)}
                    className="text-sm text-theme-accent hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-theme-ring rounded"
                    data-testid="diff-view-show-more"
                  >
                    Show more ({hiddenCount} more line{hiddenCount !== 1 ? "s" : ""})
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      ) : (
        <div
          className="p-4 text-sm text-theme-muted"
          data-testid="diff-view-rendered-placeholder"
        >
          Rendered diff mode is not yet available.
        </div>
      )}
    </div>
  );
}
