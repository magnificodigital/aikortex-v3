export const GATEWAY_MODELS = [
  { value: "google/gemma-3-12b-it:free", label: "Gemma 3 12B (Grátis)" },
  { value: "meta-llama/llama-3.3-70b-instruct:free", label: "Llama 3.3 70B (Grátis)" },
  { value: "mistralai/mistral-small-3.1-24b-instruct:free", label: "Mistral Small 3.1 (Grátis)" },
  { value: "openai/gpt-oss-20b:free", label: "GPT OSS 20B (Grátis)" },
] as const;

export const DEFAULT_FREE_SETUP_MODEL = GATEWAY_MODELS[0].value;

const gatewayModelValues = new Set<string>(GATEWAY_MODELS.map((model) => model.value));

export const normalizeFreeSetupModel = (model?: string | null) => {
  if (!model) return DEFAULT_FREE_SETUP_MODEL;
  return gatewayModelValues.has(model) ? model : DEFAULT_FREE_SETUP_MODEL;
};
