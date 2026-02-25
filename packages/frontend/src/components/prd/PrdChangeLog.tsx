import { formatSectionKey, formatTimestamp } from "../../lib/formatting";
import { getPrdSourceColor, PRD_SOURCE_LABELS } from "../../lib/constants";

export interface PrdHistoryEntry {
  section: string;
  version: number;
  timestamp: string;
  source: string;
  diff: string;
}

export interface PrdChangeLogProps {
  entries: PrdHistoryEntry[];
  expanded: boolean;
  onToggle: () => void;
}

export function PrdChangeLog({ entries, expanded, onToggle }: PrdChangeLogProps) {
  return (
    <div className="mt-10 pt-6 border-t border-theme-border">
      <button
        type="button"
        onClick={onToggle}
        className="flex items-center justify-between w-full text-left text-sm font-medium text-theme-muted hover:text-theme-text"
      >
        <span>Change history</span>
        <span className="text-theme-muted text-xs">
          {entries.length} {entries.length === 1 ? "entry" : "entries"}
          <span className="ml-1">{expanded ? "▲" : "▼"}</span>
        </span>
      </button>
      {expanded && (
        <div className="mt-3 space-y-2 max-h-48 overflow-y-auto">
          {entries.length === 0 ? (
            <p className="text-sm text-theme-muted">No changes yet</p>
          ) : (
            [...entries].reverse().map((entry, i) => (
              <div
                key={`${entry.section}-${entry.version}-${i}`}
                className="text-xs bg-theme-surface-muted rounded border border-theme-border p-2"
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="font-medium text-theme-text">
                    {formatSectionKey(entry.section)}
                  </span>
                  <span className="text-theme-muted shrink-0">
                    {formatTimestamp(entry.timestamp)}
                  </span>
                </div>
                <div className="mt-1 flex items-center gap-2">
                  <span
                    className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${getPrdSourceColor(entry.source)}`}
                  >
                    {PRD_SOURCE_LABELS[entry.source] ?? entry.source}
                  </span>
                  <span className="text-theme-muted">v{entry.version}</span>
                  <span className="text-theme-muted truncate">{entry.diff}</span>
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
