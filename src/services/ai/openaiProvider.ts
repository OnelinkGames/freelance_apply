import { api } from "@/lib/api";
import { testConnection as testApiConnection } from "@/services/config/configService";
import { sendChatMessage } from "@/services/ai/aiConversationService";
import type { AgentProcess } from "@/types/agents";
import type { AICostProcess } from "@/types/costs";
import type { AIMessage } from "@/types/project";

export interface ChatOptions {
  systemPrompt?: string;
  temperature?: number;
  projectId?: string;
  process?: AICostProcess | AgentProcess;
  mode?: "default" | "generation" | "preview";
}

export interface AIProvider {
  chat(
    messages: Pick<AIMessage, "role" | "content">[],
    options?: ChatOptions,
  ): AsyncIterable<string>;
  complete(prompt: string, options?: ChatOptions): Promise<string>;
  testConnection(): Promise<boolean>;
}

class ApiAIProvider implements AIProvider {
  private conversationId: string | null = null;

  setConversationId(id: string) {
    this.conversationId = id;
  }

  async *chat(
    inputMessages: Pick<AIMessage, "role" | "content">[],
    options?: ChatOptions,
  ): AsyncIterable<string> {
    if (!this.conversationId) {
      throw new Error("Conversation ID não definido");
    }

    const lastUser = [...inputMessages].reverse().find((m) => m.role === "user");
    if (!lastUser) {
      throw new Error("Nenhuma mensagem do usuário");
    }

    const assistant = await sendChatMessage(
      this.conversationId,
      lastUser.content,
      options?.process as AgentProcess | undefined,
    );

    yield assistant.content;
  }

  async complete(prompt: string, options?: ChatOptions): Promise<string> {
    if (!options?.projectId || !options?.process) {
      throw new Error("projectId e process são obrigatórios para chamadas de IA");
    }

    const result = await api<{ content: string }>("/ai/complete", {
      method: "POST",
      body: JSON.stringify({
        prompt,
        systemPrompt: options?.systemPrompt,
        temperature: options?.temperature,
        projectId: options.projectId,
        process: options.process,
        mode: options?.mode,
      }),
    });
    return result.content;
  }

  async testConnection(): Promise<boolean> {
    const result = await testApiConnection();
    return result.ok;
  }
}

let providerInstance: ApiAIProvider | null = null;
let activeConversationId: string | null = null;

export async function getAIProvider(conversationId?: string): Promise<AIProvider> {
  if (!providerInstance) {
    providerInstance = new ApiAIProvider();
  }
  if (conversationId) {
    activeConversationId = conversationId;
    providerInstance.setConversationId(conversationId);
  } else if (activeConversationId) {
    providerInstance.setConversationId(activeConversationId);
  }
  return providerInstance;
}

export function resetAIProvider() {
  providerInstance = null;
  activeConversationId = null;
}

export function setActiveConversation(conversationId: string) {
  activeConversationId = conversationId;
  if (providerInstance) {
    providerInstance.setConversationId(conversationId);
  }
}
