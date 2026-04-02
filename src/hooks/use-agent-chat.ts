import { useState, useCallback, useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";

const CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/app-chat`;
const STREAM_UPDATE_INTERVAL_MS = 48;

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
  useGateway?: boolean;
  gatewayModel?: string;
  systemPrompt?: string;
  persistKey?: string;
  apiConfig?: ApiConfigParams;
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
      } catch {
        // ignore
      }
    }
    return initialMessages;
  });
  const [isStreaming, setIsStreaming] = useState(false);

  const messagesRef = useRef(messages);
  const pendingAssistantTextRef = useRef("");
  const flushTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    messagesRef.current = messages;
  }, [messages]);

  useEffect(() => {
    if (options.persistKey && messages.length > 0) {
      localStorage.setItem(options.persistKey, JSON.stringify(messages));
    }
  }, [messages, options.persistKey]);

  const flushAssistantMessage = useCallback((force = false) => {
    const commit = () => {
      flushTimerRef.current = null;
      const finalText = pendingAssistantTextRef.current;
      setMessages((prev) => {
        if (!prev.length) return prev;
        const lastMessage = prev[prev.length - 1];
        if (lastMessage?.role !== "agent") return prev;
        if (lastMessage.text === finalText) return prev;

        const next = [...prev];
        next[next.length - 1] = { role: "agent", text: finalText };
        return next;
      });
    };

    if (force) {
      if (flushTimerRef.current) {
        clearTimeout(flushTimerRef.current);
      }
      commit();
      return;
    }

    if (flushTimerRef.current) return;
    flushTimerRef.current = setTimeout(commit, STREAM_UPDATE_INTERVAL_MS);
  }, []);

  useEffect(() => {
    return () => {
      if (flushTimerRef.current) {
        clearTimeout(flushTimerRef.current);
      }
    };
  }, []);

  const sendMessage = useCallback(async (userText: string) => {
    if (!userText.trim() || isStreaming) return;

    const inferredProvider = deriveProvider(options.model);
    if (options.provider && inferredProvider && options.provider !== inferredProvider) {
      setMessages((prev) => [
        ...prev,
        {
          role: "agent",
          text: `⚠️ O modelo **${options.model}** não pertence ao provider **${options.provider}**. Ajuste a configuração antes de testar.`,
        },
      ]);
      return;
    }

    const userMsg: ChatMessage = { role: "user", text: userText };
    const nextMessages = [...messagesRef.current, userMsg];
    messagesRef.current = nextMessages;
    setMessages(nextMessages);
    setIsStreaming(true);

    const apiMessages: Array<{ role: string; content: string }> = nextMessages.map((m) => ({
      role: m.role === "agent" ? "assistant" : m.role,
      content: m.text,
    }));

    if (options.systemPrompt) {
      apiMessages.unshift({ role: "system", content: options.systemPrompt });
    }

    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      const accessToken = session?.access_token || import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

      let resp: Response | null = null;
      const maxRetries = 2;
      for (let attempt = 0; attempt <= maxRetries; attempt++) {
        const payload: Record<string, any> = {
          mode: "agent-chat",
          messages: apiMessages,
          useGateway: options.useGateway ?? false,
        };

        if (options.useGateway) {
          payload.model = options.gatewayModel || "google/gemini-2.5-flash";
        } else {
          payload.provider = options.provider || inferredProvider;
          payload.model = options.model;
          payload.agentContext = options.agentContext;
          if (options.apiConfig) {
            payload.temperature = options.apiConfig.temperature;
            payload.max_tokens = options.apiConfig.maxTokens;
            payload.top_p = options.apiConfig.topP;
            payload.frequency_penalty = options.apiConfig.frequencyPenalty;
            payload.presence_penalty = options.apiConfig.presencePenalty;
            payload.response_format = options.apiConfig.responseFormat === "json" ? { type: "json_object" } : undefined;
            payload.stop = options.apiConfig.stopSequences?.length ? options.apiConfig.stopSequences : undefined;
          }
        }

        resp = await fetch(CHAT_URL, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${accessToken}`,
          },
          body: JSON.stringify(payload),
        });
        if (resp.status !== 429 || attempt === maxRetries) break;
        const waitMs = (attempt + 1) * 2000;
        await new Promise((r) => setTimeout(r, waitMs));
      }

      if (!resp?.ok) {
        const err = await resp?.json().catch(() => ({ error: "Erro desconhecido" }));
        throw new Error(err?.error || `Erro ${resp?.status}`);
      }

      if (!resp.body) throw new Error("Sem resposta do servidor");

      const withPlaceholder = [...messagesRef.current, { role: "agent", text: "" } as ChatMessage];
      messagesRef.current = withPlaceholder;
      setMessages(withPlaceholder);
      pendingAssistantTextRef.current = "";

      const reader = resp.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

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
          if (jsonStr === "[DONE]") {
            flushAssistantMessage(true);
            continue;
          }

          try {
            const parsed = JSON.parse(jsonStr);
            const content = parsed.choices?.[0]?.delta?.content;
            if (content) {
              pendingAssistantTextRef.current += content;
              flushAssistantMessage();
            }
          } catch {
            // partial JSON, skip
          }
        }
      }

      flushAssistantMessage(true);
    } catch (e: any) {
      console.error("Agent chat error:", e);
      setMessages((prev) => [
        ...prev,
        { role: "agent", text: `⚠️ ${e.message || "Erro ao conectar com a IA."}` },
      ]);
    } finally {
      if (flushTimerRef.current) {
        clearTimeout(flushTimerRef.current);
        flushTimerRef.current = null;
      }
      setIsStreaming(false);
    }
  }, [isStreaming, options.provider, options.model, options.useGateway, options.gatewayModel, options.systemPrompt, options.apiConfig, options.agentContext, flushAssistantMessage]);

  return { messages, setMessages, sendMessage, isStreaming };
}

