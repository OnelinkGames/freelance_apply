import { testConnection } from "@/services/config/configService";
import { resetAIProvider } from "./openaiProvider";

export type { AIProvider, ChatOptions } from "./openaiProvider";
export { getAIProvider, resetAIProvider, setActiveConversation } from "./openaiProvider";

export async function testAIConnection(input?: {
  apiKey?: string;
  model?: string;
}): Promise<Awaited<ReturnType<typeof testConnection>>> {
  resetAIProvider();
  return testConnection(input);
}
