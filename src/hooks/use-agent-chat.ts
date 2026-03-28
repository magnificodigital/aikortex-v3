import { useState, useCallback, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

const CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/agent-chat`;

export interface ChatMessage {
  role: "user" | "agent" | "assistant";
  text: string;
}

export interface ApiConfigParams {
  temperature?: number;
  maxTokens?: number;
  topP?: number;
  frequencyPenalty?: number;
  presencePenalty?: number;
  responseFormat?: "text" | "json";
  stopSequences?: string[];
}

export interface AgentChatContext {
  name: string;
  role?: string;
  companyName?: string;
  description?: string;
  objective?: string;
  instructions?: string;
  toneOfVoice?: string;
  greetingMessage?: string;
  memory?: string;
  channels?: string[];
  integrations?: string[];
  tools?: string[];
  knowledgeFiles?: string[];
  urls?: string[];
  provider?: string;
  model?: string;
  temperature?: number;
  maxTokens?: number;
  topP?: number;
  frequencyPenalty?: number;
  presencePenalty?: number;
  responseFormat?: "text" | "json";
  stopSequences?: string[];
}

interface UseAgentChatOptions {
  provider?: string;
  model?: string;
  /** When true, uses OpenRouter free model instead of requiring a user API key */
  useGateway?: boolean;
  /** Specific free model to use when useGateway is true */
  gatewayModel?: string;
  /** System prompt override */
  systemPrompt?: string;
  /** localStorage key to persist messages across reloads */
  persistKey?: string;
  /** Advanced API configuration */
  apiConfig?: ApiConfigParams;
  /** Agent runtime context mirrored on backend during test mode */
  agentContext?: AgentChatContext;
}

function deriveProvider(model?: string): string | undefined {
  if (!model) return undefined;
  if (model.startsWith("google/") || model.startsWith("gemini")) return "gemini";
  if (model.startsWith("openai/") || model.startsWith("gpt")) return "openai";
  if (model.startsWith("anthropic/") || model.startsWith("claude")) return "anthropic";
  if (model.includes("/")) return "openrouter";
  return undefined;
}

export function useAgentChat(initialMessages: ChatMessage[] = [], options: UseAgentChatOptions = {}) {
  const [messages, setMessages] = useState<ChatMessage[]>(() => {
    if (options.persistKey) {
      try {
        const stored = localStorage.getItem(options.persistKey);
        if (stored) {
          const parsed = JSON.parse(stored);
          if (Array.isArray(parsed) && parsed.length > 0) return parsed;
        }
      } catch { /* ignore */ }
    }
    return initialMessages;
  });
  const [isStreaming, setIsStreaming] = useState(false);

  // Persist messages to localStorage on change
  useEffect(() => {
    if (options.persistKey && messages.length > 0) {
      localStorage.setItem(options.persistKey, JSON.stringify(messages));
    }
  }, [messages, options.persistKey]);

  const sendMessage = useCallback(async (userText: string) => {
    if (!userText.trim() || isStreaming) return;

    const inferredProvider = deriveProvider(options.model);
    if (options.provider && inferredProvider && options.provider !== inferredProvider) {
      setMessages(prev => [
        ...prev,
        {
          role: "agent",
          text: `⚠️ O modelo **${options.model}** não pertence ao provider **${options.provider}**. Ajuste a configuração antes de testar.`,
        },
      ]);
      return;
    }

    const userMsg: ChatMessage = { role: "user", text: userText };
    setMessages(prev => [...prev, userMsg]);
    setIsStreaming(true);

    // Build messages array for API (convert our format to OpenAI format)
    const apiMessages: Array<{role: string; content: string}> = [...messages, userMsg].map(m => ({
      role: m.role === "agent" ? "assistant" : m.role,
      content: m.text,
    }));

    // Add system prompt if provided
    if (options.systemPrompt) {
      apiMessages.unshift({ role: "system", content: options.systemPrompt });
    }

    try {
      // Get user session token for auth
      const { data: { session } } = await supabase.auth.getSession();
      const accessToken = session?.access_token || import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

      const resp = await fetch(CHAT_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          messages: apiMessages,
          provider: options.provider || inferredProvider,
          model: options.model,
          useGateway: options.useGateway ?? false,
          gatewayModel: options.gatewayModel,
          agentContext: options.agentContext,
          ...(options.apiConfig && {
            temperature: options.apiConfig.temperature,
            max_tokens: options.apiConfig.maxTokens,
            top_p: options.apiConfig.topP,
            frequency_penalty: options.apiConfig.frequencyPenalty,
            presence_penalty: options.apiConfig.presencePenalty,
            response_format: options.apiConfig.responseFormat === "json" ? { type: "json_object" } : undefined,
            stop: options.apiConfig.stopSequences?.length ? options.apiConfig.stopSequences : undefined,
          }),
        }),
      });

      if (!resp.ok) {
        const err = await resp.json().catch(() => ({ error: "Erro desconhecido" }));
        throw new Error(err.error || `Erro ${resp.status}`);
      }

      if (!resp.body) throw new Error("Sem resposta do servidor");

      const reader = resp.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      let assistantText = "";

      // Add empty agent message
      setMessages(prev => [...prev, { role: "agent", text: "" }]);

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });

        let newlineIndex: number;
        while ((newlineIndex = buffer.indexOf("\n")) !== -1) {
          let line = buffer.slice(0, newlineIndex);
          buffer = buffer.slice(newlineIndex + 1);
          if (line.endsWith("\r")) line = line.slice(0, -1);
          if (!line.startsWith("data: ")) continue;

          const jsonStr = line.slice(6).trim();
          if (jsonStr === "[DONE]") break;

          try {
            const parsed = JSON.parse(jsonStr);
            const content = parsed.choices?.[0]?.delta?.content;
            if (content) {
              assistantText += content;
              const finalText = assistantText;
              setMessages(prev => {
                const arr = [...prev];
                arr[arr.length - 1] = { role: "agent", text: finalText };
                return arr;
              });
            }
          } catch {
            // partial JSON, skip
          }
        }
      }
    } catch (e: any) {
      console.error("Agent chat error:", e);
      setMessages(prev => [
        ...prev,
        { role: "agent", text: `⚠️ ${e.message || "Erro ao conectar com a IA."}` },
      ]);
    } finally {
      setIsStreaming(false);
    }
  }, [messages, isStreaming, options.provider, options.model, options.useGateway, options.gatewayModel, options.systemPrompt, options.apiConfig, options.agentContext]);

  return { messages, setMessages, sendMessage, isStreaming };
}
