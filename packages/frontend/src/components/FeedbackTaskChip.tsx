import { memo } from "react";
import { shallowEqual } from "react-redux";
import type { KanbanColumn } from "@opensprint/shared";
import { useAppSelector } from "../store";
import { selectTaskSummary } from "../store/slices/executeSlice";
import { TaskStatusBadge, COLUMN_LABELS } from "./kanban";
import { TaskLinkDisplay } from "./TaskLinkDisplay";
import { TaskLinkTooltip } from "./TaskLinkTooltip";
import { PriorityIcon } from "./PriorityIcon";

export interface FeedbackTaskChipProps {
  taskId: string;
  projectId: string;
  onNavigateToBuildTask?: (taskId: string) => void;
}

const DEFAULT_PRIORITY = 1;
const DEFAULT_COLUMN: KanbanColumn = "backlog";

/**
 * Task chip for Evaluate feedback cards. Subscribes to Redux for this task's summary only.
 * Re-renders only when this task's state changes (status, priority, title), keeping
 * feedback card re-renders isolated to the affected chip.
 */
export const FeedbackTaskChip = memo(function FeedbackTaskChip({
  taskId,
  projectId,
  onNavigateToBuildTask,
}: FeedbackTaskChipProps) {
  const summary = useAppSelector((state) => selectTaskSummary(state, taskId), shallowEqual);
  const column = summary?.kanbanColumn ?? DEFAULT_COLUMN;
  const statusLabel = COLUMN_LABELS[column];
  const priority = summary?.priority ?? DEFAULT_PRIORITY;
  const cachedTitle = summary?.title;

  const chipContent = (
    <>
      <PriorityIcon priority={priority} size="xs" />
      <TaskStatusBadge column={column} size="xs" />
      <span
        className="text-theme-muted font-sans font-normal no-underline"
        aria-label={`Status: ${statusLabel}`}
      >
        {statusLabel}
      </span>
      <TaskLinkDisplay projectId={projectId} taskId={taskId} cachedTitle={cachedTitle} />
    </>
  );

  return (
    <TaskLinkTooltip projectId={projectId} taskId={taskId} cachedTitle={cachedTitle}>
      {onNavigateToBuildTask ? (
        <button
          type="button"
          onClick={() => onNavigateToBuildTask(taskId)}
          className="inline-flex items-center gap-1.5 rounded bg-theme-border-subtle px-1.5 py-0.5 text-xs font-mono text-brand-600 hover:bg-theme-info-bg hover:text-theme-info-text underline transition-colors"
        >
          {chipContent}
        </button>
      ) : (
        <span className="inline-flex items-center gap-1.5 rounded bg-theme-border-subtle px-1.5 py-0.5 text-xs font-mono text-theme-muted">
          {chipContent}
        </span>
      )}
    </TaskLinkTooltip>
  );
});
