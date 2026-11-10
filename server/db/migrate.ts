import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import Database from "better-sqlite3";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const MIGRATIONS = [
  "0001_initial.sql",
  "0002_ai_costs.sql",
  "0003_ai_agents.sql",
  "0004_ai_settings.sql",
];

function runMigration(db: Database.Database, filename: string) {
  const sql = fs.readFileSync(path.join(__dirname, filename), "utf-8");
  db.exec(sql);
}

export function migrate(dbPath: string) {
  const db = new Database(dbPath);
  for (const file of MIGRATIONS) {
    runMigration(db, file);
  }
  db.close();
}

function tableExists(db: Database.Database, name: string): boolean {
  const row = db
    .prepare("SELECT name FROM sqlite_master WHERE type='table' AND name=?")
    .get(name);
  return Boolean(row);
}

export function ensureMigrated(dbPath: string) {
  const dir = path.dirname(dbPath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  if (!fs.existsSync(dbPath)) {
    migrate(dbPath);
    return;
  }

  const db = new Database(dbPath);

  if (!tableExists(db, "columns")) {
    runMigration(db, "0001_initial.sql");
  } else {
    const row = db.prepare("SELECT COUNT(*) as count FROM columns").get() as { count: number };
    if (row.count === 0) {
      runMigration(db, "0001_initial.sql");
    }
  }

  if (!tableExists(db, "ai_costs")) {
    runMigration(db, "0002_ai_costs.sql");
  }

  if (!tableExists(db, "ai_agents")) {
    runMigration(db, "0003_ai_agents.sql");
  }

  if (!tableExists(db, "ai_settings")) {
    runMigration(db, "0004_ai_settings.sql");
  }

  db.close();
}
