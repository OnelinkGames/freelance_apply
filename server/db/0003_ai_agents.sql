CREATE TABLE IF NOT EXISTS ai_agents (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    process TEXT NOT NULL UNIQUE,
    provider TEXT NOT NULL DEFAULT 'OPENAI',
    model TEXT NOT NULL,
    temperature REAL NOT NULL DEFAULT 0.3,
    max_tokens INTEGER NOT NULL DEFAULT 4096,
    system_prompt TEXT NOT NULL,
    generation_prompt TEXT,
    preview_prompt TEXT,
    enabled INTEGER NOT NULL DEFAULT 1,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
);
