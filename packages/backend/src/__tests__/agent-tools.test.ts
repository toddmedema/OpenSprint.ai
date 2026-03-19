import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { mkdtemp, rm, writeFile, readFile, mkdir } from "fs/promises";
import path from "path";
import os from "os";
import {
  executeTool,
  getAgentToolDefs,
  toAnthropicTools,
  toOpenAITools,
  toGeminiTools,
} from "../services/agent-tools.js";

describe("agent-tools", () => {
  let tmpDir: string;
  let cwd: string;

  beforeEach(async () => {
    tmpDir = await mkdtemp(path.join(os.tmpdir(), "agent-tools-"));
    cwd = tmpDir;
  });

  afterEach(async () => {
    await rm(tmpDir, { recursive: true, force: true });
  });

  const ctx = () => ({ cwd: cwd! });

  describe("getAgentToolDefs", () => {
    it("returns all six tools", () => {
      const defs = getAgentToolDefs();
      expect(defs).toHaveLength(6);
      const names = defs.map((d) => d.name).sort();
      expect(names).toEqual([
        "edit_file",
        "list_files",
        "read_file",
        "run_command",
        "search_files",
        "write_file",
      ]);
    });
  });

  describe("toAnthropicTools / toOpenAITools / toGeminiTools", () => {
    it("export tools with input_schema type object", () => {
      const anthropic = toAnthropicTools();
      expect(anthropic.length).toBe(6);
      expect(anthropic[0]).toMatchObject({
        name: "read_file",
        description: expect.any(String),
        input_schema: { type: "object", properties: expect.any(Object) },
      });
      const openai = toOpenAITools();
      expect(openai.length).toBe(6);
      expect(openai[0]).toMatchObject({
        type: "function",
        function: { name: "read_file", parameters: { type: "object" } },
      });
      const gemini = toGeminiTools();
      expect(gemini.length).toBe(6);
      expect(gemini[0]).toMatchObject({ name: "read_file", parameters: { type: "object" } });
    });
  });

  describe("executeTool", () => {
    it("read_file returns file content", async () => {
      await writeFile(path.join(cwd, "hello.txt"), "hello world", "utf-8");
      const out = await executeTool("read_file", { path: "hello.txt" }, ctx());
      expect(out).toBe("hello world");
    });

    it("read_file returns error for path outside cwd", async () => {
      const out = await executeTool("read_file", { path: "../../etc/passwd" }, ctx());
      expect(out).toContain("Error");
      expect(out).toContain("inside the workspace");
    });

    it("write_file creates file and returns confirmation", async () => {
      const out = await executeTool(
        "write_file",
        { path: "sub/file.txt", content: "content" },
        ctx()
      );
      expect(out).toContain("Wrote");
      const content = await readFile(path.join(cwd, "sub", "file.txt"), "utf-8");
      expect(content).toBe("content");
    });

    it("edit_file replaces old_text with new_text", async () => {
      await writeFile(path.join(cwd, "f.js"), "const x = 1;\nconst y = 2;", "utf-8");
      const out = await executeTool(
        "edit_file",
        { path: "f.js", old_text: "const x = 1;", new_text: "const x = 42;" },
        ctx()
      );
      expect(out).toContain("Updated");
      const content = await readFile(path.join(cwd, "f.js"), "utf-8");
      expect(content).toBe("const x = 42;\nconst y = 2;");
    });

    it("run_command returns stdout", async () => {
      const out = await executeTool("run_command", { command: "echo hi" }, ctx());
      expect(out.trim()).toBe("hi");
    });

    it("list_files returns entries", async () => {
      await writeFile(path.join(cwd, "a.txt"), "", "utf-8");
      await mkdir(path.join(cwd, "dir"), { recursive: true });
      const out = await executeTool("list_files", {}, ctx());
      expect(out).toContain("a.txt");
      expect(out).toContain("dir/");
    });

    it("search_files finds string in file", async () => {
      await writeFile(path.join(cwd, "f.txt"), "line1\nneedle\nline3", "utf-8");
      const out = await executeTool("search_files", { pattern: "needle" }, ctx());
      expect(out).toContain("needle");
      expect(out).toContain("f.txt");
    });

    it("returns error for unknown tool", async () => {
      const out = await executeTool("unknown_tool", {}, ctx());
      expect(out).toContain("unknown tool");
    });
  });
});
