import { describe, it, expect, vi } from "vitest";
import { OpenAIAgenticAdapter, runAgenticLoop, type AgenticLoopAdapter } from "../services/agentic-loop.js";

describe("agentic-loop", () => {
  it("runAgenticLoop returns text and exits when adapter returns no tool calls", async () => {
    const adapter: AgenticLoopAdapter = {
      send: vi.fn().mockResolvedValue({
        text: "Done.",
        toolCalls: [],
        state: undefined,
      }),
    };
    const result = await runAgenticLoop(adapter, "Task: say done", {
      cwd: "/tmp",
    });
    expect(result.content).toBe("Done.");
    expect(result.turnCount).toBe(1);
    expect(adapter.send).toHaveBeenCalledWith("Task: say done", undefined, undefined);
  });

  it("runAgenticLoop calls onChunk with text", async () => {
    const onChunk = vi.fn();
    const adapter: AgenticLoopAdapter = {
      send: vi.fn().mockResolvedValue({
        text: "chunk1",
        toolCalls: [],
        state: undefined,
      }),
    };
    await runAgenticLoop(adapter, "Task", {
      cwd: "/tmp",
      onChunk,
    });
    expect(onChunk).toHaveBeenCalledWith("chunk1");
  });

  it("runAgenticLoop respects abortSignal", async () => {
    const abortSignal = { aborted: false };
    const adapter: AgenticLoopAdapter = {
      send: vi.fn().mockImplementation(async () => {
        abortSignal.aborted = true;
        return { text: "partial", toolCalls: [], state: undefined };
      }),
    };
    const result = await runAgenticLoop(adapter, "Task", {
      cwd: "/tmp",
      abortSignal,
    });
    expect(result.content).toBe("partial");
    expect(result.turnCount).toBe(1);
  });

  it("runAgenticLoop runs multiple turns when adapter returns tool calls then text", async () => {
    const adapter: AgenticLoopAdapter = {
      send: vi
        .fn()
        .mockResolvedValueOnce({
          text: "",
          toolCalls: [{ id: "1", name: "read_file", args: { path: "README.md" } }],
          state: undefined,
        })
        .mockResolvedValueOnce({
          text: "final",
          toolCalls: [],
          state: undefined,
        }),
    };
    const result = await runAgenticLoop(adapter, "Task", {
      cwd: "/tmp",
      maxTurns: 5,
    });
    expect(result.turnCount).toBe(2);
    expect(result.content).toContain("final");
    expect(adapter.send).toHaveBeenCalledTimes(2);
  });

  it("OpenAIAgenticAdapter retries reasoning-only final turns before returning text", async () => {
    const create = vi
      .fn()
      .mockResolvedValueOnce({
        choices: [
          {
            message: { content: "", reasoning: "thinking", tool_calls: [] },
            finish_reason: "length",
          },
        ],
      })
      .mockResolvedValueOnce({
        choices: [{ message: { content: "final", tool_calls: [] }, finish_reason: "stop" }],
      });
    const client = {
      chat: {
        completions: {
          create,
        },
      },
    };

    const adapter = new OpenAIAgenticAdapter(client as never, "local-model");
    const response = await adapter.send("Task");

    expect(create).toHaveBeenCalledTimes(2);
    expect(response.text).toBe("final");
    expect(response.toolCalls).toEqual([]);
  });
});
