import type { ActiveTaskConfig } from "@opensprint/shared";

/** Build human-readable autonomy description for agent prompts (agent question protocol). */
export function buildAutonomyDescription(
  aiAutonomyLevel?: "confirm_all" | "major_only" | "full",
  hilConfig?: ActiveTaskConfig["hilConfig"]
): string {
  if (aiAutonomyLevel) {
    switch (aiAutonomyLevel) {
      case "confirm_all":
        return `**Confirm all scope changes.** Emit \`open_questions\` for any scope, architecture, or dependency change before proceeding. Wait for user answers via the Human Notification System.`;
      case "major_only":
        return `**Major scope changes only.** Emit \`open_questions\` for scope or architecture changes; proceed autonomously for dependency modifications. Wait for user answers before proceeding on major changes.`;
      case "full":
        return `**Full autonomy.** Proceed without confirmation. Only emit \`open_questions\` when genuinely blocked (e.g. ambiguous task spec); do not ask for routine scope changes.`;
      default:
        break;
    }
  }
  if (hilConfig) {
    const modes = Object.values(hilConfig);
    return modes.every((m) => m === "automated")
      ? `**Full autonomy.** Proceed without confirmation. Only emit \`open_questions\` when genuinely blocked.`
      : modes.some((m) => m === "requires_approval")
        ? `**Confirm major changes before proceeding.** Emit \`open_questions\` for scope/architecture changes; wait for user answers.`
        : `**Notify user but proceed.** Emit \`open_questions\` when appropriate; you may proceed after notifying.`;
  }
  return "";
}
