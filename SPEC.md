# Product Specification

## Executive Summary

During **Execute**, users can **open the task worktree in VS Code or Cursor** for live file and diff inspection, and—when using **in-process API agent backends**—**chat with the running agent** between turns for mid-flight guidance. **CLI-based agent backends** do not support reliable mid-flight messaging; the product surfaces a clear disabled state and directs users to API mode. A **browser-only** fallback exposes the worktree path and copyable shell commands when the desktop app cannot launch an editor.

## Problem Statement

Building software with AI today is fragmented and unstructured. Developers use AI coding assistants for individual tasks, but there is no cohesive system that manages the full journey from idea to deployed product. This leads to several persistent problems:

- **Lack of architectural coherence:** AI-generated code often lacks a unified vision because each prompt is handled in isolation, without awareness of the broader system design.
- **No dependency tracking:** When building features in parallel, there is no mechanism to ensure that work on one feature accounts for dependencies on another.
- **Manual orchestration overhead:** Users spend significant time managing prompts, context windows, and task sequencing rather than focusing on product decisions.
- **No feedback loop:** There is no structured way to validate completed work and feed findings back into the development process.

Open Sprint solves these problems by providing an end-to-end platform that maintains context across the entire lifecycle and automates the orchestration of AI development agents.

## User Personas

### The Product-Minded Founder

A non-technical founder with a clear product vision who wants to build an MVP without hiring a development team. They understand what they want to build but need AI to handle the engineering. They value speed, clear communication about what is being built, and the ability to provide feedback without writing code.

### The Solo Developer

An experienced developer who wants to multiply their output. They can code but want to delegate routine implementation to AI while focusing on architecture and product decisions. They value transparency into what the AI is doing, the ability to intervene when needed, and high-quality code output.

### The Agency / Consultancy

A small team that builds software for clients. They need to move quickly from client requirements to working software, maintain multiple projects simultaneously, and provide clients with visibility into progress. They value the structured workflow for client communication and the ability to run multiple projects in parallel.

## Goals and Success Metrics

### Primary Goals

1. Reduce the time from idea to working prototype by 10x compared to traditional AI-assisted development workflows.
2. Enable non-engineers to ship production-quality software by handling technical complexity behind the scenes.
3. Maintain architectural coherence across an entire project by flowing design decisions through every phase.
4. Create a self-improving development flywheel where validation feedback automatically triggers corrective action.

### Success Metrics

| Metric                                | Target                                     | Measurement Method                 |
| ------------------------------------- | ------------------------------------------ | ---------------------------------- |
| Time from idea to working prototype   | < 1 day for standard web apps              | End-to-end session timing          |
| User intervention rate during Execute | < 10% of tasks require manual input        | Task completion telemetry          |
| Sketch-to-code fidelity               | > 90% alignment with PRD                   | Automated PRD compliance checks    |
| Feedback loop closure time            | < 30 min from bug report to fix deployed   | Evaluate-to-Execute cycle tracking |
| First-time user task completion       | > 80% complete a full Sketch-Execute cycle | Onboarding funnel analytics        |
| Test coverage                         | > 80% code coverage with passing E2E tests | Automated coverage reporting       |

**Coverage enforcement in CI:** The merge gate (`.github/workflows/merge-gate.yml`) runs `npm run test:coverage` for the shared, backend, and frontend workspaces. Vitest is configured with coverage thresholds: backend uses 80% for statements, lines, and functions and 70% for branches; frontend uses 80% for statements and lines, 70% for branches, and 73% for functions (raised toward 80% as coverage improves). The CI job fails if any workspace is below its threshold. Frontend E2E tests (`*.e2e.test.tsx`) are run as part of the frontend test suite in the same job; the test step is bounded by a 20-minute timeout so the gate does not hang. The SPEC target of >80% coverage with passing E2E tests is thus enforced in CI.

## Assumptions and Constraints

_No content yet_

## Feature List

Add under **Execute** phase:

- **Open in Editor:** In-progress task cards and the task detail sidebar expose an **Open in Editor** control when a worktree path is available; it opens the worktree (or repo root in **branches** mode with a **shared-checkout** warning) in the user's preferred editor (**VS Code**, **Cursor**, or **auto** from global settings). If the path is missing, the task is not in progress, or the editor CLI is unavailable, the control is disabled with tooltips or inline guidance; pure web clients get **copy path** / pasteable commands.
- **Live Chat with Execute agent:** For **Claude API, OpenAI, Google/Gemini, LM Studio, and Ollama** (shared `runAgenticLoop`), users send messages that are **queued and injected between agentic turns** as real user turns (replacing the default continuation). **Claude CLI, Cursor CLI, and Custom CLI** backends disable chat with an explicit **switch to API mode** message. The Execute sidebar combines **Output** (streaming logs) and **Chat** (Sketch/Plan-style `PrdChatPanel` pattern): optimistic send, **Waiting for response…** while the agent processes, persisted **per-attempt** history (survives refresh), bounded pending-message queue, and WebSocket delivery/receipt events.

## Technical Architecture

**Execute inspect and live chat**

- **Open in Editor:** Backend resolves **worktree path** from `BranchManager` and/or active assignment, validates on-disk existence, and returns path plus resolved **editor preference** (`vscode` | `cursor` | `auto`). Desktop/Electron uses `child_process` or **URI schemes** (`vscode://file/…`, `cursor://file/…`); browser-only clients use path + copy command fallback. Editor CLI availability is detected for UX messaging.
- **Agentic loop:** `runAgenticLoop` accepts an optional **async pending-messages channel**; after tool results and before the next `adapter.send`, the loop drains the channel and uses the concatenated user text as the next user message instead of **Continue.** Multiple queued messages are merged in order with delimiters; the channel is **bounded** to cap backlog.
- **`AgentChatService`:** Validates task/agent liveness and **API vs CLI** backend; **persists** turns to `.opensprint/active/<taskId>/chat-log.jsonl` (JSONL: `id`, ISO `timestamp`, `role`, `content`, `attempt`); pushes to the active loop's channel; exposes **history** and **`supportsChat`**. `ActiveAgentsService` holds the channel reference for the running API agent only.
- **Real-time:** WebSocket types **`agent.chat.send`** (client→server), **`agent.chat.received`**, **`agent.chat.response`**, **`agent.chat.unsupported`** (defensive for CLI). Execute **status/active task** payloads should reliably include **`worktreePath`** where applicable.
- **Frontend:** **Open in Editor** on `TaskDetailHeader` and kanban task cards (`BuildEpicCard`); Execute sidebar **Output | Chat** tabs reusing **`PrdChatPanel`** patterns (draft persistence, Enter / Shift+Enter, delivery indicator).

## Data Model

**Global settings:** Extend `GlobalSettings` with optional **`preferredEditor`**: `'vscode' | 'cursor' | 'auto'` (default/auto behavior as implemented).

**Chat log (file-backed, no core DB migration):** `.opensprint/active/<taskId>/chat-log.jsonl` — one JSON object per line with `id`, `timestamp`, `role` (`user` | `assistant`), `content`, `attempt` (execution attempt number). Undelivered user messages may be recorded when the agent completes before delivery (per product rules).

**WebSocket / shared types:** Extend `WebSocketEventType` (or equivalent) with **`agent.chat.send`**, **`agent.chat.received`**, **`agent.chat.response`**, **`agent.chat.unsupported`**.

**Execute telemetry:** Active task / execute status events include **`worktreePath`** consistently when a worktree exists, supporting editor open and diagnostics.

## API Contracts

The statement that **no new REST endpoints are required for quality-gate diagnostics** remains true for merge/gate failures; **additional REST and WebSocket contracts** apply to Execute inspect/chat:

- **`GET` / `PUT /api/global-settings`:** Include **`preferredEditor`** (`vscode` | `cursor` | `auto`); validate on write.
- **`POST /api/projects/:projectId/tasks/:taskId/open-editor`:** Returns `{ worktreePath, editor, opened }` when the task is actively executing and the path exists; **404** if task/worktree missing, **409** if not in an executable in-progress state. *(Exact path prefix must match the product's `/api` routing convention.)*
- **`GET .../tasks/:taskId/chat-history`:** Query `attempt` (optional); response `{ messages[], attempt, chatSupported }`.
- **`GET .../tasks/:taskId/chat-support`:** Response `{ supported, backend, reason | null }` for gating the Chat tab.
- **WebSocket:** Client **`agent.chat.send`** `{ taskId, message }`; server **`agent.chat.received`**, **`agent.chat.response`**, **`agent.chat.unsupported`** with task and message identifiers as specified in the implementation plan. Consumers **ignore unknown fields** for forward compatibility.

## Non-Functional Requirements

| Category | Requirement |
| -------- | ----------- |
| Usability | Execute **Output** and **Chat** share familiar Sketch/Plan chat patterns (bubbles, keyboard shortcuts, draft persistence, clear disabled states for non-running tasks and CLI backends). |
| Reliability | User chat messages are **queued at turn boundaries**; **bounded** pending queue prevents unbounded memory; if the agent finishes before delivery, persisted history reflects **undelivered** user messages per product rules. |
| Compatibility | **Open in Editor** degrades gracefully: missing CLI → install guidance + **copy path**; **branches** mode warns about **shared checkout**; multiple browser tabs deduplicate by **message id**. |
| Security / privacy | Chat content is stored **locally** under `.opensprint/active/<taskId>/` (JSONL) alongside assignment artifacts—treat as sensitive project data in backups and retention policies. |

## Open Questions

All previously identified questions have been resolved and documented in the Resolved Decisions section of the full PRD. No open questions at this time.

## Competitive Landscape

### Overview

Open Sprint sits in the “AI-assisted product development” space. Alternatives range from no-code chat-to-app builders to IDE-centric coding agents. The comparison below focuses on full-lifecycle and “idea to working product” tools rather than single-step UI generators (e.g. v0, Locofy).

### Lovable (lovable.dev)

- **Positioning:** No-code app builder; “build apps and websites by chatting with AI.”
- **Strengths:** Fast iteration, low friction for non-engineers, chat-first UX.
- **Limitations:** Centered on UI/app generation from conversation; no explicit PRD/spec phase, no dependency-aware task graph or Evaluate → Execute feedback loop. Tied to their hosted experience.
- **Open Sprint differentiator:** Full SPEED lifecycle with a written spec (SPEC.md), dependency-aware planning, human-in-the-loop, and optional use of your repo + local or custom agents (including offline).

### Bolt (bolt.new)

- **Positioning:** “Vibe coding” and professional coding agents; chat-to-build with integrated frontier models, testing/refactoring, and Bolt Cloud (hosting, DB, auth, SEO).
- **Strengths:** Single UI for multiple AI backends, built-in testing and iteration, cloud backend and scaling story.
- **Limitations:** Emphasis on “build in one place” with their stack; less focus on a formal spec phase or on flowing a single PRD through plan → execute → evaluate. Primarily cloud-hosted.
- **Open Sprint differentiator:** SPEC.md as the single source of truth, explicit Sketch → Plan → Execute → Evaluate → Deliver workflow, worktree/branch-based workflow with merger handling, and ability to run fully offline with LM Studio or other local agents.

### Gas Town (gastown.io)

- **Positioning:** AI-powered product or development workflow tool in the idea-to-ship space.
- **Open Sprint differentiator:** Open Sprint emphasizes a phased lifecycle (Sketch/Plan/Execute/Evaluate/Deliver), a file-based spec at repo root, and orchestration that respects task dependencies and feedback loops rather than ad-hoc prompting.

### Other Adjacent Tools

- **Cursor / IDE coding assistants:** Strong for in-editor coding; they do not provide a shared PRD, multi-phase workflow, or structured Evaluate → Execute loop.
- **Replit Agent, etc.:** Often centered on in-environment generation and deployment; typically no first-class spec or dependency-aware task orchestration.

### Summary Table

| Dimension          | Open Sprint                                    | Lovable / Bolt-style builders      |
| ------------------ | ---------------------------------------------- | ---------------------------------- |
| Spec / PRD         | SPEC.md at repo root; first-class phase        | Implicit or lightweight            |
| Lifecycle          | Sketch → Plan → Execute → Evaluate → Deliver   | Chat → build (and optionally ship) |
| Task orchestration | Dependency-aware, priority-ordered tasks       | Largely prompt/session-driven      |
| Feedback loop      | Evaluate maps to tasks; fixes re-enter Execute | Manual or tool-specific            |
| Agent choice       | Claude, Cursor, OpenAI, LM Studio, custom CLI  | Typically vendor’s models/hosted   |
| Offline            | Supported (e.g. LM Studio)                     | Generally requires cloud           |
| Repo / Git         | Works with existing repos; worktree + merger   | Often tied to platform repos       |
