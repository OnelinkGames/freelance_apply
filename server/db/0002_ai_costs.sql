CREATE TABLE IF NOT EXISTS ai_costs (
    id TEXT PRIMARY KEY NOT NULL,
    created_at TEXT NOT NULL,
    project_id TEXT NOT NULL,
    provider TEXT NOT NULL,
    model TEXT NOT NULL,
    process TEXT NOT NULL,
    input_tokens INTEGER NOT NULL,
    output_tokens INTEGER NOT NULL,
    total_tokens INTEGER NOT NULL,
    input_cost REAL NOT NULL,
    output_cost REAL NOT NULL,
    total_cost REAL NOT NULL,
    request_duration_ms INTEGER NOT NULL,
    FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_ai_costs_created_at ON ai_costs(created_at);
CREATE INDEX IF NOT EXISTS idx_ai_costs_project_id ON ai_costs(project_id);
CREATE INDEX IF NOT EXISTS idx_ai_costs_process ON ai_costs(process);
