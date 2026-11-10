import { desc, eq, sql } from "drizzle-orm";
import { v4 as uuidv4 } from "uuid";
import { db } from "../db/client.js";
import { aiCosts, projects } from "../db/schema.js";
import { calculateTokenCosts } from "../lib/modelPricing.js";
import { nowIso } from "../lib/utils.js";

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

export interface RecordCostInput {
  projectId: string;
  provider: string;
  model: string;
  process: AICostProcess;
  inputTokens: number;
  outputTokens: number;
  requestDurationMs: number;
}

export function recordCost(input: RecordCostInput): AICostRecord {
  const costs = calculateTokenCosts(input.model, input.inputTokens, input.outputTokens);
  const totalTokens = input.inputTokens + input.outputTokens;

  const record = {
    id: uuidv4(),
    createdAt: nowIso(),
    projectId: input.projectId,
    provider: input.provider,
    model: input.model,
    process: input.process,
    inputTokens: input.inputTokens,
    outputTokens: input.outputTokens,
    totalTokens,
    inputCost: costs.inputCost,
    outputCost: costs.outputCost,
    totalCost: costs.totalCost,
    requestDurationMs: input.requestDurationMs,
  };

  db.insert(aiCosts).values(record).run();
  return record;
}

function mapRow(row: typeof aiCosts.$inferSelect, projectName?: string): AICostRecord {
  return {
    id: row.id,
    createdAt: row.createdAt,
    projectId: row.projectId,
    projectName,
    provider: row.provider,
    model: row.model,
    process: row.process as AICostProcess,
    inputTokens: row.inputTokens,
    outputTokens: row.outputTokens,
    totalTokens: row.totalTokens,
    inputCost: row.inputCost,
    outputCost: row.outputCost,
    totalCost: row.totalCost,
    requestDurationMs: row.requestDurationMs,
  };
}

export function listHistory(limit = 100): AICostRecord[] {
  const rows = db
    .select({
      cost: aiCosts,
      projectTitle: projects.title,
    })
    .from(aiCosts)
    .leftJoin(projects, eq(aiCosts.projectId, projects.id))
    .orderBy(desc(aiCosts.createdAt))
    .limit(limit)
    .all();

  return rows.map((r) => mapRow(r.cost, r.projectTitle ?? undefined));
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

const PROCESS_LABELS: Record<AICostProcess, string> = {
  SPEC_REFINED: "Especificação Refinada",
  REQUIREMENTS: "Documento de Requisitos",
  PLANNING: "Planejamento",
  UX: "UX/UI",
  PROPOSAL: "Proposta Comercial",
};

function startOfDayIso(d: Date): string {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate()).toISOString();
}

function startOfMonthIso(d: Date): string {
  return new Date(d.getFullYear(), d.getMonth(), 1).toISOString();
}

export function getDashboard(): CostDashboard {
  const now = new Date();
  const dayStart = startOfDayIso(now);
  const monthStart = startOfMonthIso(now);

  const allRows = db.select().from(aiCosts).all();

  const totalCost = allRows.reduce((s, r) => s + r.totalCost, 0);
  const monthCost = allRows
    .filter((r) => r.createdAt >= monthStart)
    .reduce((s, r) => s + r.totalCost, 0);
  const dayCost = allRows
    .filter((r) => r.createdAt >= dayStart)
    .reduce((s, r) => s + r.totalCost, 0);
  const totalCalls = allRows.length;
  const totalTokens = allRows.reduce((s, r) => s + r.totalTokens, 0);

  const projectIds = new Set(allRows.map((r) => r.projectId));
  const documentProcesses = new Set<AICostProcess>([
    "SPEC_REFINED",
    "REQUIREMENTS",
    "PLANNING",
    "PROPOSAL",
  ]);
  const documentRows = allRows.filter((r) =>
    documentProcesses.has(r.process as AICostProcess),
  );

  const avgCostPerProject = projectIds.size > 0 ? totalCost / projectIds.size : 0;
  const avgCostPerDocument =
    documentRows.length > 0
      ? documentRows.reduce((s, r) => s + r.totalCost, 0) / documentRows.length
      : 0;

  const processMap = new Map<AICostProcess, number>();
  for (const row of allRows) {
    const p = row.process as AICostProcess;
    processMap.set(p, (processMap.get(p) ?? 0) + row.totalCost);
  }
  const byProcess = (Object.keys(PROCESS_LABELS) as AICostProcess[]).map((process) => ({
    process,
    label: PROCESS_LABELS[process],
    cost: processMap.get(process) ?? 0,
  }));

  const dayMap = new Map<string, number>();
  for (const row of allRows) {
    const date = row.createdAt.slice(0, 10);
    dayMap.set(date, (dayMap.get(date) ?? 0) + row.totalCost);
  }
  const byDay = [...dayMap.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .slice(-14)
    .map(([date, cost]) => ({ date, cost }));

  const projectCostRows = db
    .select({
      projectId: aiCosts.projectId,
      projectName: projects.title,
      cost: sql<number>`sum(${aiCosts.totalCost})`.mapWith(Number),
    })
    .from(aiCosts)
    .leftJoin(projects, eq(aiCosts.projectId, projects.id))
    .groupBy(aiCosts.projectId)
    .orderBy(desc(sql`sum(${aiCosts.totalCost})`))
    .all();

  const byProject = projectCostRows.map((r) => ({
    projectId: r.projectId,
    projectName: r.projectName ?? "Sem nome",
    cost: r.cost ?? 0,
  }));

  const modelRows = db
    .select({
      model: aiCosts.model,
      cost: sql<number>`sum(${aiCosts.totalCost})`.mapWith(Number),
    })
    .from(aiCosts)
    .groupBy(aiCosts.model)
    .orderBy(desc(sql`sum(${aiCosts.totalCost})`))
    .all();

  const byModel = modelRows.map((r) => ({
    model: r.model,
    cost: r.cost ?? 0,
  }));

  const allProjects = db.select().from(projects).all();
  const projectProfit = allProjects
    .map((p) => {
      const aiCost = allRows
        .filter((r) => r.projectId === p.id)
        .reduce((s, r) => s + r.totalCost, 0);
      const proposalValue = p.proposalValue ?? 0;
      return {
        projectId: p.id,
        projectName: p.title,
        proposalValue,
        aiCost,
        netProfit: proposalValue - aiCost,
      };
    })
    .filter((p) => p.aiCost > 0 || p.proposalValue > 0)
    .sort((a, b) => b.aiCost - a.aiCost);

  return {
    totalCost,
    monthCost,
    dayCost,
    totalCalls,
    totalTokens,
    avgCostPerProject,
    avgCostPerDocument,
    byProcess,
    byDay,
    byProject,
    byModel,
    projectProfit,
  };
}

export { PROCESS_LABELS };
