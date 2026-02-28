/**
 * Vitest global setup: start a Postgres container for backend tests.
 * Writes connection URL to .vitest-postgres-url for test-db-helper.
 * If TEST_DATABASE_URL is already set (e.g. CI with real Postgres), skip container.
 */

import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const URL_FILE = path.resolve(__dirname, "../../.vitest-postgres-url");
const CONTAINER_ID_FILE = path.resolve(__dirname, "../../.vitest-postgres-container-id");

export default async function globalSetup() {
  if (process.env.TEST_DATABASE_URL) {
    return;
  }

  try {
    const { PostgreSqlContainer } = await import("@testcontainers/postgresql");
    const container = await new PostgreSqlContainer("postgres:16-alpine")
      .withDatabase("opensprint")
      .withUsername("opensprint")
      .withPassword("opensprint")
      .start();

    const url = container.getConnectionUri();
    const containerId = container.getId();

    await fs.writeFile(URL_FILE, url, "utf-8");
    await fs.writeFile(CONTAINER_ID_FILE, containerId, "utf-8");
  } catch (err) {
    console.warn(
      "[vitest globalSetup] Could not start Postgres container (Docker required). Tests requiring Postgres will be skipped.",
      err
    );
  }
}
