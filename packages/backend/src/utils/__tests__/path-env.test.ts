import path from "path";
import { describe, expect, it } from "vitest";
import { normalizeSpawnEnvPath, prioritizeNewestNvmNodeInPath } from "../path-env.js";

describe("prioritizeNewestNvmNodeInPath", () => {
  it("returns input unchanged when there are fewer than two NVM node entries", () => {
    const input = [
      "/Users/todd/.local/bin",
      "/Users/todd/.nvm/versions/node/v22.22.0/bin",
      "/usr/bin",
    ].join(path.delimiter);

    expect(prioritizeNewestNvmNodeInPath(input)).toBe(input);
  });

  it("reorders NVM node entries so the newest version appears first", () => {
    const input = [
      "/Users/todd/.local/bin",
      "/Users/todd/.nvm/versions/node/v12.22.12/bin",
      "/opt/homebrew/bin",
      "/Users/todd/.nvm/versions/node/v21.2.0/bin",
      "/Users/todd/.nvm/versions/node/v22.22.0/bin",
      "/usr/bin",
    ].join(path.delimiter);

    const expected = [
      "/Users/todd/.local/bin",
      "/Users/todd/.nvm/versions/node/v22.22.0/bin",
      "/opt/homebrew/bin",
      "/Users/todd/.nvm/versions/node/v21.2.0/bin",
      "/Users/todd/.nvm/versions/node/v12.22.12/bin",
      "/usr/bin",
    ].join(path.delimiter);

    expect(prioritizeNewestNvmNodeInPath(input)).toBe(expected);
  });

  it("supports NVM entries with trailing slash", () => {
    const input = [
      "/Users/todd/.nvm/versions/node/v16.20.2/bin/",
      "/Users/todd/.nvm/versions/node/v22.22.0/bin/",
    ].join(path.delimiter);

    const expected = [
      "/Users/todd/.nvm/versions/node/v22.22.0/bin/",
      "/Users/todd/.nvm/versions/node/v16.20.2/bin/",
    ].join(path.delimiter);

    expect(prioritizeNewestNvmNodeInPath(input)).toBe(expected);
  });
});

describe("normalizeSpawnEnvPath", () => {
  it("returns a cloned object and normalizes PATH", () => {
    const env: NodeJS.ProcessEnv = {
      PATH: [
        "/Users/todd/.nvm/versions/node/v8.11.3/bin",
        "/Users/todd/.nvm/versions/node/v22.22.0/bin",
      ].join(path.delimiter),
      FOO: "bar",
    };

    const normalized = normalizeSpawnEnvPath(env);
    expect(normalized).not.toBe(env);
    expect(normalized.FOO).toBe("bar");
    expect(normalized.PATH).toBe(
      [
        "/Users/todd/.nvm/versions/node/v22.22.0/bin",
        "/Users/todd/.nvm/versions/node/v8.11.3/bin",
      ].join(path.delimiter)
    );
  });
});
