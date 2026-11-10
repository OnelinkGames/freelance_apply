import fs from "node:fs";
import path from "node:path";

export interface AgentMarkdownDefaults {
  systemPrompt: string;
  temperature?: number;
  maxTokens?: number;
  generationPrompt?: string;
  previewPrompt?: string;
}

export interface AgentSeedDefinition {
  id: string;
  name: string;
  process: AgentProcess;
  filename: string;
}

export type AgentProcess =
  | "SPEC_REFINED"
  | "REQUIREMENTS"
  | "PLANNING"
  | "UX"
  | "PROPOSAL";

export type AgentProvider = "OPENROUTER";

export const AGENT_SEEDS: AgentSeedDefinition[] = [
  { id: "agent-spec-refined", name: "Especificação Refinada", process: "SPEC_REFINED", filename: "spec-refined.md" },
  { id: "agent-requirements", name: "Documento de Requisitos", process: "REQUIREMENTS", filename: "requirements.md" },
  { id: "agent-planning", name: "Planejamento", process: "PLANNING", filename: "planning.md" },
  { id: "agent-ux", name: "UX/UI", process: "UX", filename: "ux.md" },
  { id: "agent-proposal", name: "Proposta Comercial", process: "PROPOSAL", filename: "proposal.md" },
];

export const PROCESS_LABELS: Record<AgentProcess, string> = {
  SPEC_REFINED: "Especificação Refinada",
  REQUIREMENTS: "Documento de Requisitos",
  PLANNING: "Planejamento",
  UX: "UX/UI",
  PROPOSAL: "Proposta Comercial",
};

export const COLUMN_SLUG_TO_PROCESS: Record<string, AgentProcess> = {
  "especificacao-refinada": "SPEC_REFINED",
  "documento-requisitos": "REQUIREMENTS",
  planejamento: "PLANNING",
  "ux-ui": "UX",
  "proposta-comercial": "PROPOSAL",
};

export function getAgentsDir(): string {
  return path.join(process.cwd(), "agents");
}

export function loadAgentMarkdown(filename: string): AgentMarkdownDefaults {
  const filePath = path.join(getAgentsDir(), filename);
  const raw = fs.readFileSync(filePath, "utf-8");
  return parseAgentMarkdown(raw);
}

export function parseAgentMarkdown(raw: string): AgentMarkdownDefaults {
  const trimmed = raw.trimStart();
  if (!trimmed.startsWith("---")) {
    return { systemPrompt: raw.trim() };
  }

  const end = trimmed.indexOf("---", 3);
  if (end === -1) {
    return { systemPrompt: raw.trim() };
  }

  const frontmatter = trimmed.slice(3, end).trim();
  const body = trimmed.slice(end + 3).trim();
  const meta = parseSimpleFrontmatter(frontmatter);

  return {
    systemPrompt: body,
    temperature: meta.temperature !== undefined ? Number(meta.temperature) : undefined,
    maxTokens: meta.maxTokens !== undefined ? Number(meta.maxTokens) : undefined,
    generationPrompt: meta.generationPrompt,
    previewPrompt: meta.previewPrompt,
  };
}

function parseSimpleFrontmatter(source: string): Record<string, string | number> {
  const result: Record<string, string | number> = {};
  const lines = source.split("\n");
  let key: string | null = null;
  let block: string[] = [];

  function flushBlock() {
    if (!key) return;
    const value = block.join("\n").trim();
    if (key === "temperature" || key === "maxTokens") {
      result[key] = Number(value);
    } else {
      result[key] = value;
    }
    key = null;
    block = [];
  }

  for (const line of lines) {
    const scalar = line.match(/^(\w+):\s*(.*)$/);
    if (scalar) {
      flushBlock();
      const [, k, v] = scalar;
      const trimmedValue = v.trim();
      if (!trimmedValue || trimmedValue === "|" || trimmedValue === ">") {
        key = k;
        block = [];
      } else {
        if (k === "temperature" || k === "maxTokens") {
          result[k] = Number(trimmedValue);
        } else {
          result[k] = trimmedValue;
        }
        key = null;
      }
      continue;
    }

    if (key) {
      block.push(line);
    }
  }

  flushBlock();
  return result;
}

export function exportAgentMarkdown(data: AgentMarkdownDefaults & { name?: string }): string {
  const lines = ["---"];
  if (data.temperature !== undefined) lines.push(`temperature: ${data.temperature}`);
  if (data.maxTokens !== undefined) lines.push(`maxTokens: ${data.maxTokens}`);
  if (data.previewPrompt) {
    lines.push("previewPrompt: |");
    lines.push(...data.previewPrompt.split("\n").map((l) => `  ${l}`));
  }
  if (data.generationPrompt) {
    lines.push("generationPrompt: |");
    lines.push(...data.generationPrompt.split("\n").map((l) => `  ${l}`));
  }
  lines.push("---");
  lines.push(data.systemPrompt);
  return lines.join("\n");
}
