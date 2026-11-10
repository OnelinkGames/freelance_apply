import { eq } from "drizzle-orm";
import { db } from "../db/client.js";
import { aiSettings } from "../db/schema.js";
import { decryptSecret, encryptSecret, maskApiKey } from "../lib/crypto.js";
import {
  DEFAULT_OPENROUTER_MODEL,
  FALLBACK_OPENROUTER_MODELS,
  fetchOpenRouterModels,
  type OpenRouterModel,
} from "../lib/openRouter.js";

const SETTINGS_ID = "default";

export interface PublicAISettings {
  provider: "OPENROUTER";
  hasApiKey: boolean;
  apiKeyMasked: string | null;
  defaultModel: string;
  usdToBrl: number;
  updatedAt: string | null;
}

export interface UpdateAISettingsInput {
  apiKey?: string | null;
  clearApiKey?: boolean;
  defaultModel?: string;
  usdToBrl?: number;
}

function nowIso(): string {
  return new Date().toISOString();
}

function ensureRow() {
  const existing = db.select().from(aiSettings).where(eq(aiSettings.id, SETTINGS_ID)).get();
  if (existing) return existing;

  const updatedAt = nowIso();
  db.insert(aiSettings)
    .values({
      id: SETTINGS_ID,
      provider: "OPENROUTER",
      apiKeyEncrypted: null,
      defaultModel: DEFAULT_OPENROUTER_MODEL,
      usdToBrl: 5.5,
      updatedAt,
    })
    .run();

  return db.select().from(aiSettings).where(eq(aiSettings.id, SETTINGS_ID)).get()!;
}

export function getPublicAISettings(): PublicAISettings {
  const row = ensureRow();
  let apiKeyMasked: string | null = null;
  if (row.apiKeyEncrypted) {
    try {
      apiKeyMasked = maskApiKey(decryptSecret(row.apiKeyEncrypted));
    } catch {
      apiKeyMasked = "****";
    }
  }

  return {
    provider: "OPENROUTER",
    hasApiKey: Boolean(row.apiKeyEncrypted),
    apiKeyMasked,
    defaultModel: row.defaultModel || DEFAULT_OPENROUTER_MODEL,
    usdToBrl: row.usdToBrl ?? 5.5,
    updatedAt: row.updatedAt ?? null,
  };
}

export function getDecryptedApiKey(): string | null {
  const row = ensureRow();
  if (!row.apiKeyEncrypted) return null;
  try {
    return decryptSecret(row.apiKeyEncrypted);
  } catch {
    throw new Error("Não foi possível descriptografar a chave de API. Reconfigure em Configurações.");
  }
}

export function getDefaultModel(): string {
  return ensureRow().defaultModel || DEFAULT_OPENROUTER_MODEL;
}

export function getUsdToBrl(): number {
  const value = ensureRow().usdToBrl;
  return Number.isFinite(value) && value > 0 ? value : 5.5;
}

export function updateAISettings(input: UpdateAISettingsInput): PublicAISettings {
  const current = ensureRow();
  const updatedAt = nowIso();

  let apiKeyEncrypted = current.apiKeyEncrypted;
  if (input.clearApiKey) {
    apiKeyEncrypted = null;
  } else if (typeof input.apiKey === "string") {
    const trimmed = input.apiKey.trim();
    if (trimmed) {
      apiKeyEncrypted = encryptSecret(trimmed);
    }
  }

  const defaultModel =
    typeof input.defaultModel === "string" && input.defaultModel.trim()
      ? input.defaultModel.trim()
      : current.defaultModel;

  let usdToBrl = current.usdToBrl;
  if (typeof input.usdToBrl === "number" && Number.isFinite(input.usdToBrl) && input.usdToBrl > 0) {
    usdToBrl = input.usdToBrl;
  }

  db.update(aiSettings)
    .set({
      provider: "OPENROUTER",
      apiKeyEncrypted,
      defaultModel,
      usdToBrl,
      updatedAt,
    })
    .where(eq(aiSettings.id, SETTINGS_ID))
    .run();

  return getPublicAISettings();
}

export async function listAvailableModels(): Promise<OpenRouterModel[]> {
  const apiKey = getDecryptedApiKey();
  try {
    return await fetchOpenRouterModels(apiKey);
  } catch {
    return FALLBACK_OPENROUTER_MODELS;
  }
}
