# Epic-Blocked Model: Replace Plan Approval Gate

## Overview

Remove the "Plan Approval Gate" ticket concept entirely. Instead, epics themselves can be in a blocked state. When an epic is blocked, all tasks within that epic are blocked from appearing in `ready()` and show as "Planning" in the UI. When the user clicks "Execute!", the epic is unblocked and its tasks become eligible for execution based on their own dependencies.

This simplifies the model: no separate gate task, no `blocks` dependencies from implementation tasks to a gate. The epic's status directly controls whether its child tasks can be picked by the orchestrator.

## Acceptance Criteria

- [ ] No gate tasks are created when creating a new Plan or during Re-execute
- [ ] Epics for Plans start with `status: "blocked"`; clicking "Execute!" sets epic `status: "open"`
- [ ] Tasks in a blocked epic do not appear in `ready()` and show kanban column "planning"
- [ ] Plan status (planning/building/complete) is derived from epic status and task completion, not gate task state
- [ ] Re-execute: adding delta tasks sets epic back to `blocked`; second "Execute!" unblocks
- [ ] Deploy fix epics: epic created with `status: "open"` (no gate, auto-approved)
- [ ] Migration: existing plans with gate tasks are migrated (epic status set from gate state, gate task and its dependencies removed)
- [ ] All existing tests pass; new tests cover epic-blocked behavior

## Technical Approach

1. **Epic status semantics**
   - `blocked` = plan not yet approved; all child tasks blocked
   - `open` = plan approved; child tasks eligible per their own deps
   - `closed` = epic complete (all children done)

2. **Plan creation**
   - Create epic with `status: "blocked"`
   - Do NOT create gate task
   - Create implementation tasks with `parentId: epicId` only (no `blocks` dep on gate)
   - Plans table: make `gate_task_id` nullable; store empty string or null for new plans

3. **shipPlan (Execute!)**
   - Instead of closing gate task: `taskStore.update(projectId, epicId, { status: "open" })`
   - Remove gate-close logic, re-execute gate logic
   - Keep: task generation, PRD sync, shippedAt, shipped_content

4. **Re-execute**
   - Set epic `status: "blocked"` before creating delta tasks
   - Create delta tasks with `parentId: epicId` only (no gate)
   - User clicks Execute! → shipPlan sets epic to `open`

5. **ready() / computeReadyForSingleTask**
   - Add check: if task has epicId, fetch epic; if epic.status === "blocked", task is not ready
   - Pass epic status via idToIssue (epic is a task in listAll)

6. **computeKanbanColumn**
   - Replace gate-dep check with: if epic (from epicId) has status "blocked", return "planning"
   - Remove `.0` and "Plan approval gate" special cases

7. **Plan status derivation**
   - `planning`: epic.status === "blocked" OR (reExecuteBlocked flag if we keep that for delta)
   - `building`: epic open, shippedAt set, not all tasks done
   - `complete`: shippedAt set, all tasks done

8. **Deploy fix epic**
   - Create epic with `status: "open"` (fix epics are auto-approved)
   - No gate task, no blocks deps

## Dependencies

- TaskStoreService supports `status: "blocked"` for tasks (already supported; tasks table uses TEXT status)
- No external dependencies

## Data Model Changes

| Entity            | Change                                                                                                                                     |
| ----------------- | ------------------------------------------------------------------------------------------------------------------------------------------ |
| PlanMetadata      | Remove `gateTaskId`, `reExecuteGateTaskId`; add optional `epicBlocked?: boolean` for backward compat during migration, or derive from epic |
| plans table       | Make `gate_task_id` nullable (migration); `re_execute_gate_task_id` nullable (already)                                                     |
| tasks             | Epic tasks may have `status: "blocked"` (already valid)                                                                                    |
| task_dependencies | Remove rows where depends_on_id was a gate task                                                                                            |

## API Specification

No new endpoints. Existing endpoints change behavior:

- `POST /projects/:id/plans/:planId/execute` — closes epic (sets status open) instead of closing gate
- `GET /projects/:id/tasks/ready` — excludes tasks whose epic is blocked
- `GET /projects/:id/tasks` — task.kanbanColumn "planning" when epic blocked

Response shapes: Plan metadata no longer includes `gateTaskId` / `reExecuteGateTaskId` (or they are deprecated/empty).

## UI/UX Requirements

- Epic cards and Plan phase: "Execute!" button unchanged; label logic uses epic blocked state instead of gate
- Task list: tasks in blocked epic show "Planning" badge (same as today)
- No gate task row in task list (already filtered in some views; ensure no references)
- Plan Tasks vs Execute button: "Execute" when epic blocked AND has ≥1 implementation task; "Plan Tasks" when epic blocked AND zero tasks

## Edge Cases and Error Handling

- **Migration**: Plans with gate_task_id: if gate is open, set epic blocked; if gate closed, set epic open; delete gate task and its dependency rows
- **Orphaned gate tasks**: Migration removes them; ensure no code path creates them
- **Epic without plan**: Epics created outside plan flow (e.g. fix epic) have status "open"; no special handling
- **Re-execute with no delta**: Don't change epic status; return plan as-is
- **Plan with no epic**: Should not occur; guard with epicId check

## Testing Strategy

- Unit: TaskService.computeReadyForSingleTask — task with blocked epic not ready
- Unit: TaskService.computeKanbanColumn — task in blocked epic → "planning"
- Unit: PlanService.createPlan — no gate created, epic status blocked
- Unit: PlanService.shipPlan — epic status set to open, no gate close
- Unit: PlanService.reshipPlan — epic set blocked, delta tasks created without gate
- Integration: plan-route.test — execute sets epic open, ready excludes blocked-epic tasks
- Integration: task-route.test — ready endpoint excludes tasks in blocked epic
- Migration: plan with gate_task_id → after migration, epic status correct, gate removed

## Estimated Complexity

**Medium** — Touches plan service, task service, task store, frontend (EpicCard, PlanPhase), deploy-fix-epic, orchestrator. Migration for existing data. Many test updates.

---

## Mockup: Plan Phase — Epic Card (Blocked vs Approved)

```
+------------------------------------------------------------------+
|  EPIC: User Authentication                          [Planning]   |
+------------------------------------------------------------------+
|  Plan: auth.md                                                    |
|                                                                  |
|  Tasks (blocked — epic not yet approved):                         |
|  +--------------------------------------------------------------+|
|  |  os-a3f8.1  Implement login form         Planning            ||
|  |  os-a3f8.2  Add session middleware       Planning            ||
|  |  os-a3f8.3  Wire up logout               Planning            ||
|  +--------------------------------------------------------------+|
|                                                                  |
|  [  Execute!  ]  ← Unblocks epic; tasks move to Backlog/Ready     |
+------------------------------------------------------------------+

After Execute!:
+------------------------------------------------------------------+
|  EPIC: User Authentication                          [Building]    |
+------------------------------------------------------------------+
|  Tasks (eligible per dependencies):                               |
|  +--------------------------------------------------------------+|
|  |  os-a3f8.1  Implement login form         Ready               ||
|  |  os-a3f8.2  Add session middleware       Backlog (depends)   ||
|  |  os-a3f8.3  Wire up logout               Backlog             ||
|  +--------------------------------------------------------------+|
+------------------------------------------------------------------+
```
