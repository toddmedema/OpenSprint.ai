import { describe, it, expect, beforeEach } from "vitest";
import {
  getStoredRunningAgentsDisplayMode,
  setStoredRunningAgentsDisplayMode,
} from "./displayPrefs";

const STORAGE_KEY = "opensprint.runningAgentsDisplayMode";

describe("displayPrefs", () => {
  beforeEach(() => {
    localStorage.removeItem(STORAGE_KEY);
  });

  describe("getStoredRunningAgentsDisplayMode", () => {
    it("returns icons when no value is stored (default)", () => {
      expect(getStoredRunningAgentsDisplayMode()).toBe("icons");
    });

    it("returns icons when invalid value is stored", () => {
      localStorage.setItem(STORAGE_KEY, "invalid");
      expect(getStoredRunningAgentsDisplayMode()).toBe("icons");
    });

    it("returns stored value when valid", () => {
      localStorage.setItem(STORAGE_KEY, "count");
      expect(getStoredRunningAgentsDisplayMode()).toBe("count");

      localStorage.setItem(STORAGE_KEY, "icons");
      expect(getStoredRunningAgentsDisplayMode()).toBe("icons");

      localStorage.setItem(STORAGE_KEY, "both");
      expect(getStoredRunningAgentsDisplayMode()).toBe("both");
    });
  });

  describe("setStoredRunningAgentsDisplayMode", () => {
    it("persists value and get retrieves it", () => {
      setStoredRunningAgentsDisplayMode("count");
      expect(getStoredRunningAgentsDisplayMode()).toBe("count");

      setStoredRunningAgentsDisplayMode("icons");
      expect(getStoredRunningAgentsDisplayMode()).toBe("icons");

      setStoredRunningAgentsDisplayMode("both");
      expect(getStoredRunningAgentsDisplayMode()).toBe("both");
    });
  });
});
