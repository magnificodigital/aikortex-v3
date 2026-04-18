export interface LLMModel {
  id: string;
  name: string;
  provider: string;
  byok: boolean;
}

export const LLM_MODELS: LLMModel[] = [
  // ── ANTHROPIC (BYOK) ──
  { id: 'claude-opus-4-7',            name: 'Claude Opus 4.7',       provider: 'anthropic', byok: true },
  { id: 'claude-opus-4-6',            name: 'Claude Opus 4.6',       provider: 'anthropic', byok: true },
  { id: 'claude-sonnet-4-6',          name: 'Claude Sonnet 4.6',     provider: 'anthropic', byok: true },
  { id: 'claude-haiku-4-5-20251001',  name: 'Claude Haiku 4.5',      provider: 'anthropic', byok: true },
  { id: 'claude-3-5-sonnet-20241022', name: 'Claude 3.5 Sonnet',     provider: 'anthropic', byok: true },

  // ── OPENAI (BYOK) ──
  { id: 'gpt-4.1',        name: 'GPT-4.1',        provider: 'openai', byok: true },
  { id: 'gpt-4.1-mini',   name: 'GPT-4.1 Mini',   provider: 'openai', byok: true },
  { id: 'gpt-4.1-nano',   name: 'GPT-4.1 Nano',   provider: 'openai', byok: true },
  { id: 'gpt-4o',         name: 'GPT-4o',          provider: 'openai', byok: true },
  { id: 'gpt-4o-mini',    name: 'GPT-4o Mini',     provider: 'openai', byok: true },

  // ── GOOGLE GEMINI (BYOK) ──
  { id: 'gemini-2.5-pro-preview-05-06',   name: 'Gemini 2.5 Pro',        provider: 'gemini', byok: true },
  { id: 'gemini-2.5-flash-preview-04-17', name: 'Gemini 2.5 Flash',      provider: 'gemini', byok: true },
  { id: 'gemini-2.0-flash-001',           name: 'Gemini 2.0 Flash',      provider: 'gemini', byok: true },
  { id: 'gemini-2.0-flash-lite-001',      name: 'Gemini 2.0 Flash Lite', provider: 'gemini', byok: true },
  { id: 'gemini-1.5-pro',                 name: 'Gemini 1.5 Pro',        provider: 'gemini', byok: true },

  // ── QWEN (free via OpenRouter) ──
  { id: 'qwen/qwen3-30b-a3b',   name: 'Qwen3 30B',  provider: 'qwen', byok: false },
  { id: 'qwen/qwen3-14b:free',  name: 'Qwen3 14B',  provider: 'qwen', byok: false },

  // ── DEEPSEEK (free via OpenRouter) ──
  { id: 'deepseek/deepseek-chat-v3-0324:free', name: 'DeepSeek V3',  provider: 'deepseek', byok: false },
  { id: 'deepseek/deepseek-r1:free',           name: 'DeepSeek R1',  provider: 'deepseek', byok: false },

  // ── GOOGLE GEMMA (free via OpenRouter) ──
  { id: 'google/gemma-3-27b-it:free', name: 'Gemma 3 27B', provider: 'google', byok: false },
  { id: 'google/gemma-3-12b-it:free', name: 'Gemma 3 12B', provider: 'google', byok: false },
];

export const PROVIDER_LABELS: Record<string, string> = {
  anthropic: "Anthropic",
  openai:    "OpenAI",
  gemini:    "Google Gemini",
  google:    "Google Gemma (free)",
  deepseek:  "DeepSeek (free)",
  qwen:      "Qwen (free)",
};

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

export const DEFAULT_FREE_MODEL = "qwen/qwen3-30b-a3b";

export function getProviderForModel(modelId: string): string {
  return LLM_MODELS.find(m => m.id === modelId)?.provider || "qwen";
}

export function isOpenRouterModel(modelId: string): boolean {
  return modelId.includes("/");
}
