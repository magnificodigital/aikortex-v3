export interface LLMModel {
  id: string;
  name: string;
  provider: string;
  byok: boolean;
}

export const LLM_MODELS: LLMModel[] = [
  // Anthropic (BYOK)
  { id: "claude-opus-4-6",             name: "Claude Opus 4",     provider: "anthropic", byok: true },
  { id: "claude-sonnet-4-6",           name: "Claude Sonnet 4.5", provider: "anthropic", byok: true },
  { id: "claude-haiku-4-5-20251001",   name: "Claude Haiku 4.5",  provider: "anthropic", byok: true },
  // OpenAI (BYOK)
  { id: "gpt-4o",                      name: "GPT-4o",            provider: "openai",    byok: true },
  { id: "gpt-4o-mini",                 name: "GPT-4o Mini",       provider: "openai",    byok: true },
  { id: "gpt-4-turbo",                 name: "GPT-4 Turbo",       provider: "openai",    byok: true },
  // Google (free via platform — uses Lovable AI Gateway)
  { id: "google/gemini-2.5-flash",     name: "Gemini 2.5 Flash",  provider: "google",    byok: false },
  { id: "google/gemini-2.5-pro",       name: "Gemini 2.5 Pro",    provider: "google",    byok: false },
  { id: "google/gemini-3-flash-preview", name: "Gemini 3 Flash",  provider: "google",    byok: false },
  { id: "google/gemini-3.1-pro-preview", name: "Gemini 3.1 Pro",  provider: "google",    byok: false },
  // DeepSeek (BYOK)
  { id: "deepseek/deepseek-chat",      name: "DeepSeek Chat",     provider: "deepseek",  byok: true },
  // Mistral (BYOK)
  { id: "mistralai/mistral-large",     name: "Mistral Large",     provider: "mistral",   byok: true },
];

export const PROVIDER_LABELS: Record<string, string> = {
  anthropic: "Anthropic",
  openai: "OpenAI",
  google: "Google",
  deepseek: "DeepSeek",
  mistral: "Mistral",
};

/** Group models by provider for grouped selects */
export function getGroupedModels() {
  const groups: { provider: string; label: string; models: LLMModel[] }[] = [];
  const seen = new Set<string>();
  for (const m of LLM_MODELS) {
    if (!seen.has(m.provider)) {
      seen.add(m.provider);
      groups.push({ provider: m.provider, label: PROVIDER_LABELS[m.provider] || m.provider, models: [] });
    }
    groups.find(g => g.provider === m.provider)!.models.push(m);
  }
  return groups;
}

export const DEFAULT_FREE_MODEL = "google/gemini-2.5-flash";

export function getProviderForModel(modelId: string): string {
  return LLM_MODELS.find(m => m.id === modelId)?.provider || "google";
}
