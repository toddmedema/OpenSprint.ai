/**
 * Vitest global teardown: stop the Postgres container started in global-setup.
 */

import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";
import { execSync } from "child_process";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const CONTAINER_ID_FILE = path.resolve(__dirname, "../../.vitest-postgres-container-id");
const URL_FILE = path.resolve(__dirname, "../../.vitest-postgres-url");

export default async function globalTeardown() {
  if (process.env.TEST_DATABASE_URL) {
    return;
  }

  try {
    const containerId = await fs.readFile(CONTAINER_ID_FILE, "utf-8").catch(() => null);
    if (containerId) {
      execSync(`docker stop ${containerId.trim()}`, { stdio: "ignore" });
    }
  } catch {
    // ignore
  }

  await fs.unlink(CONTAINER_ID_FILE).catch(() => {});
  await fs.unlink(URL_FILE).catch(() => {});
}
