#!/usr/bin/env node
"use strict";
/* global module, process */
/* eslint-disable @typescript-eslint/no-require-imports */

const fs = require("fs");
const os = require("os");
const path = require("path");
const { execFileSync } = require("child_process");

function parseDurationToMs(value) {
  const trimmed = String(value || "").trim();
  const match = /^(\d+)([smh]?)$/i.exec(trimmed);
  if (!match) {
    throw new Error(
      `Invalid OPENSPRINT_NOTARY_TIMEOUT value "${value}". Use formats like 600, 30m, or 2h.`
    );
  }

  const amount = Number(match[1]);
  const unit = (match[2] || "s").toLowerCase();
  if (unit === "h") return amount * 60 * 60 * 1000;
  if (unit === "m") return amount * 60 * 1000;
  return amount * 1000;
}

function requiredEnv(name) {
  const value = process.env[name]?.trim();
  return value ? value : "";
}

function formatElapsed(ms) {
  const totalSeconds = Math.floor(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  if (minutes === 0) return `${seconds}s`;
  return `${minutes}m ${seconds}s`;
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function getNotarizationArgs() {
  const apiKey = requiredEnv("APPLE_API_KEY");
  const apiKeyId = requiredEnv("APPLE_API_KEY_ID");
  const issuer = requiredEnv("APPLE_API_ISSUER");

  if (!apiKey && !apiKeyId && !issuer) {
    return null;
  }

  if (!apiKey || !apiKeyId || !issuer) {
    throw new Error(
      "APPLE_API_KEY, APPLE_API_KEY_ID, and APPLE_API_ISSUER must all be set for macOS notarization."
    );
  }

  return ["--key", apiKey, "--key-id", apiKeyId, "--issuer", issuer];
}

function runNotarytool(args) {
  return execFileSync("/usr/bin/xcrun", ["notarytool", ...args], {
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
  });
}

function runNotarytoolJson(args) {
  const output = runNotarytool([...args, "--output-format", "json"]);
  try {
    return JSON.parse(output);
  } catch (error) {
    throw new Error(`Failed to parse notarytool JSON output:\n${output}`, { cause: error });
  }
}

function fetchNotaryLog(submissionId, authArgs) {
  try {
    return runNotarytool(["log", submissionId, ...authArgs]);
  } catch (error) {
    return `Failed to fetch notarization log for ${submissionId}: ${error.message}`;
  }
}

async function waitForNotarization(submissionId, authArgs, timeout) {
  const pollIntervalMs = 30 * 1000;
  const timeoutMs = parseDurationToMs(timeout);
  const startedAt = Date.now();

  while (true) {
    const info = runNotarytoolJson(["info", submissionId, ...authArgs]);
    const status = String(info.status || "")
      .trim()
      .toLowerCase();
    const elapsed = formatElapsed(Date.now() - startedAt);
    const statusText = info.status || "Unknown";
    const statusSummary = info.message ? ` (${info.message})` : "";

    console.log(
      `[notarytool] submission=${submissionId} status=${statusText}${statusSummary} elapsed=${elapsed}`
    );

    if (status === "accepted") {
      return;
    }

    if (status === "invalid" || status === "rejected") {
      const logOutput = fetchNotaryLog(submissionId, authArgs);
      throw new Error(
        `Apple notarization failed for submission ${submissionId} with status ${info.status}.\n\n${logOutput}`
      );
    }

    const elapsedMs = Date.now() - startedAt;
    if (elapsedMs >= timeoutMs) {
      throw new Error(
        `Apple notarization did not complete within ${timeout}. Submission ${submissionId} is still ${info.status}. Increase OPENSPRINT_NOTARY_TIMEOUT or inspect it later with xcrun notarytool info ${submissionId}.`
      );
    }

    await sleep(Math.min(pollIntervalMs, timeoutMs - elapsedMs));
  }
}

module.exports = async function afterSign(context) {
  if (process.platform !== "darwin" || context.electronPlatformName !== "darwin") {
    return;
  }

  const authArgs = getNotarizationArgs();
  if (authArgs == null) {
    console.log("Skipping macOS notarization: APPLE_API_KEY credentials were not provided.");
    return;
  }

  const appPath = path.join(context.appOutDir, `${context.packager.appInfo.productFilename}.app`);
  if (!fs.existsSync(appPath)) {
    throw new Error(`Expected signed app bundle at ${appPath}`);
  }

  const timeout = requiredEnv("OPENSPRINT_NOTARY_TIMEOUT") || "90m";
  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "opensprint-notary-"));
  const zipPath = path.join(tempDir, `${context.packager.appInfo.productFilename}.zip`);

  try {
    console.log(`Compressing app for notarization: ${appPath}`);
    execFileSync(
      "/usr/bin/ditto",
      ["-c", "-k", "--sequesterRsrc", "--keepParent", path.basename(appPath), zipPath],
      {
        cwd: path.dirname(appPath),
        stdio: "inherit",
      }
    );

    console.log(`Submitting app to Apple notarization service (max wait=${timeout})...`);
    const submission = runNotarytoolJson(["submit", zipPath, ...authArgs]);
    const submissionId = String(submission.id || "").trim();
    if (!submissionId) {
      throw new Error(
        `Apple notarization did not return a submission id:\n${JSON.stringify(submission)}`
      );
    }

    console.log(`Submitted for Apple notarization. submissionId=${submissionId}`);
    await waitForNotarization(submissionId, authArgs, timeout);

    console.log(`Apple notarization accepted for submission ${submissionId}.`);
    console.log(`Stapling notarization ticket to ${appPath}...`);
    execFileSync("/usr/bin/xcrun", ["stapler", "staple", "-v", appPath], {
      stdio: "inherit",
    });

    console.log(`Validating stapled notarization ticket on ${appPath}...`);
    execFileSync("/usr/bin/xcrun", ["stapler", "validate", appPath], {
      stdio: "inherit",
    });
  } finally {
    fs.rmSync(tempDir, { recursive: true, force: true });
  }
};

module.exports.parseDurationToMs = parseDurationToMs;
