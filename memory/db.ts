import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";
import { migrate } from "drizzle-orm/better-sqlite3/migrator";
import path from "path";
import fs from "fs";
import * as schema from "./schema";

let _db: ReturnType<typeof drizzle> | null = null;
let _sqlite: Database.Database | null = null;

export function getDbPath(): string {
  const env = process.env.DATABASE_PATH;
  if (env) return env;
  const dataDir = path.join(process.cwd(), "data");
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }
  return path.join(dataDir, "memory.sqlite");
}

export function getSqlite(): Database.Database {
  if (_sqlite) return _sqlite;
  const dbPath = getDbPath();
  _sqlite = new Database(dbPath);
  _sqlite.pragma("journal_mode = WAL");
  return _sqlite;
}

export function getDb() {
  if (_db) return _db;
  const sqlite = getSqlite();
  _db = drizzle(sqlite, { schema });
  return _db;
}

export function runMigrations() {
  const sqlite = getSqlite();
  const migrationsFolder = path.join(process.cwd(), "drizzle");
  if (fs.existsSync(migrationsFolder)) {
    migrate(drizzle(sqlite, { schema }), { migrationsFolder });
  }
}

export { schema };
