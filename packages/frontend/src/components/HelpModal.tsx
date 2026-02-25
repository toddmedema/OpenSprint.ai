import { useState } from "react";
import type { AgentRole } from "@opensprint/shared";
import {
  AGENT_ROLE_CANONICAL_ORDER,
  AGENT_ROLE_LABELS,
  AGENT_ROLE_PHASES,
  AGENT_ROLE_DESCRIPTIONS,
} from "@opensprint/shared";
import { CloseButton } from "./CloseButton";

/** Base URL for public assets (Vite BASE_URL) */
const ASSET_BASE = (import.meta.env.BASE_URL ?? "/").replace(/\/*$/, "/");

export interface HelpModalProps {
  onClose: () => void;
  /** Optional project context (per-project view vs homepage) */
  project?: { id: string; name: string } | null;
}

type TabId = "ask" | "meet";

/**
 * Help modal with two tabs: Ask a Question (default) and Meet your Team.
 * Available from ? on homepage and per-project view.
 */
export function HelpModal({ onClose, project }: HelpModalProps) {
  const [activeTab, setActiveTab] = useState<TabId>("ask");

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) onClose();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Escape") onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-theme-overlay p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="help-modal-title"
      aria-label="Help"
      onClick={handleBackdropClick}
      onKeyDown={handleKeyDown}
      data-testid="help-modal-backdrop"
    >
      <div
        className="relative w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col rounded-lg bg-theme-surface shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header with tabs */}
        <div className="shrink-0 border-b border-theme-border">
          <div className="flex items-center justify-between px-6 py-4">
            <h2 id="help-modal-title" className="text-lg font-semibold text-theme-text">
              Help
            </h2>
            <CloseButton onClick={onClose} ariaLabel="Close help" />
          </div>
          <div
            className="flex gap-1 px-6 -mb-px"
            role="tablist"
            aria-label="Help sections"
          >
            <button
              type="button"
              role="tab"
              aria-selected={activeTab === "ask"}
              aria-controls="help-tabpanel-ask"
              id="help-tab-ask"
              onClick={() => setActiveTab("ask")}
              className={`px-4 py-2 text-sm font-medium rounded-t-md transition-colors ${
                activeTab === "ask"
                  ? "bg-theme-surface text-theme-text border border-theme-border border-b-theme-surface"
                  : "text-theme-muted hover:text-theme-text hover:bg-theme-border-subtle"
              }`}
            >
              Ask a Question
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={activeTab === "meet"}
              aria-controls="help-tabpanel-meet"
              id="help-tab-meet"
              onClick={() => setActiveTab("meet")}
              className={`px-4 py-2 text-sm font-medium rounded-t-md transition-colors ${
                activeTab === "meet"
                  ? "bg-theme-surface text-theme-text border border-theme-border border-b-theme-surface"
                  : "text-theme-muted hover:text-theme-text hover:bg-theme-border-subtle"
              }`}
            >
              Meet your Team
            </button>
          </div>
        </div>

        {/* Tab panels */}
        <div className="flex-1 overflow-y-auto">
          <div
            id="help-tabpanel-ask"
            role="tabpanel"
            aria-labelledby="help-tab-ask"
            hidden={activeTab !== "ask"}
            className="px-6 py-4"
          >
            <AskQuestionContent project={project} />
          </div>
          <div
            id="help-tabpanel-meet"
            role="tabpanel"
            aria-labelledby="help-tab-meet"
            hidden={activeTab !== "meet"}
            className="px-6 py-4"
          >
            <MeetYourTeamContent />
          </div>
        </div>
      </div>
    </div>
  );
}

function AskQuestionContent({ project }: { project?: { id: string; name: string } | null }) {
  return (
    <div className="space-y-4">
      <p className="text-theme-muted text-sm">
        {project
          ? `Ask about ${project.name} — PRD, plans, tasks, or currently running agents.`
          : "Ask about your projects, tasks, or currently running agents."}
      </p>
      <p className="text-theme-muted text-sm">
        Chat with an AI assistant in ask-only mode. It will answer questions without changing
        project state, PRD, or tasks.
      </p>
      <div className="rounded-lg border border-theme-border bg-theme-surface-muted p-4 text-center text-theme-muted text-sm">
        Ask a Question chat coming soon.
      </div>
    </div>
  );
}

function MeetYourTeamContent() {
  return (
    <div
      className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3"
      role="list"
      aria-label="Agent team members"
    >
      {AGENT_ROLE_CANONICAL_ORDER.map((role) => (
        <AgentCard key={role} role={role} />
      ))}
    </div>
  );
}

function AgentCard({ role }: { role: AgentRole }) {
  const [iconError, setIconError] = useState(false);
  const label = AGENT_ROLE_LABELS[role];
  const phases = AGENT_ROLE_PHASES[role];
  const description = AGENT_ROLE_DESCRIPTIONS[role];
  const iconSrc = `${ASSET_BASE}agent-icons/${role}.svg`;

  return (
    <article
      className="flex flex-col gap-2 rounded-lg border border-theme-border bg-theme-surface-muted p-4"
      role="listitem"
    >
      <div className="flex items-start gap-3">
        {iconError ? (
          <div
            className="w-12 h-12 shrink-0 rounded-lg bg-theme-border-subtle flex items-center justify-center text-theme-muted text-xs"
            aria-hidden="true"
          >
            ?
          </div>
        ) : (
          <img
            src={iconSrc}
            alt=""
            className="w-12 h-12 shrink-0 rounded-lg object-contain"
            loading="lazy"
            onError={() => setIconError(true)}
          />
        )}
        <div className="min-w-0 flex-1 flex flex-col items-start">
          <h3 className="font-medium text-theme-text m-0">{label}</h3>
          <div className="flex flex-wrap gap-1 mt-1">
            {phases.map((phase) => (
              <span
                key={phase}
                className="inline-flex items-center pl-0 pr-2 py-0.5 rounded text-xs font-medium bg-theme-border-subtle text-theme-muted"
              >
                {phase}
              </span>
            ))}
          </div>
        </div>
      </div>
      <p className="text-sm text-theme-muted leading-relaxed">{description}</p>
    </article>
  );
}
