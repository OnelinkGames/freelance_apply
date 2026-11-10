import { api } from "@/lib/api";
import type { ColumnSlug, KanbanColumn, Project } from "@/types/project";

export interface CreateProjectInput {
  title: string;
  sourcePlatform: string;
  sourceUrl: string;
  shortDescription?: string;
}

export async function listColumns(): Promise<KanbanColumn[]> {
  return api<KanbanColumn[]>("/columns");
}

export async function listProjects(): Promise<Project[]> {
  return api<Project[]>("/projects");
}

export async function getProject(id: string): Promise<Project | null> {
  try {
    return await api<Project>(`/projects/${id}`);
  } catch {
    return null;
  }
}

export async function createProject(input: CreateProjectInput): Promise<Project> {
  return api<Project>("/projects", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export async function updateProject(
  id: string,
  patch: Partial<
    Pick<
      Project,
      | "title"
      | "priority"
      | "tags"
      | "statusColor"
      | "columnData"
      | "proposalValue"
      | "estimatedHours"
      | "estimatedDays"
      | "expectedFinishDate"
    >
  >,
): Promise<Project> {
  return api<Project>(`/projects/${id}`, {
    method: "PATCH",
    body: JSON.stringify(patch),
  });
}

export async function moveProject(id: string, targetColumn: ColumnSlug): Promise<Project> {
  return api<Project>(`/projects/${id}/move`, {
    method: "POST",
    body: JSON.stringify({ targetColumn }),
  });
}

export async function deleteProject(id: string): Promise<void> {
  await api<void>(`/projects/${id}`, { method: "DELETE" });
}

export async function updateColumnData(
  id: string,
  data: Project["columnData"],
): Promise<Project> {
  return updateProject(id, { columnData: data });
}
