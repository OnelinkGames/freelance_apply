import { ChevronDown } from "lucide-react";
import { MarkdownPreview } from "@/components/ai/MarkdownPreview";
import { Badge } from "@/components/ui/badge";
import { formatBRL } from "@/lib/currency";
import { formatDate } from "@/lib/dates";
import { getLatestDocumentForStage, stageHasContent } from "@/lib/columnFlow";
import type { ColumnSlug, DocumentRecord, Milestone, Project } from "@/types/project";

function ReadOnlyField({
  label,
  value,
  href,
}: {
  label: string;
  value?: string | number | null;
  href?: string;
}) {
  if (value === undefined || value === null || value === "") return null;

  return (
    <div className="space-y-0.5">
      <p className="text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">
        {label}
      </p>
      {href ? (
        <a
          href={href}
          target="_blank"
          rel="noreferrer"
          className="break-all text-sm text-blue-600 hover:underline dark:text-blue-400"
        >
          {value}
        </a>
      ) : (
        <p className="whitespace-pre-wrap text-sm text-slate-800 dark:text-slate-200">{value}</p>
      )}
    </div>
  );
}

function EmptyStageMessage() {
  return (
    <p className="text-sm italic text-slate-400">Nenhuma informação registrada nesta etapa.</p>
  );
}

function DocumentBlock({ document }: { document?: DocumentRecord }) {
  if (!document) return null;
  return (
    <div className="space-y-2">
      <p className="text-xs text-slate-500">Gerado em {formatDate(document.createdAt)}</p>
      <MarkdownPreview content={document.content} className="max-h-64 overflow-y-auto text-sm" />
    </div>
  );
}

function StageReadOnlyContent({
  slug,
  project,
  documents,
  milestones,
}: {
  slug: ColumnSlug;
  project: Project;
  documents: DocumentRecord[];
  milestones: Milestone[];
}) {
  const data = (project.columnData ?? {}) as Record<string, unknown>;
  const doc = getLatestDocumentForStage(slug, documents);

  switch (slug) {
    case "projetos":
      return (
        <div className="space-y-3">
          <ReadOnlyField label="Título" value={project.title} />
          <ReadOnlyField label="Plataforma" value={data.sourcePlatform as string} />
          <ReadOnlyField label="URL" value={data.sourceUrl as string} href={data.sourceUrl as string} />
          <ReadOnlyField label="Cliente" value={data.clientName as string} />
          <ReadOnlyField label="Descrição curta" value={data.shortDescription as string} />
          {(Boolean(data.budgetMin) || Boolean(data.budgetMax)) && (
            <ReadOnlyField
              label="Orçamento"
              value={`${data.budgetMin ? formatBRL(Number(data.budgetMin)) : "—"} – ${data.budgetMax ? formatBRL(Number(data.budgetMax)) : "—"}`}
            />
          )}
          <ReadOnlyField label="Notas" value={data.notes as string} />
          {!stageHasContent(slug, project, documents) && <EmptyStageMessage />}
        </div>
      );

    case "analise-inicial":
      return (
        <div className="space-y-3">
          <ReadOnlyField label="Visão geral" value={data.overview as string} />
          <ReadOnlyField label="Objetivos" value={data.objectives as string} />
          <ReadOnlyField
            label="Tecnologias"
            value={(data.technologies as string[] | undefined)?.join(", ")}
          />
          <ReadOnlyField label="Premissas" value={data.assumptions as string} />
          <ReadOnlyField label="Riscos" value={data.risks as string} />
          <ReadOnlyField label="Complexidade" value={data.estimatedComplexity as string} />
          {hasNumber(data.estimatedValue) && (
            <ReadOnlyField label="Valor estimado" value={formatBRL(Number(data.estimatedValue))} />
          )}
          {!stageHasContent(slug, project, documents) && <EmptyStageMessage />}
        </div>
      );

    case "especificacao-refinada":
    case "documento-requisitos":
    case "planejamento":
      return doc ? <DocumentBlock document={doc} /> : <EmptyStageMessage />;

    case "ux-ui":
      return doc ? <DocumentBlock document={doc} /> : (
        <div className="space-y-3">
          <ReadOnlyField label="Figma" value={data.figmaUrl as string} href={data.figmaUrl as string} />
          {(data.inspirationUrls as string[] | undefined)?.filter(Boolean).map((url, i) => (
            <ReadOnlyField key={i} label={`Inspiração ${i + 1}`} value={url} href={url} />
          ))}
          <ReadOnlyField label="Notas de UX/UI" value={(data.uxNotes ?? data.notes) as string} />
          {!stageHasContent(slug, project, documents) && <EmptyStageMessage />}
        </div>
      );

    case "proposta-comercial":
      return (
        <div className="space-y-3">
          {hasNumber(data.proposedValue) && (
            <ReadOnlyField
              label="Valor proposto"
              value={`${formatBRL(Number(data.proposedValue))} (${data.currency ?? "BRL"})`}
            />
          )}
          <ReadOnlyField label="Horas estimadas" value={data.estimatedHours as number} />
          <ReadOnlyField label="Dias estimados" value={data.estimatedDays as number} />
          <ReadOnlyField label="Modelo de pagamento" value={data.paymentModel as string} />
          {data.warrantyDays != null && (
            <ReadOnlyField label="Garantia (dias)" value={data.warrantyDays as number} />
          )}
          <ReadOnlyField label="Notas" value={data.notes as string} />
          {milestones.length > 0 && (
            <div className="space-y-2">
              <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Marcos</p>
              <ul className="space-y-1 text-sm">
                {milestones.map((m) => (
                  <li key={m.id} className="rounded bg-slate-100 px-2 py-1 dark:bg-slate-800">
                    {m.percentage}% — {m.description}
                  </li>
                ))}
              </ul>
            </div>
          )}
          {doc && <DocumentBlock document={doc} />}
          {!stageHasContent(slug, project, documents) && milestones.length === 0 && (
            <EmptyStageMessage />
          )}
        </div>
      );

    case "aguardando-cliente":
      return (
        <div className="space-y-2">
          <ReadOnlyField
            label="Aguardando desde"
            value={formatDate((data.movedAt as string) ?? project.movedToCurrentColumnAt)}
          />
          {!stageHasContent(slug, project, documents) && <EmptyStageMessage />}
        </div>
      );

    case "em-desenvolvimento":
      return (
        <div className="space-y-3">
          <ReadOnlyField
            label="Início"
            value={data.startedAt ? formatDate(data.startedAt as string) : undefined}
          />
          <ReadOnlyField
            label="Prazo final"
            value={
              data.expectedFinishDate
                ? formatDate(data.expectedFinishDate as string)
                : project.expectedFinishDate
                  ? formatDate(project.expectedFinishDate)
                  : undefined
            }
          />
          <ReadOnlyField
            label="Dias estimados"
            value={(data.estimatedDays as number) ?? project.estimatedDays ?? undefined}
          />
          {!stageHasContent(slug, project, documents) && <EmptyStageMessage />}
        </div>
      );

    default:
      return <EmptyStageMessage />;
  }
}

function hasNumber(value: unknown): boolean {
  return typeof value === "number" && !Number.isNaN(value) && value > 0;
}

interface PreviousStagesAccordionProps {
  project: Project;
  stages: { slug: ColumnSlug; name: string }[];
  documents: DocumentRecord[];
  milestones: Milestone[];
}

export function PreviousStagesAccordion({
  project,
  stages,
  documents,
  milestones,
}: PreviousStagesAccordionProps) {
  if (stages.length === 0) return null;

  return (
    <div className="space-y-2">
      <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300">Etapas anteriores</h3>
      <p className="text-xs text-slate-500 dark:text-slate-400">
        Consulte o que foi registrado nas colunas anteriores do fluxo.
      </p>
      <div className="space-y-2">
        {stages.map((stage) => {
          const filled = stageHasContent(stage.slug, project, documents);
          return (
            <details
              key={stage.slug}
              className="group rounded-lg border border-slate-200 bg-slate-50/50 dark:border-slate-700 dark:bg-slate-900/40"
            >
              <summary className="flex cursor-pointer list-none items-center justify-between gap-3 px-4 py-3 [&::-webkit-details-marker]:hidden">
                <div className="flex min-w-0 flex-1 items-center gap-2">
                  <span className="truncate text-sm font-medium">{stage.name}</span>
                  <Badge color={filled ? "green" : "neutral"} className="shrink-0">
                    {filled ? "Preenchido" : "Vazio"}
                  </Badge>
                </div>
                <ChevronDown className="h-4 w-4 shrink-0 text-slate-400 transition-transform group-open:rotate-180" />
              </summary>
              <div className="border-t border-slate-200 px-4 py-3 dark:border-slate-700">
                <StageReadOnlyContent
                  slug={stage.slug}
                  project={project}
                  documents={documents}
                  milestones={milestones}
                />
              </div>
            </details>
          );
        })}
      </div>
    </div>
  );
}
