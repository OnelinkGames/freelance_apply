import { api } from "@/lib/api";
import type { DocumentRecord, DocumentType } from "@/types/project";

export async function listDocuments(projectId: string): Promise<DocumentRecord[]> {
  return api<DocumentRecord[]>(`/projects/${projectId}/documents`);
}

export async function getLatestDocument(
  projectId: string,
  type: DocumentType,
): Promise<DocumentRecord | null> {
  return api<DocumentRecord | null>(`/projects/${projectId}/documents/latest/${type}`);
}

export async function saveDocument(
  projectId: string,
  type: DocumentType,
  content: string,
): Promise<DocumentRecord> {
  return api<DocumentRecord>(`/projects/${projectId}/documents`, {
    method: "POST",
    body: JSON.stringify({ type, content }),
  });
}

export async function readDocumentFile(
  _projectId: string,
  _type: DocumentType,
): Promise<string | null> {
  return null;
}
