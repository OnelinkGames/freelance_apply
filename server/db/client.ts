import path from "node:path";
import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";
import * as schema from "./schema.js";
import { ensureMigrated } from "./migrate.js";

const dbPath = process.env.DB_PATH ?? path.join(process.cwd(), "data", "freelance.db");

ensureMigrated(dbPath);

const sqlite = new Database(dbPath);
sqlite.pragma("journal_mode = WAL");
sqlite.pragma("foreign_keys = ON");

export const db = drizzle(sqlite, { schema });
export { dbPath };
