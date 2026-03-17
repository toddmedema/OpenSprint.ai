#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const tagVersion = process.env.TAG_VERSION;
if (!tagVersion || String(tagVersion).trim() === "") {
  console.error("TAG_VERSION is required (e.g. v1.2.3). Set it from the git tag.");
  process.exit(1);
}

const version = String(tagVersion).replace(/^v/, "").trim();
if (!version) {
  console.error("TAG_VERSION must be a valid version (e.g. v1.2.3).");
  process.exit(1);
}

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const rootDir = path.resolve(__dirname, "..");
const rootPkgPath = path.join(rootDir, "package.json");
const electronPkgPath = path.join(rootDir, "packages", "electron", "package.json");

function updatePackageVersion(pkgPath) {
  const json = JSON.parse(fs.readFileSync(pkgPath, "utf8"));
  json.version = version;
  fs.writeFileSync(pkgPath, JSON.stringify(json, null, 2) + "\n", "utf8");
}

updatePackageVersion(rootPkgPath);
updatePackageVersion(electronPkgPath);
