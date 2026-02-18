# Dark Mode Styling Audit — Component Checklist

All major UI surfaces audited and updated to use theme-aware design tokens. No hard-coded color literals remain in component styles.

## Theme System

- **index.css**: Added semantic theme tokens for light/dark/system:
  - Error: `--color-error-bg`, `--color-error-text`, `--color-error-border`, `--color-error-solid`
  - Success: `--color-success-bg`, `--color-success-text`, `--color-success-muted`, `--color-success-solid`
  - Warning: `--color-warning-bg`, `--color-warning-text`, `--color-warning-border`, `--color-warning-solid`
  - Info: `--color-info-bg`, `--color-info-text`, `--color-info-border`, `--color-info-solid`
  - Feedback categories: bug, feature, ux, scope (bg + text)
  - Status indicators: backlog, ready, in_progress, in_review, done, blocked
  - Notifications: error, warning, info, success
- **tailwind.config.js**: Mapped all tokens to `theme-*` utility classes
- **btn-danger**: Uses `bg-theme-error-solid` instead of hard-coded red

## Pages (Tabs)

| Surface | Status | Changes |
|---------|--------|---------|
| **Home** | ✅ | Uses theme tokens (no hard-coded colors found) |
| **Spec (Sketch)** | ✅ | Uses theme tokens throughout |
| **Plan** | ✅ | Error banner, task status dots, dependency graph |
| **Execute** | ✅ | Feedback category colors, resolved chip, session output, approval text, unblock button, warning banner |
| **Eval** | ✅ | Category colors, resolved chip, Resolve button, delete badge |
| **Deploy (Deliver)** | ✅ | Status badges (running/success/failed/rolled_back), error box, rollback button |

## Shared Components

| Component | Status | Changes |
|-----------|--------|---------|
| **Navbar** | ✅ | Uses theme tokens |
| **Sidebar** | ✅ | Uses theme tokens |
| **Modals** | | |
| - ProjectSettingsModal | ✅ | Error box, warning box, delete buttons |
| - AddPlanModal | ✅ | Error box |
| - HilApprovalModal | ✅ | Approve button (success styling) |
| **Toasts** | | |
| - NotificationBar | ✅ | Severity styles (error/warning/info/success) use theme tokens |
| - DeliverToast (ProjectView) | ✅ | started/succeeded/failed use theme tokens |
| **Cards** | | |
| - EpicCard | ✅ | Status badges (planning/building/complete), task dots |
| - BuildEpicCard | ✅ | Task status dots, Unblock button |
| - KanbanCard | ✅ | Test result colors (pass/fail) |
| **Badges** | | |
| - TaskStatusBadge | ✅ | All column colors, done/blocked icons |
| **Tables** | | |
| - EpicTaskTable | ✅ | Unblock button |
| **Other** | | |
| - FolderBrowser | ✅ | Error message, folder icon |
| - ConnectionIndicator | ✅ | Offline state |
| - ModelSelect | ✅ | Error text |
| - PrdChatPanel | ✅ | Unread count badge |
| - ActiveAgentsList | ✅ | Pulse indicator |
| **Project Setup Wizard** | | |
| - ProjectMetadataStep | ✅ | Name error |
| - TestingStep | ✅ | Success message |
| - AgentsStep | ✅ | Warning box |
| **ProjectSetup** | ✅ | Create error box |
| **ProjectView** | ✅ | Deliver toasts |
| **AgentDashboard** | ✅ | Stats (done/failed/queue), success rate bar, phase badges |

## Constants

| File | Status | Changes |
|------|--------|---------|
| **lib/constants.ts** | ✅ | PRD_SOURCE_COLORS uses theme tokens |

## Tests Updated

- `lib/constants.test.ts` — PRD source color assertions
- `TaskStatusBadge.test.tsx` — Column and icon class assertions
- `ExecutePhase.test.tsx` — Resolved chip classes
- `VerifyPhase.test.tsx` — Resolved chip classes (EvalPhase)
