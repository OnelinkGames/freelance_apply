export interface AISettings {
  provider: "OPENROUTER";
  hasApiKey: boolean;
  apiKeyMasked: string | null;
  defaultModel: string;
  usdToBrl: number;
  updatedAt: string | null;
}

export interface UpdateAISettingsInput {
  apiKey?: string;
  clearApiKey?: boolean;
  defaultModel?: string;
  usdToBrl?: number;
}

export interface OpenRouterModel {
  id: string;
  name: string;
  contextLength?: number | null;
  pricing?: {
    prompt?: string | null;
    completion?: string | null;
  } | null;
}
