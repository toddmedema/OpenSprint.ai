import { z } from "zod";

/** Express may surface duplicate query keys as string[]; coerce to a single string. */
function coerceOptionalQueryString(value: unknown): unknown {
  if (value === undefined || value === null) return undefined;
  if (typeof value === "string") return value;
  if (Array.isArray(value)) {
    const first = value[0];
    return typeof first === "string" ? first : undefined;
  }
  return undefined;
}

export const helpProjectIdQuerySchema = z.object({
  projectId: z.preprocess(coerceOptionalQueryString, z.string().optional()),
});

export const helpSessionIdParamsSchema = z.object({
  sessionId: z.string().min(1),
});

export const helpChatBodySchema = z.object({
  message: z.string().min(1, { message: "message is required" }),
  projectId: z.union([z.string(), z.null()]).optional(),
  messages: z
    .array(z.object({ role: z.enum(["user", "assistant"]), content: z.string() }))
    .optional(),
});
