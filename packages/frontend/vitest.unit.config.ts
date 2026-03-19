import path from "path";
import { fileURLToPath } from "url";
import react from "@vitejs/plugin-react";
import { defineProject } from "vitest/config";
import {
  frontendCommonTestConfig,
  frontendTestInclude,
  frontendUnitExclude,
} from "./vitest.shared.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default defineProject({
  root: __dirname,
  plugins: [react()],
  resolve: {
    alias: {
      "@opensprint/shared": path.resolve(__dirname, "../shared/src/index.ts"),
    },
  },
  test: {
    ...frontendCommonTestConfig,
    name: "unit",
    include: frontendTestInclude,
    exclude: frontendUnitExclude,
    pool: "forks",
    poolOptions: {
      forks: { minForks: 1, maxForks: 4 },
    },
  },
});
