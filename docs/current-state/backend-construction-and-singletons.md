# Backend Construction And Singletons

This document records the current backend construction policy so future refactors keep dependency wiring predictable.

## Composition Root

- `packages/backend/src/composition.ts` is the primary construction site for app services used by HTTP routes.
- `createAppServices()` builds the route-facing service graph and returns the dependencies consumed by `createApp()`.
- Route modules should accept injected collaborators instead of creating ad-hoc service instances inside the route file.

## Current Route Wiring

- `createApp()` receives an `AppServices` object and passes the relevant dependencies into route factories.
- The following route families now depend on injected collaborators from the composition root:
  - projects
  - PRD
  - chat
  - execute
  - deliver
  - agents
  - feedback
  - notifications

## Intentional Singletons

These process-wide services remain singletons on purpose because they hold runtime lifecycle or shared process state:

- `taskStore`
- `orchestratorService`
- `databaseRuntime`
- existing runtime registries such as tracked agent/process registries and websocket broadcast infrastructure

When code needs one of these lifecycle-bound services, reuse the existing singleton instead of constructing a parallel instance.

## Practical Guidance

- Do not add new `new SomeService()` calls inside route modules.
- Prefer narrow injected dependency objects first; introduce a formal interface only when multiple modules or tests already share the seam.
- If a service truly must stay process-wide, document why it is a singleton in or near the owning module.
- Large extractions such as orchestrator/task-store subdomain splits should happen after the dependency boundaries stay clean under `createAppServices()`.
