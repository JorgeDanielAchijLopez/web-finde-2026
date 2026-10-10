import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";
import { migrate } from "drizzle-orm/better-sqlite3/migrator";
import { mkdirSync } from "node:fs";
import { dirname, resolve } from "node:path";
import * as schema from "./schema.js";

export type AppDatabase = ReturnType<typeof createDb>;

export function createDb(databaseUrl: string) {
  mkdirSync(dirname(databaseUrl), { recursive: true });

  const sqlite = new Database(databaseUrl);
  sqlite.pragma("foreign_keys = ON");

  const db = drizzle(sqlite, { schema });

  migrate(db, { migrationsFolder: resolve(process.cwd(), "drizzle") });

  return db;
}

export function getDefaultDatabaseUrl(): string {
  return resolve(process.cwd(), "data", "app.db");
}
