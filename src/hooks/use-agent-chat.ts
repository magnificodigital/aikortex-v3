import { useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

const CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/agent-chat`;

export interface ChatMessage {
  role: "user" | "agent" | "assistant";
  text: string;
}

interface UseAgentChatOptions {
  provider?: string;
  model?: string;
  /** When true, uses the free Lovable AI gateway instead of requiring a user API key */
  useGateway?: boolean;
  /** System prompt override */
  systemPrompt?: string;
}

function deriveProvider(model?: string): string {
  if (!model) return "openai";
  if (model.startsWith("gemini")) return "gemini";
  if (model.startsWith("gpt")) return "openai";
  return "openai";
}

export function useAgentChat(initialMessages: ChatMessage[] = [], options: UseAgentChatOptions = {}) {
  const [messages, setMessages] = useState<ChatMessage[]>(initialMessages);
  const [isStreaming, setIsStreaming] = useState(false);

  const sendMessage = useCallback(async (userText: string) => {
    if (!userText.trim() || isStreaming) return;

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
          provider: options.provider || deriveProvider(options.model),
          model: options.model,
          useGateway: options.useGateway ?? false,
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
  }, [messages, isStreaming, options.provider, options.model, options.useGateway, options.systemPrompt]);

  return { messages, setMessages, sendMessage, isStreaming };
}
