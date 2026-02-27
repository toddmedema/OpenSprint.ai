import { useState, useRef, useLayoutEffect, useCallback, useEffect } from "react";
import type { AgentRole } from "@opensprint/shared";
import {
  AGENT_ROLE_CANONICAL_ORDER,
  AGENT_ROLE_LABELS,
  AGENT_ROLE_PHASES,
  AGENT_ROLE_DESCRIPTIONS,
} from "@opensprint/shared";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { ReactQueryDevtoolsPanel } from "@tanstack/react-query-devtools";
import { CloseButton } from "./CloseButton";
import { ChatInput } from "./ChatInput";
import { api } from "../api/client";

/** Base URL for public assets (Vite BASE_URL) */
const ASSET_BASE = (import.meta.env.BASE_URL ?? "/").replace(/\/*$/, "/");

export interface HelpModalProps {
  onClose: () => void;
  /** Optional project context (per-project view vs homepage) */
  project?: { id: string; name: string } | null;
}

type TabId = "ask" | "meet" | "debug";

/**
 * Help modal with three tabs: Ask a Question (default), Meet your Team, and Debug.
 * Available from ? on homepage and per-project view.
 * TanStack React Query DevTools render inside the Debug tab (not in bottom-right when modal closed).
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
        data-testid="help-modal-content"
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
            <button
              type="button"
              role="tab"
              aria-selected={activeTab === "debug"}
              aria-controls="help-tabpanel-debug"
              id="help-tab-debug"
              onClick={() => setActiveTab("debug")}
              className={`px-4 py-2 text-sm font-medium rounded-t-md transition-colors ${
                activeTab === "debug"
                  ? "bg-theme-surface text-theme-text border border-theme-border border-b-theme-surface"
                  : "text-theme-muted hover:text-theme-text hover:bg-theme-border-subtle"
              }`}
            >
              Debug
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
            <AskQuestionContent project={project} isActive={activeTab === "ask"} />
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
          <div
            id="help-tabpanel-debug"
            role="tabpanel"
            aria-labelledby="help-tab-debug"
            hidden={activeTab !== "debug"}
            className="px-6 py-4 min-h-[300px]"
          >
            <DebugContent isActive={activeTab === "debug"} />
          </div>
        </div>
      </div>
    </div>
  );
}

interface HelpChatMessage {
  role: "user" | "assistant";
  content: string;
}

function HelpChatBubble({ msg }: { msg: HelpChatMessage }) {
  const isUser = msg.role === "user";
  return (
    <div className={`flex ${isUser ? "justify-end" : "justify-start"}`}>
      <div
        className={`max-w-[85%] rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed ${
          isUser ? "bg-brand-600 text-white" : "bg-theme-border-subtle text-theme-text"
        }`}
      >
        {isUser ? (
          <p className="whitespace-pre-wrap">{msg.content}</p>
        ) : (
          <div className="prose-chat-bubble prose-sm max-w-none">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>{msg.content}</ReactMarkdown>
          </div>
        )}
      </div>
    </div>
  );
}

function AskQuestionContent({
  project,
  isActive,
}: {
  project?: { id: string; name: string } | null;
  isActive: boolean;
}) {
  const [messages, setMessages] = useState<HelpChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [loadingHistory, setLoadingHistory] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const scrollEndRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const chatInputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoadingHistory(true);
      try {
        const { messages: loaded } = await api.help.history(project?.id ?? null);
        if (!cancelled && Array.isArray(loaded)) {
          setMessages(loaded);
        }
      } catch {
        if (!cancelled) setMessages([]);
      } finally {
        if (!cancelled) setLoadingHistory(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [project?.id]);

  const scrollToBottom = useCallback(() => {
    const el = scrollContainerRef.current ?? scrollEndRef.current?.parentElement;
    if (el) el.scrollTop = el.scrollHeight - el.clientHeight;
  }, []);

  useLayoutEffect(() => {
    scrollToBottom();
    const id = requestAnimationFrame(scrollToBottom);
    return () => cancelAnimationFrame(id);
  }, [messages, scrollToBottom]);

  useLayoutEffect(() => {
    if (isActive) {
      chatInputRef.current?.focus();
    }
  }, [isActive]);

  const handleSend = async () => {
    const text = input.trim();
    if (!text || sending) return;
    setInput("");
    setError(null);
    const userMsg: HelpChatMessage = { role: "user", content: text };
    setMessages((prev) => [...prev, userMsg]);
    setSending(true);
    try {
      const priorMessages = messages.map((m) => ({ role: m.role, content: m.content }));
      const res = await api.help.chat({
        message: text,
        projectId: project?.id ?? null,
        messages: priorMessages,
      });
      setMessages((prev) => [...prev, { role: "assistant", content: res.message }]);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Unknown error";
      setError(msg);
      setMessages((prev) => [...prev, { role: "assistant", content: `Error: ${msg}` }]);
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="flex flex-col gap-2 min-h-0">
      <p className="text-theme-muted text-sm shrink-0">
        {project
          ? `Ask about ${project.name} — PRD, plans, tasks, or running agents. AI answers in ask-only mode without changing project state.`
          : "Ask about your projects, tasks, or running agents. AI answers in ask-only mode without changing project state."}
      </p>
      <div
        ref={scrollContainerRef}
        className="flex-1 overflow-y-auto min-h-[200px] max-h-[400px] space-y-3 py-2"
        data-testid="help-chat-messages"
      >
        {loadingHistory && (
          <div className="text-center py-6 text-theme-muted text-sm" data-testid="help-chat-loading-history">
            Loading chat history…
          </div>
        )}
        {!loadingHistory && messages.length === 0 && (
          <div className="text-center py-6 text-theme-muted text-sm">
            <p>Type a question below and press Enter.</p>
          </div>
        )}
        {messages.map((msg, i) => (
          <HelpChatBubble key={i} msg={msg} />
        ))}
        {sending && (
          <div
            className="flex justify-start"
            role="status"
            aria-label="Agent is thinking"
            data-testid="help-chat-loading"
          >
            <div className="bg-theme-border-subtle rounded-2xl px-3.5 py-2.5 text-sm text-theme-muted">
              <span className="flex gap-1">
                <span className="w-1.5 h-1.5 bg-theme-muted rounded-full animate-bounce [animation-delay:0ms]" />
                <span className="w-1.5 h-1.5 bg-theme-muted rounded-full animate-bounce [animation-delay:150ms]" />
                <span className="w-1.5 h-1.5 bg-theme-muted rounded-full animate-bounce [animation-delay:300ms]" />
              </span>
            </div>
          </div>
        )}
        <div ref={scrollEndRef} />
      </div>
      {error && (
        <p className="text-theme-error text-sm shrink-0" role="alert">
          {error}
        </p>
      )}
      <div className="shrink-0 border-t border-theme-border pt-3">
        <ChatInput
          value={input}
          onChange={setInput}
          onSend={handleSend}
          sendDisabled={sending}
          placeholder="Ask a question..."
          aria-label="Help chat message"
          inputRef={chatInputRef}
        />
      </div>
    </div>
  );
}

/** TanStack logo icon (React Query / TanStack Query branding) */
function TanStackIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 256 256"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden
    >
      <path
        d="M128 256c70.694 0 128-57.306 128-128S198.694 0 128 0 0 57.306 0 128s57.306 128 128 128z"
        fill="#FF4154"
      />
      <path
        d="M128 41.231c47.914 0 86.769 38.855 86.769 86.769S175.914 214.769 128 214.769 41.231 175.914 41.231 128 80.086 41.231 128 41.231z"
        fill="#fff"
      />
      <path
        d="M128 72.308c30.794 0 55.692 24.898 55.692 55.692s-24.898 55.692-55.692 55.692S72.308 158.794 72.308 128 97.206 72.308 128 72.308z"
        fill="#FF4154"
      />
    </svg>
  );
}

function DebugContent({ isActive }: { isActive: boolean }) {
  if (!isActive) return null;
  return (
    <div className="flex flex-col gap-3 min-h-[300px]" data-testid="help-debug-content">
      <div className="flex items-center gap-2 shrink-0">
        <TanStackIcon className="w-10 h-10 shrink-0" />
        <div>
          <p className="text-theme-text text-sm font-medium">React Query DevTools</p>
          <p className="text-theme-muted text-xs">Inspect cache and queries.</p>
        </div>
      </div>
      <div className="flex-1 min-h-[280px] rounded-lg border border-theme-border overflow-hidden bg-theme-surface-muted">
        <ReactQueryDevtoolsPanel style={{ height: "100%", minHeight: 280 }} />
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
