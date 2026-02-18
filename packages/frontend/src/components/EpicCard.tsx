import type { Plan, Task } from "@opensprint/shared";
import { formatPlanIdAsTitle } from "../lib/formatting";
import { COLUMN_LABELS } from "./kanban/TaskStatusBadge";

export interface EpicCardProps {
  plan: Plan;
  tasks: Task[];
  executingPlanId: string | null;
  reExecutingPlanId: string | null;
  onSelect: () => void;
  onShip: () => void;
  onReship: () => void;
}

const statusConfig: Record<
  string,
  { badge: string; accent: string; icon: React.ReactNode }
> = {
  planning: {
    badge: "bg-theme-warning-bg text-theme-warning-text ring-1 ring-theme-warning-border/60",
    accent: "bg-theme-warning-solid",
    icon: (
      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
      </svg>
    ),
  },
  building: {
    badge: "bg-theme-info-bg text-theme-info-text ring-1 ring-theme-info-border/60",
    accent: "bg-theme-info-solid",
    icon: (
      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden>
        <path strokeLinecap="round" strokeLinejoin="round" d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
      </svg>
    ),
  },
  complete: {
    badge: "bg-theme-success-bg text-theme-success-text ring-1 ring-theme-success-border/60",
    accent: "bg-theme-success-solid",
    icon: (
      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
  },
};

const defaultStatus = {
  badge: "bg-theme-surface-muted text-theme-text ring-1 ring-theme-border/60",
  accent: "bg-theme-ring",
  icon: null,
};

export function EpicCard({
  plan,
  tasks,
  executingPlanId,
  reExecutingPlanId,
  onSelect,
  onShip,
  onReship,
}: EpicCardProps) {
  const progress = plan.taskCount > 0 ? (plan.doneTaskCount / plan.taskCount) * 100 : 0;
  const config = statusConfig[plan.status] ?? defaultStatus;

  return (
    <div
      className="group relative overflow-hidden rounded-xl bg-theme-surface shadow-sm ring-1 ring-theme-border cursor-pointer
        hover:shadow-lg hover:ring-brand-200/80 transition-all duration-200 ease-out hover:-translate-y-0.5
        focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600"
      onClick={onSelect}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onSelect();
        }
      }}
    >
      {/* Status accent bar */}
      <div
        className={`absolute left-0 top-0 bottom-0 w-1 ${config.accent}`}
        aria-hidden
      />

      <div className="pl-4 pr-4 pt-4 pb-3">
        {/* Header */}
        <div className="flex items-start justify-between gap-3 mb-3">
          <h3 className="font-semibold text-theme-text text-base truncate flex-1 min-w-0 leading-tight">
            {formatPlanIdAsTitle(plan.metadata.planId)}
          </h3>
          <span
            className={`shrink-0 inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium capitalize ${config.badge}`}
          >
            {config.icon}
            {plan.status}
          </span>
        </div>

        {/* Progress section */}
        <div className="mb-3">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-xs font-medium text-theme-muted">Progress</span>
            <span className="text-xs font-semibold text-theme-text">
              {plan.doneTaskCount}/{plan.taskCount}
              {plan.taskCount > 0 && (
                <span className="ml-1 text-theme-muted font-normal">
                  ({Math.round(progress)}%)
                </span>
              )}
            </span>
          </div>
          <div className="w-full bg-theme-surface-muted rounded-full h-2 overflow-hidden">
            <div
              className="h-2 rounded-full transition-all duration-500 ease-out bg-gradient-to-r from-brand-500 to-brand-600"
              style={{ width: `${progress}%` }}
              role="progressbar"
              aria-valuenow={plan.doneTaskCount}
              aria-valuemin={0}
              aria-valuemax={plan.taskCount}
              aria-label={`${plan.doneTaskCount} of ${plan.taskCount} tasks done`}
            />
          </div>
          {plan.doneTaskCount > 0 && plan.doneTaskCount < plan.taskCount && plan.metadata.complexity && (
            <p className="text-xs text-theme-muted mt-1">
              {plan.metadata.complexity} complexity
            </p>
          )}
        </div>

        {/* Nested subtasks */}
        {tasks.length > 0 && (
          <div className="mb-3 rounded-lg bg-theme-surface-muted/80 ring-1 ring-theme-border overflow-hidden">
            <ul className="space-y-0.5 p-2 max-h-24 overflow-y-auto">
              {tasks.map((task) => (
                <li
                  key={task.id}
                  className="flex items-center gap-2 py-1 px-2 rounded-md hover:bg-theme-border-subtle transition-colors text-xs text-theme-text"
                  title={`${task.title} — ${COLUMN_LABELS[task.kanbanColumn]}`}
                >
                  <span
                    className={`shrink-0 w-2 h-2 rounded-full ${
                      task.kanbanColumn === "done"
                        ? "bg-theme-status-done"
                        : task.kanbanColumn === "in_progress" || task.kanbanColumn === "in_review"
                          ? "bg-theme-status-in-progress"
                          : "bg-theme-ring"
                    }`}
                  />
                  <span className="truncate flex-1 min-w-0">{task.title}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Action buttons */}
        {plan.status === "planning" && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onShip();
            }}
            disabled={!!executingPlanId}
            className="btn-primary text-xs w-full py-2 disabled:opacity-60 disabled:cursor-not-allowed rounded-lg font-medium"
          >
            {executingPlanId === plan.metadata.planId ? "Executing…" : "Execute!"}
          </button>
        )}
        {plan.status === "complete" &&
          plan.metadata.shippedAt &&
          plan.lastModified &&
          plan.lastModified > plan.metadata.shippedAt && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onReship();
              }}
              disabled={!!reExecutingPlanId}
              className="btn-secondary text-xs w-full py-2 disabled:opacity-60 disabled:cursor-not-allowed rounded-lg font-medium"
            >
              {reExecutingPlanId === plan.metadata.planId ? "Re-executing…" : "Re-execute"}
            </button>
          )}
      </div>
    </div>
  );
}
