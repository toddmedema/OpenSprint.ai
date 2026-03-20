import { describe, expect, it } from "vitest";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const afterSign = require("./after-sign-notarize.js");

describe("after-sign-notarize", () => {
  it("parses seconds when no suffix is provided", () => {
    expect(afterSign.parseDurationToMs("600")).toBe(600000);
  });

  it("parses minutes and hours", () => {
    expect(afterSign.parseDurationToMs("30m")).toBe(1800000);
    expect(afterSign.parseDurationToMs("2h")).toBe(7200000);
  });

  it("rejects invalid timeout formats", () => {
    expect(() => afterSign.parseDurationToMs("abc")).toThrow(/Invalid OPENSPRINT_NOTARY_TIMEOUT/);
  });
});
