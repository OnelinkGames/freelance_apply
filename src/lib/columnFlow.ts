import type { ColumnSlug, DocumentRecord, DocumentType, KanbanColumn, Project } from "@/types/project";

export const COLUMN_DOCUMENT_TYPE: Partial<Record<ColumnSlug, DocumentType>> = {
  "especificacao-refinada": "SPEC_REFINED",
  "documento-requisitos": "REQUIREMENTS",
  planejamento: "PLANNING",
  "ux-ui": "UX",
  "proposta-comercial": "PROPOSAL",
};

export function getPreviousStages(
  currentSlug: ColumnSlug,
  columns: KanbanColumn[],
): KanbanColumn[] {
  const sorted = [...columns].sort((a, b) => a.sortOrder - b.sortOrder);
  const index = sorted.findIndex((c) => c.slug === currentSlug);
  if (index <= 0) return [];
  return sorted.slice(0, index);
}

function hasText(value: unknown): boolean {
  return typeof value === "string" && value.trim().length > 0;
}

function hasNumber(value: unknown): boolean {
  return typeof value === "number" && !Number.isNaN(value) && value > 0;
}

export function stageHasContent(
  slug: ColumnSlug,
  project: Project,
  documents: DocumentRecord[],
): boolean {
  const data = (project.columnData ?? {}) as Record<string, unknown>;
  const docType = COLUMN_DOCUMENT_TYPE[slug];
  if (docType && documents.some((d) => d.type === docType)) return true;

  switch (slug) {
    case "projetos":
      return (
        hasText(project.title) ||
        hasText(data.sourcePlatform) ||
        hasText(data.sourceUrl) ||
        hasText(data.shortDescription) ||
        hasText(data.clientName) ||
        hasNumber(data.budgetMin) ||
        hasNumber(data.budgetMax) ||
        hasText(data.notes)
      );
    case "analise-inicial":
      return (
        hasText(data.overview) ||
        hasText(data.objectives) ||
        (Array.isArray(data.technologies) && data.technologies.length > 0) ||
        hasText(data.assumptions) ||
        hasText(data.risks) ||
        hasNumber(data.estimatedValue)
      );
    case "ux-ui":
      return (
        hasText(data.figmaUrl) ||
        (Array.isArray(data.inspirationUrls) &&
          data.inspirationUrls.some((u: string) => u.trim())) ||
        hasText(data.uxNotes) ||
        hasText(data.notes)
      );
    case "proposta-comercial":
      return (
        hasNumber(data.proposedValue) ||
        hasNumber(data.estimatedHours) ||
        hasText(data.notes) ||
        Boolean(docType && documents.some((d) => d.type === docType))
      );
    case "aguardando-cliente":
      return hasText(data.movedAt) || hasText(project.movedToCurrentColumnAt);
    case "em-desenvolvimento":
      return (
        hasText(data.startedAt) ||
        hasText(data.expectedFinishDate) ||
        hasNumber(data.estimatedDays)
      );
    case "especificacao-refinada":
    case "documento-requisitos":
    case "planejamento":
      return Boolean(docType && documents.some((d) => d.type === docType));
    case "finalizados":
      return project.currentColumn === "finalizados";
    default:
      return false;
  }
}

export function getLatestDocumentForStage(
  slug: ColumnSlug,
  documents: DocumentRecord[],
): DocumentRecord | undefined {
  const docType = COLUMN_DOCUMENT_TYPE[slug];
  if (!docType) return undefined;
  return documents
    .filter((d) => d.type === docType)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))[0];
}
