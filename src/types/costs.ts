export type AICostProcess = "SPEC_REFINED" | "REQUIREMENTS" | "PLANNING" | "UX" | "PROPOSAL";

export interface AICostRecord {
  id: string;
  createdAt: string;
  projectId: string;
  projectName?: string;
  provider: string;
  model: string;
  process: AICostProcess;
  inputTokens: number;
  outputTokens: number;
  totalTokens: number;
  inputCost: number;
  outputCost: number;
  totalCost: number;
  requestDurationMs: number;
}

export interface CostDashboard {
  totalCost: number;
  monthCost: number;
  dayCost: number;
  totalCalls: number;
  totalTokens: number;
  avgCostPerProject: number;
  avgCostPerDocument: number;
  byProcess: { process: AICostProcess; label: string; cost: number }[];
  byDay: { date: string; cost: number }[];
  byProject: { projectId: string; projectName: string; cost: number }[];
  byModel: { model: string; cost: number }[];
  projectProfit: {
    projectId: string;
    projectName: string;
    proposalValue: number;
    aiCost: number;
    netProfit: number;
  }[];
}

export const PROCESS_LABELS: Record<AICostProcess, string> = {
  SPEC_REFINED: "Especificação Refinada",
  REQUIREMENTS: "Documento de Requisitos",
  PLANNING: "Planejamento",
  UX: "UX/UI",
  PROPOSAL: "Proposta Comercial",
};
