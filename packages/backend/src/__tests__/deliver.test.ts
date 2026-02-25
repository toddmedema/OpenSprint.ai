import { describe, it, expect } from "vitest";
import { getExpoDeployCommand } from "../utils/expo-deploy-command.js";

describe("getExpoDeployCommand", () => {
  it("returns beta command without npm run build", () => {
    const cmd = getExpoDeployCommand("beta");
    expect(cmd).not.toContain("npm run build");
    expect(cmd).toBe("npx expo export --platform web && npx eas-cli deploy");
  });

  it("returns prod command without npm run build", () => {
    const cmd = getExpoDeployCommand("prod");
    expect(cmd).not.toContain("npm run build");
    expect(cmd).toBe("npx expo export --platform web && npx eas-cli deploy --prod");
  });

  it("includes expo export and eas deploy for both variants", () => {
    expect(getExpoDeployCommand("beta")).toContain("npx expo export --platform web");
    expect(getExpoDeployCommand("beta")).toContain("npx eas-cli deploy");
    expect(getExpoDeployCommand("prod")).toContain("npx expo export --platform web");
    expect(getExpoDeployCommand("prod")).toContain("npx eas-cli deploy");
  });

  it("adds --prod suffix only for prod variant", () => {
    expect(getExpoDeployCommand("beta")).not.toContain("--prod");
    expect(getExpoDeployCommand("prod")).toContain(" --prod");
  });
});
