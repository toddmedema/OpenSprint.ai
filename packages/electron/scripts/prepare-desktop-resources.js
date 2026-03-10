#!/usr/bin/env node
"use strict";

const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");

const repoRoot = path.resolve(__dirname, "..", "..", "..");
const backendDir = path.join(repoRoot, "packages", "backend");
const frontendDir = path.join(repoRoot, "packages", "frontend");
const sharedDir = path.join(repoRoot, "packages", "shared");
const outDir = path.join(repoRoot, "packages", "electron", "desktop-resources");

async function run() {
  console.log("Preparing desktop resources...");

  if (fs.existsSync(outDir)) fs.rmSync(outDir, { recursive: true, force: true });
  fs.mkdirSync(outDir, { recursive: true });

  const backendOut = path.join(outDir, "backend");
  const frontendOut = path.join(outDir, "frontend");

  fs.mkdirSync(backendOut, { recursive: true });
  fs.cpSync(path.join(backendDir, "dist"), path.join(backendOut, "dist"), { recursive: true });
  fs.copyFileSync(
    path.join(backendDir, "package.json"),
    path.join(backendOut, "package.json")
  );

  const sharedDest = path.join(backendOut, "node_modules", "@opensprint", "shared");
  fs.mkdirSync(sharedDest, { recursive: true });
  fs.cpSync(path.join(sharedDir, "dist"), path.join(sharedDest, "dist"), { recursive: true });
  fs.copyFileSync(
    path.join(sharedDir, "package.json"),
    path.join(sharedDest, "package.json")
  );

  console.log("Running npm install (production) in backend...");
  execSync("npm install --omit=dev", {
    cwd: backendOut,
    stdio: "inherit",
  });

  fs.cpSync(path.join(frontendDir, "dist"), frontendOut, { recursive: true });

  // Generate macOS tray template icons (black logo on transparent) so the menu bar shows the three triangles
  await generateTrayIcons(frontendOut);

  console.log("Desktop resources ready at", outDir);
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
