import { eq } from "drizzle-orm";
import { db } from "../db/client.js";
import { aiAgents } from "../db/schema.js";
import {
  AGENT_SEEDS,
  COLUMN_SLUG_TO_PROCESS,
  loadAgentMarkdown,
  exportAgentMarkdown,
  parseAgentMarkdown,
  type AgentProcess,
  type AgentProvider,
} from "../lib/agentDefaults.js";
import { resolvePromptTemplate, type PromptContext } from "../lib/promptTemplate.js";
import { DEFAULT_OPENROUTER_MODEL, normalizeToOpenRouterModelId } from "../lib/openRouter.js";
import { getDefaultModel } from "./aiSettingsService.js";
import { nowIso } from "../lib/utils.js";
import * as documentService from "./documentService.js";
import * as projectService from "./projectService.js";

export interface AIAgent {
  id: string;
  name: string;
  process: AgentProcess;
  provider: AgentProvider;
  model: string;
  temperature: number;
  maxTokens: number;
  systemPrompt: string;
  generationPrompt?: string | null;
  previewPrompt?: string | null;
  enabled: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface UpdateAgentInput {
  name?: string;
  provider?: AgentProvider;
  model?: string;
  temperature?: number;
  maxTokens?: number;
  systemPrompt?: string;
  generationPrompt?: string | null;
  previewPrompt?: string | null;
  enabled?: boolean;
}

export interface ResolvedAgentConfig {
  agent: AIAgent;
  systemPrompt: string;
  generationPrompt?: string;
  previewPrompt?: string;
}

function mapRow(row: typeof aiAgents.$inferSelect): AIAgent {
  return {
    id: row.id,
    name: row.name,
    process: row.process as AgentProcess,
    provider: "OPENROUTER",
    model: normalizeToOpenRouterModelId(row.model, DEFAULT_OPENROUTER_MODEL),
    temperature: row.temperature,
    maxTokens: row.maxTokens,
    systemPrompt: row.systemPrompt,
    generationPrompt: row.generationPrompt,
    previewPrompt: row.previewPrompt,
    enabled: row.enabled === 1,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

export function ensureAgentsSeeded(): void {
  const defaultModel = normalizeToOpenRouterModelId(getDefaultModel(), DEFAULT_OPENROUTER_MODEL);
  const defaultProvider: AgentProvider = "OPENROUTER";
  const now = nowIso();

  for (const seed of AGENT_SEEDS) {
    const defaults = loadAgentMarkdown(seed.filename);
    const existing = db.select().from(aiAgents).where(eq(aiAgents.process, seed.process)).get();

    if (!existing) {
      db.insert(aiAgents).values({
        id: seed.id,
        name: seed.name,
        process: seed.process,
        provider: defaultProvider,
        model: defaultModel,
        temperature: defaults.temperature ?? 0.3,
        maxTokens: defaults.maxTokens ?? 4096,
        systemPrompt: defaults.systemPrompt,
        generationPrompt: defaults.generationPrompt ?? null,
        previewPrompt: defaults.previewPrompt ?? null,
        enabled: 1,
        createdAt: now,
        updatedAt: now,
      }).run();
      continue;
    }

    const needsProviderMigration = existing.provider !== "OPENROUTER";
    const normalizedModel = normalizeToOpenRouterModelId(existing.model, defaultModel);
    const needsModelMigration = normalizedModel !== existing.model;
    const needsPromptBackfill = !existing.generationPrompt && Boolean(defaults.generationPrompt);

    if (needsProviderMigration || needsModelMigration || needsPromptBackfill) {
      db.update(aiAgents)
        .set({
          provider: defaultProvider,
          model: normalizedModel,
          generationPrompt: needsPromptBackfill
            ? defaults.generationPrompt ?? null
            : existing.generationPrompt,
          previewPrompt: needsPromptBackfill
            ? defaults.previewPrompt ?? existing.previewPrompt
            : existing.previewPrompt,
          updatedAt: now,
        })
        .where(eq(aiAgents.id, existing.id))
        .run();
    }
  }
}

export function listAgents(): AIAgent[] {
  return db.select().from(aiAgents).all().map(mapRow);
}

export function getAgentById(id: string): AIAgent | null {
  const row = db.select().from(aiAgents).where(eq(aiAgents.id, id)).get();
  return row ? mapRow(row) : null;
}

export function getAgentByProcess(process: AgentProcess): AIAgent | null {
  const row = db.select().from(aiAgents).where(eq(aiAgents.process, process)).get();
  return row ? mapRow(row) : null;
}

export function getAgentByColumnSlug(columnSlug: string): AIAgent | null {
  const process = COLUMN_SLUG_TO_PROCESS[columnSlug];
  if (!process) return null;
  return getAgentByProcess(process);
}

export function updateAgent(id: string, input: UpdateAgentInput): AIAgent {
  const existing = getAgentById(id);
  if (!existing) {
    throw new Error("Agente não encontrado");
  }

  const now = nowIso();
  db.update(aiAgents)
    .set({
      name: input.name ?? existing.name,
      provider: "OPENROUTER",
      model: normalizeToOpenRouterModelId(
        input.model ?? existing.model,
        DEFAULT_OPENROUTER_MODEL,
      ),
      temperature: input.temperature ?? existing.temperature,
      maxTokens: input.maxTokens ?? existing.maxTokens,
      systemPrompt: input.systemPrompt ?? existing.systemPrompt,
      generationPrompt:
        input.generationPrompt !== undefined ? input.generationPrompt : existing.generationPrompt,
      previewPrompt:
        input.previewPrompt !== undefined ? input.previewPrompt : existing.previewPrompt,
      enabled: input.enabled !== undefined ? (input.enabled ? 1 : 0) : existing.enabled ? 1 : 0,
      updatedAt: now,
    })
    .where(eq(aiAgents.id, id))
    .run();

  return getAgentById(id)!;
}

export function restoreAgentDefaults(id: string): AIAgent {
  const agent = getAgentById(id);
  if (!agent) {
    throw new Error("Agente não encontrado");
  }

  const seed = AGENT_SEEDS.find((s) => s.id === id);
  if (!seed) {
    throw new Error("Prompt padrão não encontrado");
  }

  const defaults = loadAgentMarkdown(seed.filename);
  return updateAgent(id, {
    systemPrompt: defaults.systemPrompt,
    generationPrompt: defaults.generationPrompt ?? null,
    previewPrompt: defaults.previewPrompt ?? null,
    temperature: defaults.temperature,
    maxTokens: defaults.maxTokens,
  });
}

export function exportAgentPrompt(id: string): string {
  const agent = getAgentById(id);
  if (!agent) {
    throw new Error("Agente não encontrado");
  }

  return exportAgentMarkdown({
    name: agent.name,
    systemPrompt: agent.systemPrompt,
    generationPrompt: agent.generationPrompt ?? undefined,
    previewPrompt: agent.previewPrompt ?? undefined,
    temperature: agent.temperature,
    maxTokens: agent.maxTokens,
  });
}

export function importAgentPromptFromMarkdown(id: string, markdown: string): AIAgent {
  const parsed = parseAgentMarkdown(markdown);
  return updateAgent(id, {
    systemPrompt: parsed.systemPrompt,
    generationPrompt: parsed.generationPrompt ?? null,
    previewPrompt: parsed.previewPrompt ?? null,
    temperature: parsed.temperature,
    maxTokens: parsed.maxTokens,
  });
}

export function buildProjectContext(projectId: string): PromptContext {
  const project = projectService.getProject(projectId);
  if (!project) {
    return {};
  }

  const columnData = (project.columnData ?? {}) as Record<string, unknown>;
  const analise = columnData as { overview?: string; objectives?: string; description?: string; notes?: string };

  const spec = documentService.getLatestDocument(projectId, "SPEC_REFINED");
  const requirements = documentService.getLatestDocument(projectId, "REQUIREMENTS");
  const planning = documentService.getLatestDocument(projectId, "PLANNING");
  const ux = documentService.getLatestDocument(projectId, "UX");
  const proposal = documentService.getLatestDocument(projectId, "PROPOSAL");

  const docParts: string[] = [];
  if (spec) docParts.push(`## Especificação Refinada\n${spec.content}`);
  if (requirements) docParts.push(`## Requisitos\n${requirements.content}`);
  if (planning) docParts.push(`## Planejamento\n${planning.content}`);
  if (ux) docParts.push(`## UX/UI\n${ux.content}`);
  if (proposal) docParts.push(`## Proposta\n${proposal.content}`);

  const uxData = columnData as { figmaUrl?: string; notes?: string; uxNotes?: string; inspirationUrls?: string[] };
  const uxNotesText = uxData.uxNotes ?? uxData.notes;
  const uxNotes = [
    uxData.figmaUrl ? `Figma: ${uxData.figmaUrl}` : "",
    uxNotesText ? `Notas UX: ${uxNotesText}` : "",
    uxData.inspirationUrls?.length
      ? `Inspirações: ${uxData.inspirationUrls.filter(Boolean).join(", ")}`
      : "",
  ]
    .filter(Boolean)
    .join("\n");

  return {
    project_name: project.title,
    initial_spec:
      [analise.overview, analise.objectives, analise.description, analise.notes]
        .filter(Boolean)
        .join("\n\n") || uxNotes || "[Não informado]",
    documents: docParts.length ? docParts.join("\n\n") : "[Nenhum documento gerado]",
    requirements: requirements?.content ?? "[Nenhum requisito]",
    planning: planning?.content ?? "[Nenhum planejamento]",
  };
}

export function resolveAgentForProject(
  process: AgentProcess,
  projectId?: string,
): ResolvedAgentConfig {
  const agent = getAgentByProcess(process);
  if (!agent) {
    throw new Error(`Agente não configurado para o processo ${process}`);
  }
  if (!agent.enabled) {
    throw new Error(`Agente "${agent.name}" está desativado`);
  }

  const context = projectId ? buildProjectContext(projectId) : {};
  return {
    agent,
    systemPrompt: resolvePromptTemplate(agent.systemPrompt, context),
    generationPrompt: agent.generationPrompt
      ? resolvePromptTemplate(agent.generationPrompt, context)
      : undefined,
    previewPrompt: agent.previewPrompt
      ? resolvePromptTemplate(agent.previewPrompt, context)
      : undefined,
  };
}

export function processFromColumnSlug(slug: string): AgentProcess {
  return COLUMN_SLUG_TO_PROCESS[slug] ?? "SPEC_REFINED";
}
