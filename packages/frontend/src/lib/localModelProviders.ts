import type { AgentType } from "@opensprint/shared";

export const DEFAULT_LMSTUDIO_BASE_URL = "http://localhost:1234";
export const DEFAULT_OLLAMA_BASE_URL = "http://localhost:11434";

export function isLocalModelProvider(type: AgentType): type is "lmstudio" | "ollama" {
  return type === "lmstudio" || type === "ollama";
}

export function getDefaultLocalProviderBaseUrl(type: AgentType): string | undefined {
  if (type === "lmstudio") return DEFAULT_LMSTUDIO_BASE_URL;
  if (type === "ollama") return DEFAULT_OLLAMA_BASE_URL;
  return undefined;
}

export function hasConfiguredLocalModel(agent: {
  type: AgentType;
  model?: string | null;
}): boolean {
  if (!isLocalModelProvider(agent.type)) return true;
  return Boolean(agent.model?.trim());
}
