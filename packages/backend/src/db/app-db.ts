import pg from "pg";
import type { DbClient } from "./client.js";
import { createPostgresDbClient, getPoolConfig } from "./client.js";
import { runSchema } from "./schema.js";
import { createSqliteDbClient, openSqliteDatabase } from "./sqlite-client.js";
import { getDatabaseDialect } from "@opensprint/shared";
import { drizzle } from "drizzle-orm/node-postgres";
import * as schema from "./drizzle-schema-pg.js";

export type DrizzlePg = ReturnType<typeof drizzle<typeof schema>>;

export interface AppDb {
  getClient(): Promise<DbClient>;
  runWrite<T>(fn: (client: DbClient) => Promise<T>): Promise<T>;
  close(): Promise<void>;
  /** When using Postgres, returns a Drizzle instance for type-safe queries. Null for SQLite. */
  getDrizzle?(): Promise<DrizzlePg | null>;
}

/** Tag app connections so PG logs show application_name=opensprint-app. */
function addApplicationName(url: string, name: string): string {
  try {
    const u = new URL(url);
    u.searchParams.set("application_name", name);
    return u.toString();
  } catch {
    return url;
  }
}

async function initPostgresAppDb(databaseUrl: string): Promise<AppDb> {
  const urlWithAppName = addApplicationName(databaseUrl, "opensprint-app");
  const pool = new pg.Pool(getPoolConfig(urlWithAppName));
  const client = createPostgresDbClient(pool);
  await runSchema(client, "postgres");

  const drizzleInstance = drizzle({ client: pool, schema });

  return {
    async getClient(): Promise<DbClient> {
      return client;
    },
    async runWrite<T>(fn: (client: DbClient) => Promise<T>): Promise<T> {
      return client.runInTransaction(fn);
    },
    async close(): Promise<void> {
      await pool.end();
    },
    async getDrizzle(): Promise<DrizzlePg | null> {
      return drizzleInstance;
    },
  };
}

async function initSqliteAppDb(databaseUrl: string): Promise<AppDb> {
  const { db, close } = await openSqliteDatabase(databaseUrl);
  const client = createSqliteDbClient(db);
  await runSchema(client, "sqlite");

  return {
    async getClient(): Promise<DbClient> {
      return client;
    },
    async runWrite<T>(fn: (client: DbClient) => Promise<T>): Promise<T> {
      return client.runInTransaction(fn);
    },
    async close(): Promise<void> {
      close();
    },
  };
}

export async function initAppDb(databaseUrl: string): Promise<AppDb> {
  const dialect = getDatabaseDialect(databaseUrl);
  if (dialect === "sqlite") {
    return initSqliteAppDb(databaseUrl);
  }
  return initPostgresAppDb(databaseUrl);
}
