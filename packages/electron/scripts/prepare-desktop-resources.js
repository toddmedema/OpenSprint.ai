#!/usr/bin/env node
"use strict";

const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");

const repoRoot = path.resolve(__dirname, "..", "..", "..");
const backendDir = path.join(repoRoot, "packages", "backend");
const frontendDir = path.join(repoRoot, "packages", "frontend");
const runtimeDepsTemplateDir = path.join(repoRoot, "packages", "electron", "runtime-deps");
const outDir = path.join(repoRoot, "packages", "electron", "desktop-resources");
// Keep only native modules external; bundle pure JS deps so runtime install is minimal.
const backendExternalDeps = ["better-sqlite3"];
const removableDirNames = new Set([
  "test",
  "tests",
  "__tests__",
  "doc",
  "docs",
  "example",
  "examples",
  "benchmark",
  "bench",
]);

async function run() {
  console.log("Preparing desktop resources...");

  if (fs.existsSync(outDir)) fs.rmSync(outDir, { recursive: true, force: true });
  fs.mkdirSync(outDir, { recursive: true });

  const backendOut = path.join(outDir, "backend");
  const frontendOut = path.join(outDir, "frontend");

  fs.mkdirSync(backendOut, { recursive: true });
  await bundleBackendRuntime(backendOut);
  copyRuntimeDependencyTemplate(backendOut);

  console.log("Installing backend runtime dependencies...");
  execSync("npm ci --omit=dev --ignore-scripts=false --no-audit --no-fund", {
    cwd: backendOut,
    stdio: "inherit",
  });

  console.log("Pruning non-runtime files from backend node_modules...");
  pruneBackendNodeModules(path.join(backendOut, "node_modules"));

  fs.cpSync(path.join(frontendDir, "dist"), frontendOut, { recursive: true });

  // Generate macOS tray template icons (black logo on transparent) so the menu bar shows the three triangles
  await generateTrayIcons(frontendOut);

  console.log("Desktop resources ready at", outDir);
}

async function bundleBackendRuntime(backendOut) {
  const esbuild = require("esbuild");
  const entryPoint = path.join(backendDir, "dist", "index.js");
  const outFile = path.join(backendOut, "dist", "services", "index.cjs");
  fs.mkdirSync(path.dirname(outFile), { recursive: true });

  // Preserve docs path resolution in help-chat service by keeping bundle under dist/services.
  fs.cpSync(path.join(backendDir, "docs"), path.join(backendOut, "docs"), { recursive: true });

  console.log("Bundling backend runtime...");
  await esbuild.build({
    entryPoints: [entryPoint],
    outfile: outFile,
    bundle: true,
    platform: "node",
    format: "cjs",
    target: ["node20"],
    minify: true,
    sourcemap: false,
    legalComments: "none",
    external: backendExternalDeps,
    logLevel: "info",
  });
}

function copyRuntimeDependencyTemplate(backendOut) {
  const templatePackagePath = path.join(runtimeDepsTemplateDir, "package.json");
  const templateLockPath = path.join(runtimeDepsTemplateDir, "package-lock.json");
  if (!fs.existsSync(templatePackagePath) || !fs.existsSync(templateLockPath)) {
    throw new Error(
      "Missing runtime dependency template. Expected package.json and package-lock.json in packages/electron/runtime-deps."
    );
  }

  const backendPkgPath = path.join(backendDir, "package.json");
  const backendPkg = JSON.parse(fs.readFileSync(backendPkgPath, "utf8"));
  const templatePkg = JSON.parse(fs.readFileSync(templatePackagePath, "utf8"));

  for (const dep of backendExternalDeps) {
    if (!backendPkg.dependencies?.[dep]) {
      throw new Error(`Missing dependency '${dep}' in ${backendPkgPath}`);
    }
    const pinned = templatePkg.dependencies?.[dep];
    if (typeof pinned !== "string" || /[~^*><= ]/.test(pinned)) {
      throw new Error(
        `packages/electron/runtime-deps/package.json must pin '${dep}' to an exact version (no ranges).`
      );
    }
  }

  fs.copyFileSync(templatePackagePath, path.join(backendOut, "package.json"));
  fs.copyFileSync(templateLockPath, path.join(backendOut, "package-lock.json"));
}

function pruneBackendNodeModules(nodeModulesDir) {
  if (!fs.existsSync(nodeModulesDir)) return;

  walk(nodeModulesDir);
  // Source assets used only for rebuilding native module, not required at runtime.
  removeIfExists(path.join(nodeModulesDir, "better-sqlite3", "deps"));

  function walk(dir) {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const fullPath = path.join(dir, entry.name);
      if (entry.isSymbolicLink()) continue;
      if (entry.isDirectory()) {
        if (removableDirNames.has(entry.name.toLowerCase())) {
          removeIfExists(fullPath);
          continue;
        }
        walk(fullPath);
        continue;
      }
      if (entry.isFile() && shouldPruneFile(entry.name)) {
        fs.rmSync(fullPath, { force: true });
      }
    }
  }
}

function shouldPruneFile(fileName) {
  const lower = fileName.toLowerCase();
  return (
    lower.endsWith(".map") ||
    lower.endsWith(".d.ts") ||
    lower.endsWith(".d.cts") ||
    lower.endsWith(".d.mts")
  );
}

function removeIfExists(targetPath) {
  if (fs.existsSync(targetPath)) {
    fs.rmSync(targetPath, { recursive: true, force: true });
  }
}

function generateTrayIcons(frontendOut) {
  return (async function () {
    const logoIconSvg = path.join(frontendDir, "public", "logo-icon.svg");
    if (!fs.existsSync(logoIconSvg)) return;
    try {
      const sharp = require("sharp");
      let svg = fs.readFileSync(logoIconSvg, "utf8");
      // Template images must be black on transparent for macOS menu bar
      svg = svg.replace(/fill="#[^"]+"/g, 'fill="#000000"');
      const size = 16;
      const size2x = 32;
      const buf = Buffer.from(svg);
      // 1x (16x16)
      await sharp(buf)
        .resize(size, size)
        .png()
        .toFile(path.join(frontendOut, "trayIconTemplate.png"));
      // 2x retina (32x32) — macOS picks up @2x automatically for HiDPI menu bar
      await sharp(buf)
        .resize(size2x, size2x)
        .png()
        .toFile(path.join(frontendOut, "trayIconTemplate@2x.png"));
      // Dot variant: same icon with a small badge circle (for notification state)
      const dotSize = 4;
      const dotX = size - dotSize - 1;
      const dotY = 1;
      const dotSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}"><circle cx="${dotX + dotSize / 2}" cy="${dotY + dotSize / 2}" r="${dotSize / 2}" fill="#000000"/></svg>`;
      const basePng = await sharp(buf).resize(size, size).png().toBuffer();
      const dotOverlay = await sharp(Buffer.from(dotSvg)).resize(size, size).png().toBuffer();
      await sharp(basePng)
        .composite([{ input: dotOverlay, left: 0, top: 0 }])
        .png()
        .toFile(path.join(frontendOut, "trayIconTemplateDot.png"));
      // 2x retina dot variant
      const dotSize2x = 8;
      const dotX2x = size2x - dotSize2x - 2;
      const dotY2x = 2;
      const dotSvg2x = `<svg xmlns="http://www.w3.org/2000/svg" width="${size2x}" height="${size2x}"><circle cx="${dotX2x + dotSize2x / 2}" cy="${dotY2x + dotSize2x / 2}" r="${dotSize2x / 2}" fill="#000000"/></svg>`;
      const basePng2x = await sharp(buf).resize(size2x, size2x).png().toBuffer();
      const dotOverlay2x = await sharp(Buffer.from(dotSvg2x)).resize(size2x, size2x).png().toBuffer();
      await sharp(basePng2x)
        .composite([{ input: dotOverlay2x, left: 0, top: 0 }])
        .png()
        .toFile(path.join(frontendOut, "trayIconTemplateDot@2x.png"));
    } catch (err) {
      console.warn("Could not generate tray icons:", err.message);
    }
  })();
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
