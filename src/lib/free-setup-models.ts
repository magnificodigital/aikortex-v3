export const GATEWAY_MODELS = [
  { value: "deepseek/deepseek-chat-v3-0324:free", label: "DeepSeek V3 (Grátis)" },
  { value: "meta-llama/llama-4-maverick:free", label: "Llama 4 Maverick (Grátis)" },
  { value: "qwen/qwen3-8b:free", label: "Qwen3 8B (Grátis)" },
  { value: "mistralai/mistral-7b-instruct:free", label: "Mistral 7B (Grátis)" },
] as const;

export const DEFAULT_FREE_SETUP_MODEL = GATEWAY_MODELS[0].value;

const gatewayModelValues = new Set<string>(GATEWAY_MODELS.map((model) => model.value));

export const normalizeFreeSetupModel = (model?: string | null) => {
  if (!model) return DEFAULT_FREE_SETUP_MODEL;
  return gatewayModelValues.has(model) ? model : DEFAULT_FREE_SETUP_MODEL;
};
