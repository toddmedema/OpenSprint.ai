/**
 * Verification test: dev servers use source-direct imports.
 * - Root dev script removes shared/dist so package exports fall through to src.
 * - Frontend Vite config aliases @opensprint/shared to source for HMR.
 * - Backend uses package exports; when dist is removed, Node resolves to src.
 * - Both frontend and backend vitest configs alias to source for npm test.
 */
import { describe, it, expect } from "vitest";
import { readFileSync, existsSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(__dirname, "../../../..");
const sharedRoot = resolve(__dirname, "../..");

describe("dev config (source-direct imports)", () => {
  it("root dev script removes shared/dist before starting", () => {
    const pkg = JSON.parse(
      readFileSync(resolve(repoRoot, "package.json"), "utf-8")
    );
    const devScript = pkg.scripts?.dev ?? "";
    expect(devScript).toMatch(/rm -rf packages\/shared\/dist/);
    expect(devScript).toContain("concurrently");
  });

  it("frontend vite.config aliases @opensprint/shared to source", () => {
    const viteConfigPath = resolve(repoRoot, "packages/frontend/vite.config.ts");
    expect(existsSync(viteConfigPath)).toBe(true);
    const content = readFileSync(viteConfigPath, "utf-8");
    expect(content).toContain("@opensprint/shared");
    expect(content).toMatch(/shared\/src\/index\.ts/);
  });

  it("backend vitest.config aliases @opensprint/shared to source", () => {
    const vitestPath = resolve(repoRoot, "packages/backend/vitest.config.ts");
    expect(existsSync(vitestPath)).toBe(true);
    const content = readFileSync(vitestPath, "utf-8");
    expect(content).toContain("@opensprint/shared");
    expect(content).toMatch(/shared\/src\/index\.ts/);
  });

  it("frontend vitest.config aliases @opensprint/shared to source", () => {
    const vitestPath = resolve(repoRoot, "packages/frontend/vitest.config.ts");
    expect(existsSync(vitestPath)).toBe(true);
    const content = readFileSync(vitestPath, "utf-8");
    expect(content).toContain("@opensprint/shared");
    expect(content).toMatch(/shared\/src\/index\.ts/);
  });

  it("shared package exports have src fallback when dist absent", () => {
    const pkg = JSON.parse(
      readFileSync(resolve(sharedRoot, "package.json"), "utf-8")
    );
    const exports = pkg.exports?.["."];
    expect(exports).toBeDefined();
    const importPaths = exports.import ?? exports.default;
    const paths = Array.isArray(importPaths) ? importPaths : [importPaths];
    expect(paths.some((p: string) => p.includes("src/index.ts"))).toBe(true);
  });

  it("dev script removes dist so backend resolves to source (even when dist existed)", () => {
    // When dist exists from prior build, npm run dev removes it first.
    // Backend (tsx) then resolves @opensprint/shared via package exports;
    // dist/index.js is absent, so Node falls through to src/index.ts.
    const pkg = JSON.parse(
      readFileSync(resolve(repoRoot, "package.json"), "utf-8")
    );
    const devScript = pkg.scripts?.dev ?? "";
    expect(devScript).toMatch(/rm -rf packages\/shared\/dist/);
  });

  it("dev script starts both backend and frontend via concurrently", () => {
    const pkg = JSON.parse(
      readFileSync(resolve(repoRoot, "package.json"), "utf-8")
    );
    const devScript = pkg.scripts?.dev ?? "";
    expect(devScript).toContain("dev:backend");
    expect(devScript).toContain("dev:frontend");
  });
});
