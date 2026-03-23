export function normalizeLocalOpenAIProviderBaseUrl(
  raw: string | null | undefined,
  defaultBaseUrl: string
): { ok: true; normalized: string } | { ok: false; error: string } {
  const trimmed = (raw ?? "").trim();
  const candidate = trimmed || defaultBaseUrl;

  if (!/^https?:\/\//i.test(candidate)) {
    return { ok: false, error: "baseUrl must use http or https" };
  }

  try {
    const url = new URL(candidate);
    if (url.protocol !== "http:" && url.protocol !== "https:") {
      return { ok: false, error: "baseUrl must use http or https" };
    }

    url.search = "";
    url.hash = "";

    const trimmedPath = url.pathname.replace(/\/+$/, "");
    const pathname = trimmedPath === "/" ? "" : trimmedPath;

    return {
      ok: true,
      normalized: `${url.origin}${pathname}`,
    };
  } catch {
    return { ok: false, error: "baseUrl is not a valid URL" };
  }
}

export function ensureOpenAICompatibleV1BaseUrl(baseUrl: string): string {
  const trimmed = baseUrl.replace(/\/+$/, "");
  return trimmed.endsWith("/v1") ? trimmed : `${trimmed}/v1`;
}

export function ensureOllamaNativeApiBaseUrl(baseUrl: string): string {
  const trimmed = baseUrl.replace(/\/+$/, "");
  return trimmed.endsWith("/v1") ? trimmed.slice(0, -3) : trimmed;
}

export function getCompletionReasoning(value: unknown): string {
  if (!value || typeof value !== "object") return "";
  if ("reasoning" in value && typeof value.reasoning === "string") {
    return value.reasoning;
  }
  return "";
}

export function isReasoningOnlyCompletion(options: {
  content: string | null | undefined;
  finishReason: string | null | undefined;
  reasoningSource?: unknown;
}): boolean {
  const content = options.content?.trim() ?? "";
  if (content.length > 0) return false;
  return (
    options.finishReason === "length" && getCompletionReasoning(options.reasoningSource).length > 0
  );
}
