/**
 * Integration tests for Ollama agent and API checks.
 * - When OLLAMA_URL and OLLAMA_MODEL are set: runs live /v1/models verification plus
 *   planning invoke checks against a running Ollama server.
 * - When Ollama is unavailable: asserts user-facing messaging for unreachable servers.
 */
import { describe, it, expect, beforeEach, vi } from "vitest";
import fs from "fs/promises";
import path from "path";
import os from "os";
import { AgentClient } from "../services/agent-client.js";
import type { AgentConfig } from "@opensprint/shared";

vi.mock("drizzle-orm", () => ({
  and: (...args: unknown[]) => args,
  eq: (a: unknown, b: unknown) => [a, b],
}));
vi.mock("../db/drizzle-schema-pg.js", () => ({ plansTable: {} }));

const OLLAMA_URL = process.env.OLLAMA_URL;
const OLLAMA_MODEL = process.env.OLLAMA_MODEL;

/** Unreachable URL for "unavailable" tests (no server on this port). */
const UNREACHABLE_BASE_URL = "http://127.0.0.1:19998";

function ollamaAvailable(): boolean {
  return Boolean(
    OLLAMA_URL && OLLAMA_URL.trim().length > 0 && OLLAMA_MODEL && OLLAMA_MODEL.trim().length > 0
  );
}

describe("Ollama integration", () => {
  let client: AgentClient;

  beforeEach(() => {
    client = new AgentClient();
  });

  describe("when Ollama is available", () => {
    describe.skipIf(!ollamaAvailable())(
      "live /v1 checks and planning invoke (requires OLLAMA_URL, OLLAMA_MODEL, and a running Ollama server)",
      () => {
        const baseUrl = (OLLAMA_URL ?? "").replace(/\/+$/, "");
        const model = (OLLAMA_MODEL ?? "").trim();
        const config: AgentConfig = {
          type: "ollama",
          model,
          cliCommand: null,
          baseUrl: baseUrl || undefined,
        };

        it("/v1/models lists installed models", async () => {
          const response = await fetch(`${baseUrl}/v1/models`);
          expect(response.ok).toBe(true);
          const body = (await response.json()) as { data?: Array<{ id?: string }> };
          const ids = (body.data ?? []).map((entry) => entry.id).filter(Boolean);
          expect(ids.length).toBeGreaterThan(0);
          expect(ids).toContain(model);
        }, 30_000);

        it("planning invoke without streaming returns content", async () => {
          const result = await client.invoke({
            config,
            prompt: "Reply with exactly: ollama-nonstream-ok",
            systemPrompt: "You are a helpful assistant. Reply briefly.",
          });

          expect(typeof result.content).toBe("string");
          expect(result.content.length).toBeGreaterThan(0);
        }, 60_000);

        it("planning invoke with streaming completes", async () => {
          const chunks: string[] = [];
          const result = await client.invoke({
            config,
            prompt: "Reply with exactly: ollama-stream-ok",
            systemPrompt: "You are a helpful assistant. Reply briefly.",
            onChunk: (chunk) => chunks.push(chunk),
          });

          expect(typeof result.content).toBe("string");
          expect(result.content.length).toBeGreaterThan(0);
          expect(chunks.join("")).toBe(result.content);
        }, 60_000);

        it("/v1/chat/completions stream can emit reasoning before content", async () => {
          const response = await fetch(`${baseUrl}/v1/chat/completions`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: "Bearer ollama",
            },
            body: JSON.stringify({
              model,
              messages: [{ role: "user", content: "Reply with exactly: ollama-reasoning-ok" }],
              max_tokens: 512,
              stream: true,
            }),
          });

          expect(response.ok).toBe(true);
          const reader = response.body?.getReader();
          expect(reader).toBeTruthy();

          const decoder = new TextDecoder();
          let raw = "";
          for (;;) {
            const next = await reader!.read();
            if (next.done) break;
            raw += decoder.decode(next.value, { stream: true });
          }
          raw += decoder.decode();

          expect(raw).toContain('"chat.completion.chunk"');
          expect(raw).toContain('"reasoning"');
          const firstContentIndex = raw.search(/"content":"[^"]+"/);
          expect(firstContentIndex).toBeGreaterThanOrEqual(0);
          expect(raw.indexOf('"reasoning"')).toBeLessThan(firstContentIndex);
        }, 60_000);
      }
    );
  });

  describe("when Ollama is unavailable", () => {
    const unavailableConfig: AgentConfig = {
      type: "ollama",
      model: "missing-model",
      cliCommand: null,
      baseUrl: UNREACHABLE_BASE_URL,
    };

    it("invoke throws with a user-facing message mentioning Ollama", async () => {
      await expect(
        client.invoke({
          config: unavailableConfig,
          prompt: "Hello",
        })
      ).rejects.toThrow(/Ollama/i);
    });

    it("spawnWithTaskFile calls onExit(1) and emits an Ollama startup hint", async () => {
      const tmpDir = path.join(os.tmpdir(), `ollama-unavailable-${Date.now()}`);
      const taskDir = path.join(tmpDir, ".opensprint", "active", "os-bad.1");
      await fs.mkdir(taskDir, { recursive: true });
      const taskFilePath = path.join(taskDir, "prompt.md");
      await fs.writeFile(taskFilePath, "# Task\n\nHello", "utf-8");

      const outputChunks: string[] = [];
      let exitCode: number | null = null;
      const onOutput = (chunk: string) => outputChunks.push(chunk);
      const onExit = (code: number | null) => {
        exitCode = code;
      };

      client.spawnWithTaskFile(unavailableConfig, taskFilePath, tmpDir, onOutput, onExit, "coder");

      await new Promise<void>((resolve, reject) => {
        const deadline = Date.now() + 10_000;
        const timer = setInterval(() => {
          if (exitCode !== null) {
            clearInterval(timer);
            resolve();
            return;
          }
          if (Date.now() > deadline) {
            clearInterval(timer);
            reject(new Error("onExit not called within 10s"));
          }
        }, 100);
      });

      expect(exitCode).toBe(1);
      expect(outputChunks.join("")).toMatch(/Ollama/i);

      await fs.rm(tmpDir, { recursive: true, force: true });
    });
  });
});
