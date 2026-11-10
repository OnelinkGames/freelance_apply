CREATE TABLE IF NOT EXISTS columns (
    id TEXT PRIMARY KEY NOT NULL,
    name TEXT NOT NULL,
    slug TEXT NOT NULL UNIQUE,
    sort_order INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS projects (
    id TEXT PRIMARY KEY NOT NULL,
    title TEXT NOT NULL,
    current_column TEXT NOT NULL,
    priority TEXT NOT NULL DEFAULT 'medium',
    tags TEXT NOT NULL DEFAULT '[]',
    status_color TEXT,
    column_data TEXT NOT NULL DEFAULT '{}',
    proposal_value REAL,
    estimated_hours REAL,
    estimated_days INTEGER,
    expected_finish_date TEXT,
    moved_to_current_column_at TEXT NOT NULL,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL,
    FOREIGN KEY (current_column) REFERENCES columns(slug)
);

CREATE TABLE IF NOT EXISTS comments (
    id TEXT PRIMARY KEY NOT NULL,
    project_id TEXT NOT NULL,
    text TEXT NOT NULL,
    created_at TEXT NOT NULL,
    FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS documents (
    id TEXT PRIMARY KEY NOT NULL,
    project_id TEXT NOT NULL,
    type TEXT NOT NULL,
    content TEXT NOT NULL,
    file_path TEXT,
    created_at TEXT NOT NULL,
    FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS ai_conversations (
    id TEXT PRIMARY KEY NOT NULL,
    project_id TEXT NOT NULL,
    column_slug TEXT NOT NULL,
    created_at TEXT NOT NULL,
    FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS messages (
    id TEXT PRIMARY KEY NOT NULL,
    conversation_id TEXT NOT NULL,
    role TEXT NOT NULL,
    content TEXT NOT NULL,
    created_at TEXT NOT NULL,
    FOREIGN KEY (conversation_id) REFERENCES ai_conversations(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS milestones (
    id TEXT PRIMARY KEY NOT NULL,
    project_id TEXT NOT NULL,
    percentage REAL NOT NULL,
    description TEXT NOT NULL,
    sort_order INTEGER NOT NULL,
    FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS attachments (
    id TEXT PRIMARY KEY NOT NULL,
    project_id TEXT NOT NULL,
    url TEXT NOT NULL,
    type TEXT NOT NULL DEFAULT 'link',
    notes TEXT,
    FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
);

INSERT INTO columns (id, name, slug, sort_order) VALUES
    ('col-1', 'Projetos', 'projetos', 1),
    ('col-2', 'Análise Inicial', 'analise-inicial', 2),
    ('col-3', 'Especificação Refinada', 'especificacao-refinada', 3),
    ('col-4', 'Documento de Requisitos', 'documento-requisitos', 4),
    ('col-5', 'Planejamento', 'planejamento', 5),
    ('col-6', 'UX/UI', 'ux-ui', 6),
    ('col-7', 'Proposta Comercial', 'proposta-comercial', 7),
    ('col-8', 'Aguardando Cliente', 'aguardando-cliente', 8),
    ('col-9', 'Em Desenvolvimento', 'em-desenvolvimento', 9),
    ('col-10', 'Finalizados', 'finalizados', 10);
