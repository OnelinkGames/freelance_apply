export const OPENROUTER_BASE_URL = "https://openrouter.ai/api/v1";
export const DEFAULT_OPENROUTER_MODEL = "openai/gpt-4.1-mini";

/** Modelos usados quando a API de listagem do OpenRouter estiver indisponível */
function pricing(promptPerMillion: number, completionPerMillion: number) {
  return {
    prompt: String(promptPerMillion / 1_000_000),
    completion: String(completionPerMillion / 1_000_000),
  };
}

export const FALLBACK_OPENROUTER_MODELS: OpenRouterModel[] = [
  {
    id: "openai/gpt-4.1-mini",
    name: "OpenAI: GPT-4.1 Mini",
    contextLength: 128000,
    pricing: pricing(0.4, 1.6),
  },
  {
    id: "openai/gpt-4.1",
    name: "OpenAI: GPT-4.1",
    contextLength: 128000,
    pricing: pricing(2.0, 8.0),
  },
  {
    id: "openai/gpt-4o",
    name: "OpenAI: GPT-4o",
    contextLength: 128000,
    pricing: pricing(2.5, 10.0),
  },
  {
    id: "openai/gpt-4o-mini",
    name: "OpenAI: GPT-4o Mini",
    contextLength: 128000,
    pricing: pricing(0.15, 0.6),
  },
  {
    id: "anthropic/claude-sonnet-4",
    name: "Anthropic: Claude Sonnet 4",
    contextLength: 200000,
    pricing: pricing(3.0, 15.0),
  },
  {
    id: "anthropic/claude-3.5-sonnet",
    name: "Anthropic: Claude 3.5 Sonnet",
    contextLength: 200000,
    pricing: pricing(3.0, 15.0),
  },
  {
    id: "google/gemini-2.5-pro",
    name: "Google: Gemini 2.5 Pro",
    contextLength: 1000000,
    pricing: pricing(1.25, 10.0),
  },
  {
    id: "google/gemini-2.0-flash-001",
    name: "Google: Gemini 2.0 Flash",
    contextLength: 1000000,
    pricing: pricing(0.1, 0.4),
  },
  {
    id: "deepseek/deepseek-chat",
    name: "DeepSeek: Chat",
    contextLength: 64000,
    pricing: pricing(0.27, 1.1),
  },
  {
    id: "meta-llama/llama-3.3-70b-instruct",
    name: "Meta: Llama 3.3 70B",
    contextLength: 128000,
    pricing: pricing(0.1, 0.32),
  },
  {
    id: "mistralai/mistral-large-2411",
    name: "Mistral: Large",
    contextLength: 128000,
    pricing: pricing(2.0, 6.0),
  },
];

export interface OpenRouterModel {
  id: string;
  name: string;
  contextLength?: number | null;
  pricing?: {
    prompt?: string | null;
    completion?: string | null;
  } | null;
}

interface OpenRouterModelsResponse {
  data?: Array<{
    id: string;
    name?: string;
    context_length?: number;
    pricing?: {
      prompt?: string;
      completion?: string;
    };
  }>;
}

export async function fetchOpenRouterModels(apiKey?: string | null): Promise<OpenRouterModel[]> {
  const headers: Record<string, string> = {
    Accept: "application/json",
  };
  if (apiKey) {
    headers.Authorization = `Bearer ${apiKey}`;
  }

  const response = await fetch(`${OPENROUTER_BASE_URL}/models`, { headers });
  if (!response.ok) {
    throw new Error(`Falha ao listar modelos OpenRouter (${response.status})`);
  }

  const json = (await response.json()) as OpenRouterModelsResponse;
  const models = (json.data ?? [])
    .filter((m) => Boolean(m.id))
    .map((m) => ({
      id: m.id,
      name: m.name || m.id,
      contextLength: m.context_length ?? null,
      pricing: m.pricing
        ? {
            prompt: m.pricing.prompt ?? null,
            completion: m.pricing.completion ?? null,
          }
        : null,
    }))
    .sort((a, b) => a.name.localeCompare(b.name, "en"));

  return models.length > 0 ? models : FALLBACK_OPENROUTER_MODELS;
}

export function normalizeToOpenRouterModelId(model: string, fallback = DEFAULT_OPENROUTER_MODEL): string {
  const trimmed = model.trim();
  if (!trimmed) return fallback;
  if (trimmed.includes("/")) return trimmed;

  const known: Record<string, string> = {
    "gpt-4.1": "openai/gpt-4.1",
    "gpt-4.1-mini": "openai/gpt-4.1-mini",
    "gpt-4o": "openai/gpt-4o",
    "gpt-4o-mini": "openai/gpt-4o-mini",
    "claude-sonnet-4": "anthropic/claude-sonnet-4",
    "gemini-2.5-pro": "google/gemini-2.5-pro",
    "deepseek-chat": "deepseek/deepseek-chat",
  };

  return known[trimmed.toLowerCase()] ?? `openai/${trimmed}`;
}
