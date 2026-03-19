import { defineProject } from "vitest/config";
import {
  backendCommonTestConfig,
  backendResolveConfig,
  backendSsrConfig,
  backendTestInclude,
  backendUnitExclude,
  unitWorkers,
} from "./vitest.shared.js";

export default defineProject({
  resolve: backendResolveConfig,
  ssr: backendSsrConfig,
  test: {
    ...backendCommonTestConfig,
    name: "unit",
    include: backendTestInclude,
    exclude: backendUnitExclude,
    pool: "forks",
    minWorkers: 1,
    maxWorkers: unitWorkers,
  },
});
