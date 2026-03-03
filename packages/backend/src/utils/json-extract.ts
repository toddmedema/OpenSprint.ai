function containsKeyDeep(value: unknown, requiredKey: string): boolean {
  if (!value || typeof value !== "object") return false;
  if (Array.isArray(value)) {
    return value.some((item) => containsKeyDeep(item, requiredKey));
  }

  const record = value as Record<string, unknown>;
  if (Object.prototype.hasOwnProperty.call(record, requiredKey)) {
    return true;
  }

  return Object.values(record).some((item) => containsKeyDeep(item, requiredKey));
}

/**
 * Extract and parse a JSON object from AI agent response content.
 * Scans left-to-right for balanced JSON object candidates and parses each
 * candidate in encounter order, ignoring braces that appear inside strings.
 */
export function extractJsonFromAgentResponse<T>(content: string, requiredKey?: string): T | null {
  if (!content) return null;

  let start = -1;
  let depth = 0;
  let inString = false;
  let escaping = false;

  for (let i = 0; i < content.length; i++) {
    const ch = content[i];

    if (start >= 0) {
      if (escaping) {
        escaping = false;
        continue;
      }

      if (ch === "\\") {
        if (inString) escaping = true;
        continue;
      }

      if (ch === '"') {
        inString = !inString;
        continue;
      }

      if (inString) continue;

      if (ch === "{") {
        depth += 1;
        continue;
      }

      if (ch === "}") {
        depth -= 1;
        if (depth === 0) {
          const candidate = content.slice(start, i + 1);
          try {
            const parsed = JSON.parse(candidate) as T;
            if (!requiredKey || containsKeyDeep(parsed, requiredKey)) {
              return parsed;
            }
          } catch {
            // Keep scanning; a later candidate may be valid.
          }
          start = -1;
          inString = false;
          escaping = false;
        }
        continue;
      }

      continue;
    }

    if (ch === "{") {
      start = i;
      depth = 1;
      inString = false;
      escaping = false;
    }
  }

  return null;
}
