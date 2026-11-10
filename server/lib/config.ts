import "dotenv/config";
import { getPublicAISettings } from "../services/aiSettingsService.js";

/** Configuração pública de IA (sem segredos em texto claro). Mantido para compatibilidade da API. */
export interface EnvConfig {
  provider: string;
  has_api_key: boolean;
  api_key_masked: string | null;
  default_model: string;
  usd_to_brl: number;
  /** @deprecated use default_model */
  openai_model: string;
  /** @deprecated */
  openai_api_key?: string | null;
  anthropic_api_key?: string | null;
  google_api_key?: string | null;
  deepseek_api_key?: string | null;
}

export function getPublicEnvConfig(): EnvConfig {
  const settings = getPublicAISettings();
  return {
    provider: settings.provider.toLowerCase(),
    has_api_key: settings.hasApiKey,
    api_key_masked: settings.apiKeyMasked,
    default_model: settings.defaultModel,
    usd_to_brl: settings.usdToBrl,
    openai_model: settings.defaultModel,
    openai_api_key: settings.apiKeyMasked,
    anthropic_api_key: null,
    google_api_key: null,
    deepseek_api_key: null,
  };
}
