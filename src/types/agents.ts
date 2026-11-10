export type AgentProcess = "SPEC_REFINED" | "REQUIREMENTS" | "PLANNING" | "UX" | "PROPOSAL";

export type AgentProvider = "OPENROUTER";

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

export interface AgentTestResult {
  finalPrompt: string;
  response: string;
  usage: {
    provider: string;
    model: string;
    inputTokens: number;
    outputTokens: number;
    totalTokens: number;
    requestDurationMs: number;
  };
  estimatedCostBRL: number;
}

export const AGENT_PROCESS_LABELS: Record<AgentProcess, string> = {
  SPEC_REFINED: "Especificação Refinada",
  REQUIREMENTS: "Documento de Requisitos",
  PLANNING: "Planejamento",
  UX: "UX/UI",
  PROPOSAL: "Proposta Comercial",
};

export const AGENT_PROVIDER_LABELS: Record<AgentProvider, string> = {
  OPENROUTER: "OpenRouter",
};

export const COLUMN_SLUG_TO_PROCESS: Record<string, AgentProcess> = {
  "especificacao-refinada": "SPEC_REFINED",
  "documento-requisitos": "REQUIREMENTS",
  planejamento: "PLANNING",
  "ux-ui": "UX",
  "proposta-comercial": "PROPOSAL",
};
