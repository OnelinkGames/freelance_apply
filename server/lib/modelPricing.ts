import { getUsdToBrl as readUsdToBrl } from "../services/aiSettingsService.js";

/** Preços por 1M tokens em USD (estimativa; OpenRouter varia por modelo) */
const DEFAULT_PRICING: Record<string, { input: number; output: number }> = {
  "gpt-4.1": { input: 2.0, output: 8.0 },
  "gpt-4.1-mini": { input: 0.4, output: 1.6 },
  "gpt-4o": { input: 2.5, output: 10.0 },
  "gpt-4o-mini": { input: 0.15, output: 0.6 },
  "gpt-5.5": { input: 5.0, output: 15.0 },
  "claude-sonnet-4": { input: 3.0, output: 15.0 },
  "gemini-2.5-pro": { input: 1.25, output: 10.0 },
  "deepseek-chat": { input: 0.27, output: 1.1 },
};

const FALLBACK = { input: 2.0, output: 8.0 };

function getUsdToBrl(): number {
  return readUsdToBrl();
}

function getPricing(model: string) {
  const normalized = model.toLowerCase();
  for (const [key, pricing] of Object.entries(DEFAULT_PRICING)) {
    if (normalized.includes(key.toLowerCase())) {
      return pricing;
    }
  }
  return FALLBACK;
}

export function calculateTokenCosts(
  model: string,
  inputTokens: number,
  outputTokens: number,
): { inputCost: number; outputCost: number; totalCost: number } {
  const pricing = getPricing(model);
  const usdToBrl = getUsdToBrl();

  const inputCostUsd = (inputTokens / 1_000_000) * pricing.input;
  const outputCostUsd = (outputTokens / 1_000_000) * pricing.output;

  const inputCost = inputCostUsd * usdToBrl;
  const outputCost = outputCostUsd * usdToBrl;

  return {
    inputCost: roundCost(inputCost),
    outputCost: roundCost(outputCost),
    totalCost: roundCost(inputCost + outputCost),
  };
}

function roundCost(value: number): number {
  return Math.round(value * 1_000_000) / 1_000_000;
}

export function formatBRL(value: number): string {
  return value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}
