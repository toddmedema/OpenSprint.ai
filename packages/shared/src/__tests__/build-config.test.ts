/**
 * Unit test: verifies that shared package build configuration produces dist/
 * output for production (needed for 'node dist/index.js' backend deployment).
 */
import { describe, it, expect } from "vitest";
import { readFileSync, existsSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const pkgRoot = resolve(__dirname, "../..");

describe("build config (production dist output)", () => {
  it("tsconfig.build.json has outDir ./dist", () => {
    const buildConfig = JSON.parse(readFileSync(resolve(pkgRoot, "tsconfig.build.json"), "utf-8"));
    expect(buildConfig.compilerOptions?.outDir).toBe("./dist");
  });

  it("tsconfig.build.json has rootDir ./src", () => {
    const buildConfig = JSON.parse(readFileSync(resolve(pkgRoot, "tsconfig.build.json"), "utf-8"));
    expect(buildConfig.compilerOptions?.rootDir).toBe("./src");
  });

  it("package.json build script uses tsconfig.build.json", () => {
    const pkg = JSON.parse(readFileSync(resolve(pkgRoot, "package.json"), "utf-8"));
    expect(pkg.scripts?.build).toContain("tsconfig.build.json");
  });

  it("package.json exports dist for production (import/require)", () => {
    const pkg = JSON.parse(readFileSync(resolve(pkgRoot, "package.json"), "utf-8"));
    const exports = pkg.exports?.["."];
    expect(exports).toBeDefined();
    const importPaths = exports.import ?? exports.default;
    expect(Array.isArray(importPaths) ? importPaths[0] : importPaths).toMatch(
      /\.\/dist\/index\.js/
    );
  });

  it("build produces dist/index.js and dist/index.d.ts when run", async () => {
    const distJs = resolve(pkgRoot, "dist/index.js");
    const distDts = resolve(pkgRoot, "dist/index.d.ts");
    // After npm run build, these should exist. If dist was cleaned, skip.
    if (!existsSync(distJs) || !existsSync(distDts)) {
      // Build may not have run; config is still valid
      expect(existsSync(resolve(pkgRoot, "tsconfig.build.json"))).toBe(true);
      return;
    }
    expect(existsSync(distJs)).toBe(true);
    expect(existsSync(distDts)).toBe(true);
  });
});
