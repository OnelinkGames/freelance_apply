import { api } from "@/lib/api";
import type { AICostRecord, CostDashboard } from "@/types/costs";

export async function getCostDashboard(): Promise<CostDashboard> {
  return api<CostDashboard>("/ai-costs/dashboard");
}

export async function getCostHistory(limit = 100): Promise<AICostRecord[]> {
  return api<AICostRecord[]>(`/ai-costs/history?limit=${limit}`);
}
