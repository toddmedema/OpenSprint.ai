import { describe, it, expect, beforeEach, afterEach } from "vitest";
import {
  setLocalSessionTokenForTesting,
  ensureLocalSessionToken,
  VITEST_DEFAULT_LOCAL_SESSION_TOKEN,
  originIsTrustedLocalhost,
  refererIsTrustedLocalhost,
  requestHasLocalSessionCredential,
} from "../services/local-session-auth.service.js";

describe("local-session-auth.service", () => {
  beforeEach(() => {
    setLocalSessionTokenForTesting("unit-test-session-token");
  });

  afterEach(() => {
    // Restore the default Vitest token so other suites in the same worker see a predictable bearer.
    setLocalSessionTokenForTesting(VITEST_DEFAULT_LOCAL_SESSION_TOKEN);
    ensureLocalSessionToken();
  });

  it("originIsTrustedLocalhost accepts localhost and 127.0.0.1 with optional port", () => {
    expect(originIsTrustedLocalhost("http://localhost:5173")).toBe(true);
    expect(originIsTrustedLocalhost("http://127.0.0.1:3100")).toBe(true);
    expect(originIsTrustedLocalhost("https://localhost")).toBe(true);
    expect(originIsTrustedLocalhost("http://[::1]:8080")).toBe(true);
    expect(originIsTrustedLocalhost("http://evil.com")).toBe(false);
    expect(originIsTrustedLocalhost(undefined)).toBe(false);
  });

  it("refererIsTrustedLocalhost parses URL host correctly", () => {
    expect(refererIsTrustedLocalhost("http://localhost:5173/app")).toBe(true);
    expect(refererIsTrustedLocalhost("http://127.0.0.1:3100/")).toBe(true);
    expect(refererIsTrustedLocalhost("https://evil.com/localhost")).toBe(false);
  });

  it("requestHasLocalSessionCredential accepts matching bearer", () => {
    expect(
      requestHasLocalSessionCredential("Bearer unit-test-session-token", undefined, undefined)
    ).toBe(true);
    expect(requestHasLocalSessionCredential("Bearer wrong", undefined, undefined)).toBe(false);
  });

  it("requestHasLocalSessionCredential accepts trusted Origin or Referer", () => {
    expect(requestHasLocalSessionCredential(undefined, "http://localhost:3000", undefined)).toBe(
      true
    );
    expect(
      requestHasLocalSessionCredential(undefined, undefined, "http://127.0.0.1:5173/page")
    ).toBe(true);
    expect(requestHasLocalSessionCredential(undefined, undefined, undefined)).toBe(false);
  });
});
