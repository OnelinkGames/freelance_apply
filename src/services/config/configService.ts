import { api } from "@/lib/api";
import type { AISettings, OpenRouterModel, UpdateAISettingsInput } from "@/types/aiSettings";
import type { EnvConfig } from "@/types/project";

export async function readEnvConfig(): Promise<EnvConfig> {
  return api<EnvConfig>("/config");
}

export async function getAISettings(): Promise<AISettings> {
  return api<AISettings>("/config/ai");
}

export async function updateAISettings(input: UpdateAISettingsInput): Promise<AISettings> {
  return api<AISettings>("/config/ai", {
    method: "PUT",
    body: JSON.stringify(input),
  });
}

export async function listAIModels(): Promise<OpenRouterModel[]> {
  const result = await api<{ models: OpenRouterModel[] }>("/config/ai/models");
  return result.models;
}

export async function getAppDataDir(): Promise<string> {
  const result = await api<{ path: string }>("/config/data-dir");
  return result.path;
}

export interface TestConnectionResult {
  ok: boolean;
  provider: "openrouter";
  model: string;
  message?: string;
  error?: string;
}

export async function testConnection(input?: {
  apiKey?: string;
  model?: string;
}): Promise<TestConnectionResult> {
  return api<TestConnectionResult>("/config/test", {
    method: "POST",
    body: JSON.stringify(input ?? {}),
  });
}
