import { api } from "@/lib/api";
import type { AIConversation, AIMessage, Milestone } from "@/types/project";

export async function getOrCreateConversation(
  projectId: string,
  columnSlug: string,
): Promise<AIConversation> {
  return api<AIConversation>(`/projects/${projectId}/conversations/${columnSlug}`);
}

export async function listMessages(conversationId: string): Promise<AIMessage[]> {
  return api<AIMessage[]>(`/conversations/${conversationId}/messages`);
}

export async function addMessage(
  conversationId: string,
  role: AIMessage["role"],
  content: string,
): Promise<AIMessage> {
  return api<AIMessage>(`/conversations/${conversationId}/messages`, {
    method: "POST",
    body: JSON.stringify({ role, content }),
  });
}

export async function sendChatMessage(
  conversationId: string,
  content: string,
  process?: import("@/types/agents").AgentProcess,
): Promise<AIMessage> {
  return api<AIMessage>(`/conversations/${conversationId}/chat`, {
    method: "POST",
    body: JSON.stringify({ content, process }),
  });
}

export async function listMilestones(projectId: string): Promise<Milestone[]> {
  return api<Milestone[]>(`/projects/${projectId}/milestones`);
}

export async function replaceMilestones(
  projectId: string,
  items: Omit<Milestone, "id" | "projectId">[],
): Promise<Milestone[]> {
  return api<Milestone[]>(`/projects/${projectId}/milestones`, {
    method: "PUT",
    body: JSON.stringify(items),
  });
}
