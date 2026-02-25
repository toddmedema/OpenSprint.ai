import { TEST_FRAMEWORKS, type AgentConfig, type UnknownScopeStrategy } from "@opensprint/shared";
import type { ProjectMetadataState } from "./ProjectMetadataStep";

export interface ConfirmStepProps {
  metadata: ProjectMetadataState;
  repoPath: string;
  lowComplexityAgent: AgentConfig;
  highComplexityAgent: AgentConfig;
  deploymentMode: string;
  customDeployCommand: string;
  customDeployWebhook: string;
  testFramework: string;
  maxConcurrentCoders: number;
  /** Shown in summary when maxConcurrentCoders > 1 */
  unknownScopeStrategy?: UnknownScopeStrategy;
  /** Shown in summary when Branches selected */
  gitWorkingMode?: "worktree" | "branches";
}

export function ConfirmStep({
  metadata,
  repoPath,
  lowComplexityAgent,
  highComplexityAgent,
  deploymentMode,
  customDeployCommand,
  customDeployWebhook,
  testFramework,
  maxConcurrentCoders,
  unknownScopeStrategy,
  gitWorkingMode,
}: ConfirmStepProps) {
  const providerDisplayName = (type: string) => {
    switch (type) {
      case "claude":
        return "Claude (API)";
      case "claude-cli":
        return "Claude (CLI)";
      case "cursor":
        return "Cursor";
      default:
        return type;
    }
  };

  const lowComplexityLabel =
    lowComplexityAgent.type === "custom"
      ? (lowComplexityAgent.cliCommand ?? "").trim()
        ? `Custom: ${(lowComplexityAgent.cliCommand ?? "").trim()}`
        : "Custom (not configured)"
      : `${providerDisplayName(lowComplexityAgent.type)}${lowComplexityAgent.model ? ` — ${lowComplexityAgent.model}` : ""}`;

  const highComplexityLabel =
    highComplexityAgent.type === "custom"
      ? (highComplexityAgent.cliCommand ?? "").trim()
        ? `Custom: ${(highComplexityAgent.cliCommand ?? "").trim()}`
        : "Custom (not configured)"
      : `${providerDisplayName(highComplexityAgent.type)}${highComplexityAgent.model ? ` — ${highComplexityAgent.model}` : ""}`;

  const deploymentLabel =
    deploymentMode === "custom"
      ? customDeployCommand.trim()
        ? `Custom: ${customDeployCommand.trim()}`
        : customDeployWebhook.trim()
          ? `Webhook: ${customDeployWebhook.trim()}`
          : "Custom (not configured)"
      : "Expo";

  const testLabel =
    testFramework === "none"
      ? "None"
      : (TEST_FRAMEWORKS.find((f) => f.id === testFramework)?.label ?? testFramework);

  return (
    <div className="space-y-4" data-testid="confirm-step">
      <h3 className="text-sm font-semibold text-theme-text">Review your project setup</h3>
      <dl className="space-y-3 text-sm">
        <div className="flex justify-between">
          <dt className="text-theme-muted">Name</dt>
          <dd className="font-medium">{metadata.name}</dd>
        </div>
        <div className="flex justify-between">
          <dt className="text-theme-muted">Repository</dt>
          <dd className="font-mono text-xs">{repoPath}</dd>
        </div>
        <div className="flex justify-between">
          <dt className="text-theme-muted">Low Complexity Agent</dt>
          <dd className="font-medium capitalize">{lowComplexityLabel}</dd>
        </div>
        <div className="flex justify-between">
          <dt className="text-theme-muted">High Complexity Agent</dt>
          <dd className="font-medium capitalize">{highComplexityLabel}</dd>
        </div>
        <div className="flex justify-between">
          <dt className="text-theme-muted">Deliver</dt>
          <dd className="font-medium">{deploymentLabel}</dd>
        </div>
        <div className="flex justify-between">
          <dt className="text-theme-muted">Test Framework</dt>
          <dd className="font-medium">{testLabel}</dd>
        </div>
        <div className="flex justify-between">
          <dt className="text-theme-muted">Concurrent Coders</dt>
          <dd className="font-medium">
            {maxConcurrentCoders === 1 ? "1 (sequential)" : maxConcurrentCoders}
          </dd>
        </div>
        {gitWorkingMode === "branches" && (
          <div className="flex justify-between">
            <dt className="text-theme-muted">Git working mode</dt>
            <dd className="font-medium">Branches</dd>
          </div>
        )}
        {maxConcurrentCoders > 1 && unknownScopeStrategy != null && (
          <div className="flex justify-between">
            <dt className="text-theme-muted">Unknown scope strategy</dt>
            <dd className="font-medium capitalize">{unknownScopeStrategy}</dd>
          </div>
        )}
      </dl>
      <p className="text-xs text-theme-muted pt-2 border-t border-theme-border">
        On create: the task store will be initialized (orchestrator manages persistence).
        <code className="font-mono">.opensprint/orchestrator-state.json</code> and{" "}
        <code className="font-mono">.opensprint/worktrees/</code> will be added to .gitignore.
      </p>
    </div>
  );
}
