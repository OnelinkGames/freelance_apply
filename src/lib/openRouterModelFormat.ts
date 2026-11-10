import type { OpenRouterModel } from "@/types/aiSettings";

/** OpenRouter envia preço em USD por token; exibimos por 1M tokens. */
export function formatUsdPerMillionTokens(raw: string | null | undefined): string {
  if (raw == null || raw === "") return "—";
  const perToken = Number(raw);
  if (!Number.isFinite(perToken)) return "—";
  const perMillion = perToken * 1_000_000;
  if (perMillion === 0) return "Grátis";
  if (perMillion < 0.01) return `$${perMillion.toFixed(4)}`;
  if (perMillion < 1) return `$${perMillion.toFixed(3)}`;
  return `$${perMillion.toFixed(2)}`;
}

export function formatContextLength(value: number | null | undefined): string {
  if (value == null || !Number.isFinite(value) || value <= 0) return "—";
  if (value >= 1_000_000) {
    const millions = value / 1_000_000;
    return `${Number.isInteger(millions) ? millions : millions.toFixed(1)}M tokens`;
  }
  if (value >= 1_000) {
    const thousands = value / 1_000;
    return `${Number.isInteger(thousands) ? thousands : thousands.toFixed(1)}k tokens`;
  }
  return `${value} tokens`;
}

export function getModelPricingLabels(model: OpenRouterModel | null | undefined): {
  input: string;
  output: string;
} {
  return {
    input: formatUsdPerMillionTokens(model?.pricing?.prompt),
    output: formatUsdPerMillionTokens(model?.pricing?.completion),
  };
}

export function findModelById(
  models: OpenRouterModel[],
  modelId: string,
): OpenRouterModel | undefined {
  return models.find((model) => model.id === modelId);
}
