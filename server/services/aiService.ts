import OpenAI from "openai";
import {
  DEFAULT_OPENROUTER_MODEL,
  OPENROUTER_BASE_URL,
  normalizeToOpenRouterModelId,
} from "../lib/openRouter.js";
import {
  getDecryptedApiKey,
  getDefaultModel,
} from "./aiSettingsService.js";
import {
  recordCost,
  type AICostProcess,
  type RecordCostInput,
} from "./costTrackerService.js";

export interface ChatOptions {
  systemPrompt?: string;
  temperature?: number;
  maxTokens?: number;
  model?: string;
  provider?: string;
}

export interface CostContext {
  projectId: string;
  process: AICostProcess;
}

export interface ChatMessage {
  role: "user" | "assistant" | "system";
  content: string;
}

export interface AIUsage {
  provider: string;
  model: string;
  inputTokens: number;
  outputTokens: number;
  totalTokens: number;
  requestDurationMs: number;
}

export interface AIResult {
  content: string;
  usage: AIUsage;
}

let cachedClient: { key: string; client: OpenAI } | null = null;

function requireApiKey(): string {
  const apiKey = getDecryptedApiKey();
  if (!apiKey) {
    throw new Error(
      "Chave OpenRouter não configurada. Abra Configurações → IA → Credenciais e informe sua API key.",
    );
  }
  return apiKey;
}

function createOpenRouterClient(apiKey: string): OpenAI {
  return new OpenAI({
    apiKey,
    baseURL: OPENROUTER_BASE_URL,
    defaultHeaders: {
      "HTTP-Referer": "https://github.com/freelance-flow",
      "X-Title": "Freelance Flow",
    },
  });
}

function getOpenRouterClient(): OpenAI {
  const apiKey = requireApiKey();
  if (cachedClient && cachedClient.key === apiKey) {
    return cachedClient.client;
  }

  const client = createOpenRouterClient(apiKey);
  cachedClient = { key: apiKey, client };
  return client;
}

export interface TestConnectionInput {
  apiKey?: string | null;
  model?: string | null;
}

export interface TestConnectionResult {
  ok: boolean;
  provider: "openrouter";
  model: string;
  message?: string;
  error?: string;
}

function resolveModel(options?: ChatOptions): string {
  const requested = options?.model?.trim();
  if (requested) {
    return normalizeToOpenRouterModelId(requested, getDefaultModel());
  }
  return normalizeToOpenRouterModelId(getDefaultModel(), DEFAULT_OPENROUTER_MODEL);
}

export function resetAIClient() {
  cachedClient = null;
}

function trackUsage(usage: AIUsage, context?: CostContext): void {
  if (!context?.projectId) return;

  const input: RecordCostInput = {
    projectId: context.projectId,
    provider: usage.provider,
    model: usage.model,
    process: context.process,
    inputTokens: usage.inputTokens,
    outputTokens: usage.outputTokens,
    requestDurationMs: usage.requestDurationMs,
  };

  recordCost(input);
}

function extractUsage(
  response: OpenAI.Chat.Completions.ChatCompletion,
  modelName: string,
  durationMs: number,
): AIUsage {
  const inputTokens = response.usage?.prompt_tokens ?? 0;
  const outputTokens = response.usage?.completion_tokens ?? 0;
  return {
    provider: "openrouter",
    model: modelName,
    inputTokens,
    outputTokens,
    totalTokens: inputTokens + outputTokens,
    requestDurationMs: durationMs,
  };
}

async function callChat(
  inputMessages: ChatMessage[],
  options?: ChatOptions,
): Promise<{ response: OpenAI.Chat.Completions.ChatCompletion; model: string; durationMs: number }> {
  const client = getOpenRouterClient();
  const model = resolveModel(options);
  const messages: OpenAI.Chat.Completions.ChatCompletionMessageParam[] = [];

  if (options?.systemPrompt) {
    messages.push({ role: "system", content: options.systemPrompt });
  }

  for (const message of inputMessages.slice(-20)) {
    messages.push({ role: message.role, content: message.content });
  }

  const start = Date.now();
  const response = await client.chat.completions.create({
    model,
    messages,
    temperature: options?.temperature ?? 0.4,
    max_tokens: options?.maxTokens,
  });

  return { response, model, durationMs: Date.now() - start };
}

async function callComplete(
  prompt: string,
  options?: ChatOptions,
): Promise<{ response: OpenAI.Chat.Completions.ChatCompletion; model: string; durationMs: number }> {
  const client = getOpenRouterClient();
  const model = resolveModel(options);

  const start = Date.now();
  const response = await client.chat.completions.create({
    model,
    messages: [
      ...(options?.systemPrompt
        ? [{ role: "system" as const, content: options.systemPrompt }]
        : []),
      { role: "user", content: prompt },
    ],
    temperature: options?.temperature ?? 0.3,
    max_tokens: options?.maxTokens,
  });

  return { response, model, durationMs: Date.now() - start };
}

export async function chatComplete(
  inputMessages: ChatMessage[],
  options?: ChatOptions,
  context?: CostContext,
): Promise<AIResult> {
  const { response, model, durationMs } = await callChat(inputMessages, options);
  const usage = extractUsage(response, model, durationMs);
  trackUsage(usage, context);

  return {
    content: response.choices[0]?.message?.content ?? "",
    usage,
  };
}

export async function complete(
  prompt: string,
  options?: ChatOptions,
  context?: CostContext,
): Promise<AIResult> {
  const { response, model, durationMs } = await callComplete(prompt, options);
  const usage = extractUsage(response, model, durationMs);
  trackUsage(usage, context);

  return {
    content: response.choices[0]?.message?.content ?? "",
    usage,
  };
}

export async function testConnection(
  input: TestConnectionInput = {},
): Promise<TestConnectionResult> {
  const apiKey = input.apiKey?.trim() || getDecryptedApiKey();
  const model = normalizeToOpenRouterModelId(
    input.model?.trim() || getDefaultModel(),
    DEFAULT_OPENROUTER_MODEL,
  );

  if (!apiKey) {
    return {
      ok: false,
      provider: "openrouter",
      model,
      error:
        "Informe uma chave OpenRouter (no campo ou salva nas configurações) para testar a conexão.",
    };
  }

  try {
    const client = createOpenRouterClient(apiKey);
    const response = await client.chat.completions.create({
      model,
      messages: [{ role: "user", content: "Responda apenas: ok" }],
      max_tokens: 8,
      temperature: 0,
    });

    const content = response.choices[0]?.message?.content?.trim();
    if (!content && !response.id) {
      return {
        ok: false,
        provider: "openrouter",
        model,
        error: "OpenRouter respondeu sem conteúdo. Verifique o modelo selecionado.",
      };
    }

    return {
      ok: true,
      provider: "openrouter",
      model,
      message: `OpenRouter OK · modelo ${model}`,
    };
  } catch (err) {
    return {
      ok: false,
      provider: "openrouter",
      model,
      error: formatOpenRouterTestError(err, model),
    };
  }
}

function formatOpenRouterTestError(err: unknown, model: string): string {
  if (!err || typeof err !== "object") {
    return `Falha ao testar o modelo "${model}" no OpenRouter.`;
  }

  const anyErr = err as {
    status?: number;
    statusCode?: number;
    code?: string;
    message?: string;
    error?: { message?: string; code?: string; type?: string };
  };

  const status = anyErr.status ?? anyErr.statusCode;
  const detail =
    anyErr.error?.message?.trim() ||
    anyErr.message?.trim() ||
    "erro desconhecido";
  const code = anyErr.error?.code || anyErr.code;

  if (status === 401 || status === 403) {
    return `Chave OpenRouter inválida ou sem permissão (${status}). Gere uma nova chave em https://openrouter.ai/keys`;
  }
  if (status === 402) {
    return `Créditos insuficientes na conta OpenRouter (${status}). Adicione créditos em https://openrouter.ai/settings/credits`;
  }
  if (status === 404) {
    return `Modelo "${model}" não encontrado no OpenRouter. Escolha outro modelo na lista.`;
  }
  if (status === 429) {
    return `Limite de requisições excedido no OpenRouter (${status}). Aguarde e tente novamente.`;
  }
  if (status && status >= 500) {
    return `OpenRouter indisponível no momento (${status}). Tente novamente em instantes.`;
  }
  if (/fetch failed|ECONNREFUSED|ENOTFOUND|network/i.test(detail)) {
    return `Não foi possível alcançar o OpenRouter. Verifique sua conexão com a internet.`;
  }

  const statusPart = status ? `HTTP ${status}` : "erro";
  const codePart = code ? ` · ${code}` : "";
  return `Falha ao testar "${model}" no OpenRouter (${statusPart}${codePart}): ${detail}`;
}

export async function testConnectionForProvider(_providerName: string): Promise<TestConnectionResult> {
  return testConnection();
}
