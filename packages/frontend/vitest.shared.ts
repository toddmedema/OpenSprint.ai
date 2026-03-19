export const frontendTestInclude = ["src/**/*.test.{ts,tsx}", "src/**/*.e2e.test.{ts,tsx}"];
export const frontendFlowInclude = [
  "src/__tests__/**/*.e2e.test.{ts,tsx}",
  "src/test/**/*.e2e.test.{ts,tsx}",
  "src/pages/**/*.test.{ts,tsx}",
  "src/components/layout/Navbar.test.tsx",
];
export const frontendUnitExclude = frontendFlowInclude;

export const frontendCommonTestConfig = {
  globals: true,
  environment: "jsdom" as const,
  setupFiles: ["./src/test/setup.ts"],
  testTimeout: 30_000,
  teardownTimeout: 10_000,
};
