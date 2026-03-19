# PRD and Plan Creation: Scale, Speed, and Cost Discovery Prompts

## Overview

When users create PRDs and Plans, the AI agent that generates or reviews this content will be prompted to check whether the user has provided information about **scale**, **speed**, and **cost**. If not, the agent will ask the user if there are any requirements in these areas that the agent should be aware of while planning. Discovery happens through the existing conversation/editor flow—no separate discovery step or stored metadata.

## Acceptance Criteria

- The agent(s) that generate or review PRDs and Plans receive prompt instructions to consider scale, speed, and cost.
- If the user's input does not include information about scale (e.g., expected users, data volume, growth), speed (latency/throughput expectations), or cost (budget or infra constraints), the agent is instructed to ask the user whether there are any such requirements the agent should be aware of while planning.
- No new UI step, form, or stored discovery metadata is required; the agent elicits this through its responses or questions in the existing PRD/Plan flow.
- When the user does provide scale, speed, or cost information (in freeform), the agent uses it when generating or updating the Technical Approach and related sections.

## Technical Approach

- **Prompt-only:** Update the prompt templates (and any harmonizer or service that produces PRD/Plan content) so that the generating/reviewing agent:
  1. Checks whether the user has already provided scale, speed, or cost information.
  2. If not, asks the user (in the agent's reply or as a clear follow-up) whether they have any requirements in these areas that the agent should consider.
  3. When the user provides such information in any form, uses it to inform the Technical Approach, architecture choices, and non-functional requirements.
- No new discovery step in the UI, no new data model fields for product constraints, no new API for discovery answers.
- Optional: add a short note in `opensprint-help-context.md` or agent bootstrap so Execute-phase agents are aware that scale/speed/cost may have been discussed in the PRD/Plan; if that context is already present in the spec text, no change may be needed.

## Dependencies

- Existing Sketch/Plan (and any PRD-generation) prompt pipelines and the agent that responds to the user in that flow.
- No new UI, storage, or external services.

## Data Model Changes

- None. Scale, speed, and cost remain in the PRD/spec as natural language (user- or agent-written) rather than structured fields.

## API Specification

- No new endpoints or request/response changes. Plan generation continues to use existing project/spec content; any scale/speed/cost information is part of that content when the user or agent includes it.

## UI/UX Requirements

- No new discovery screen or form. The existing PRD/Plan creation flow is unchanged from a screen perspective; the only change is the agent's behavior (asking when information is missing).
- The existing chat or editor UI must support displaying the agent's questions and the user's answers (assumed in the current flow).

## Mockups (ASCII wireframes)

Not applicable for a prompt-only change. The existing PRD/Plan flow is unchanged; the agent may add a question such as:

```
Agent: "I don't see any constraints yet on scale, speed, or cost. Do you have any
requirements in these areas I should be aware of while planning (e.g., expected
users, latency targets, or budget/infra limits)? If not, we can proceed as-is."
```

## Edge Cases and Error Handling

- **User ignores the agent's question:** The agent proceeds with no constraints; the flow does not block.
- **User provides vague or partial info:** The agent uses what is provided and may ask a brief follow-up if helpful.
- **Malformed or very long input:** Handled by existing content/sanitization for the PRD/Plan flow; no new sanitization required for this feature.

## Testing Strategy

- **Prompt/unit:** Ensure the prompt template includes the new instructions; test that prompt construction injects the "if no scale/speed/cost, ask the user" guidance.
- **Integration (optional):** Run Plan generation with user input that omits scale/speed/cost and verify (e.g., via prompt snapshot or response assertion) that the agent's output includes a question or prompt about these topics; with input that includes them, verify the Plan references them.
- **E2E (optional):** User starts PRD/Plan flow, provides no scale/speed/cost, sees the agent ask; user responds and proceeds. Regression: existing PRD/Plan flows unchanged.

## Estimated Complexity

**Low.** Changes are confined to prompt design and any small prompt-construction logic (e.g., injecting a conditional instruction when scale/speed/cost are absent from user input). No UI, no schema, no new API.
