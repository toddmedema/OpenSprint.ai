/**
 * Plan domain: internal modules and public exports.
 *
 * Sub-domains:
 * - plan-crud.service.ts: Plan CRUD (create, read, update, delete, archive, mark complete)
 * - plan-versioning.service.ts: Version management (ensure version, create on update, ship resolution)
 * - plan-task-sync.service.ts: Sync tasks from plan markdown to task store
 * - plan-decompose-generate.service.ts: Decompose, suggest, generate-from-description, plan tasks
 * - plan-ship.service.ts: Ship plan (version resolution, epic unblock, PRD sync, reship)
 * - plan-planning-run.service.ts: Planning runs and Sketch CTA status
 * - plan-complexity-evaluation.service.ts: Complexity evaluation via agent
 *
 * Internal modules (plan/*.ts):
 * - planner-normalize: Output normalization (camelCase/snake_case)
 * - plan-prompts: System prompts for agent flows
 * - plan-dependency-graph: Build dependency edges and list plans with graph
 * - plan-decompose-generate: Pure helpers (parseDecomposeResponse, buildPrdContextString, etc.)
 * - plan-codebase-context: File tree, key files, auto-review context
 * - plan-versioning: Low-level version ensure/create
 * - plan-auto-review: Auto-review plans against codebase
 * - plan-repo-guard: Detect unexpected planner writes to the repo
 * - plan-task-generation: Generate and create tasks from plan
 */

export { PlanService } from "../plan.service.js";
export { PlanCrudService } from "../plan-crud.service.js";
export { PlanDecomposeGenerateService } from "../plan-decompose-generate.service.js";
export { PlanShipService } from "../plan-ship.service.js";
export type {
  PlanVersioningStore,
  PlanVersioningRow,
  GetContentAndVersionForShipResult,
} from "../plan-versioning.service.js";
export type { PlanCrudStore, PlanCrudOptions } from "../plan-crud.service.js";
export type {
  PlanDecomposeGenerateDeps,
  PlanDecomposeGenerateOptionalDeps,
} from "../plan-decompose-generate.service.js";
