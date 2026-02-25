import { describe, it, expect } from "vitest";
import { parseAgentConfig } from "../schemas/agent-config.js";
import { AppError } from "../middleware/error-handler.js";

describe("agent-config schema", () => {
  describe("parseAgentConfig", () => {
    it("should accept valid lowComplexityAgent config", () => {
      const config = parseAgentConfig(
        { type: "claude", model: "claude-sonnet-4", cliCommand: null },
        "lowComplexityAgent"
      );
      expect(config).toEqual({
        type: "claude",
        model: "claude-sonnet-4",
        cliCommand: null,
      });
    });

    it("should accept valid highComplexityAgent config", () => {
      const config = parseAgentConfig(
        { type: "cursor", model: "composer-1.5", cliCommand: null },
        "highComplexityAgent"
      );
      expect(config).toEqual({
        type: "cursor",
        model: "composer-1.5",
        cliCommand: null,
      });
    });

    it("should reject invalid type", () => {
      expect(() =>
        parseAgentConfig({ type: "invalid", model: null, cliCommand: null }, "lowComplexityAgent")
      ).toThrow(AppError);
    });

    it("should reject invalid model type", () => {
      expect(() =>
        parseAgentConfig({ type: "claude", model: 123, cliCommand: null }, "highComplexityAgent")
      ).toThrow(AppError);
    });
  });
});
