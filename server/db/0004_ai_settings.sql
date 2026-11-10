CREATE TABLE IF NOT EXISTS ai_settings (
  id TEXT PRIMARY KEY NOT NULL DEFAULT 'default',
  provider TEXT NOT NULL DEFAULT 'OPENROUTER',
  api_key_encrypted TEXT,
  default_model TEXT NOT NULL DEFAULT 'openai/gpt-4.1-mini',
  usd_to_brl REAL NOT NULL DEFAULT 5.5,
  updated_at TEXT NOT NULL
);

INSERT OR IGNORE INTO ai_settings (id, provider, default_model, usd_to_brl, updated_at)
VALUES ('default', 'OPENROUTER', 'openai/gpt-4.1-mini', 5.5, datetime('now'));
