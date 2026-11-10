import { api } from "@/lib/api";
import type { Comment } from "@/types/project";

export async function listComments(projectId: string): Promise<Comment[]> {
  return api<Comment[]>(`/projects/${projectId}/comments`);
}

export async function addComment(projectId: string, text: string): Promise<Comment> {
  return api<Comment>(`/projects/${projectId}/comments`, {
    method: "POST",
    body: JSON.stringify({ text }),
  });
}

export async function deleteComment(id: string): Promise<void> {
  await api<void>(`/comments/${id}`, { method: "DELETE" });
}
