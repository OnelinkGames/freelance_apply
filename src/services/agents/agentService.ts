import { api } from "@/lib/api";
import type {
  AgentProcess,
  AgentTestResult,
  AIAgent,
  UpdateAgentInput,
} from "@/types/agents";

export async function listAgents(): Promise<AIAgent[]> {
  return api<AIAgent[]>("/agents");
}

export async function getAgent(id: string): Promise<AIAgent> {
  return api<AIAgent>(`/agents/${id}`);
}

export async function getAgentByProcess(process: AgentProcess): Promise<AIAgent> {
  return api<AIAgent>(`/agents/process/${process}`);
}

export async function updateAgent(id: string, input: UpdateAgentInput): Promise<AIAgent> {
  return api<AIAgent>(`/agents/${id}`, {
    method: "PATCH",
    body: JSON.stringify(input),
  });
}

export async function restoreAgent(id: string): Promise<AIAgent> {
  return api<AIAgent>(`/agents/${id}/restore`, { method: "POST" });
}

export async function testAgent(
  id: string,
  sampleInput: string,
  projectId?: string,
): Promise<AgentTestResult> {
  return api<AgentTestResult>(`/agents/${id}/test`, {
    method: "POST",
    body: JSON.stringify({ sampleInput, projectId }),
  });
}

export async function importAgentPrompt(id: string, markdown: string): Promise<AIAgent> {
  return api<AIAgent>(`/agents/${id}/import`, {
    method: "POST",
    body: JSON.stringify({ markdown }),
  });
}

export function exportAgentUrl(id: string): string {
  return `/api/agents/${id}/export`;
}

export async function completeWithAgent(input: {
  projectId: string;
  process: AgentProcess;
  prompt?: string;
  mode?: "default" | "generation" | "preview";
}): Promise<{ content: string }> {
  return api<{ content: string }>("/ai/complete", {
    method: "POST",
    body: JSON.stringify(input),
  });
}
