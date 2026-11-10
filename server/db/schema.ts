import { sqliteTable, text, integer, real } from "drizzle-orm/sqlite-core";

export const columns = sqliteTable("columns", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  slug: text("slug").notNull().unique(),
  sortOrder: integer("sort_order").notNull(),
});

export const projects = sqliteTable("projects", {
  id: text("id").primaryKey(),
  title: text("title").notNull(),
  currentColumn: text("current_column").notNull(),
  priority: text("priority").notNull().default("medium"),
  tags: text("tags").notNull().default("[]"),
  statusColor: text("status_color"),
  columnData: text("column_data").notNull().default("{}"),
  proposalValue: real("proposal_value"),
  estimatedHours: real("estimated_hours"),
  estimatedDays: integer("estimated_days"),
  expectedFinishDate: text("expected_finish_date"),
  movedToCurrentColumnAt: text("moved_to_current_column_at").notNull(),
  createdAt: text("created_at").notNull(),
  updatedAt: text("updated_at").notNull(),
});

export const comments = sqliteTable("comments", {
  id: text("id").primaryKey(),
  projectId: text("project_id").notNull(),
  text: text("text").notNull(),
  createdAt: text("created_at").notNull(),
});

export const documents = sqliteTable("documents", {
  id: text("id").primaryKey(),
  projectId: text("project_id").notNull(),
  type: text("type").notNull(),
  content: text("content").notNull(),
  filePath: text("file_path"),
  createdAt: text("created_at").notNull(),
});

export const aiConversations = sqliteTable("ai_conversations", {
  id: text("id").primaryKey(),
  projectId: text("project_id").notNull(),
  columnSlug: text("column_slug").notNull(),
  createdAt: text("created_at").notNull(),
});

export const messages = sqliteTable("messages", {
  id: text("id").primaryKey(),
  conversationId: text("conversation_id").notNull(),
  role: text("role").notNull(),
  content: text("content").notNull(),
  createdAt: text("created_at").notNull(),
});

export const milestones = sqliteTable("milestones", {
  id: text("id").primaryKey(),
  projectId: text("project_id").notNull(),
  percentage: real("percentage").notNull(),
  description: text("description").notNull(),
  sortOrder: integer("sort_order").notNull(),
});

export const attachments = sqliteTable("attachments", {
  id: text("id").primaryKey(),
  projectId: text("project_id").notNull(),
  url: text("url").notNull(),
  type: text("type").notNull().default("link"),
  notes: text("notes"),
});

export const aiCosts = sqliteTable("ai_costs", {
  id: text("id").primaryKey(),
  createdAt: text("created_at").notNull(),
  projectId: text("project_id").notNull(),
  provider: text("provider").notNull(),
  model: text("model").notNull(),
  process: text("process").notNull(),
  inputTokens: integer("input_tokens").notNull(),
  outputTokens: integer("output_tokens").notNull(),
  totalTokens: integer("total_tokens").notNull(),
  inputCost: real("input_cost").notNull(),
  outputCost: real("output_cost").notNull(),
  totalCost: real("total_cost").notNull(),
  requestDurationMs: integer("request_duration_ms").notNull(),
});

export const aiAgents = sqliteTable("ai_agents", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  process: text("process").notNull().unique(),
  provider: text("provider").notNull().default("OPENROUTER"),
  model: text("model").notNull(),
  temperature: real("temperature").notNull().default(0.3),
  maxTokens: integer("max_tokens").notNull().default(4096),
  systemPrompt: text("system_prompt").notNull(),
  generationPrompt: text("generation_prompt"),
  previewPrompt: text("preview_prompt"),
  enabled: integer("enabled").notNull().default(1),
  createdAt: text("created_at").notNull(),
  updatedAt: text("updated_at").notNull(),
});

export const aiSettings = sqliteTable("ai_settings", {
  id: text("id").primaryKey().default("default"),
  provider: text("provider").notNull().default("OPENROUTER"),
  apiKeyEncrypted: text("api_key_encrypted"),
  defaultModel: text("default_model").notNull().default("openai/gpt-4.1-mini"),
  usdToBrl: real("usd_to_brl").notNull().default(5.5),
  updatedAt: text("updated_at").notNull(),
});
