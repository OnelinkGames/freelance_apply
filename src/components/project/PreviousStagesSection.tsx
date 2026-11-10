import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { listMilestones } from "@/services/ai/aiConversationService";
import { listDocuments } from "@/services/documents/documentService";
import { getPreviousStages } from "@/lib/columnFlow";
import { PreviousStagesAccordion } from "./PreviousStagesAccordion";
import { useKanbanStore } from "@/stores/kanbanStore";
import type { DocumentRecord, Milestone, Project } from "@/types/project";

interface PreviousStagesSectionProps {
  project: Project;
}

export function PreviousStagesSection({ project }: PreviousStagesSectionProps) {
  const columns = useKanbanStore((s) => s.columns);
  const [documents, setDocuments] = useState<DocumentRecord[]>([]);
  const [milestones, setMilestones] = useState<Milestone[]>([]);
  const [loading, setLoading] = useState(true);

  const previousStages = getPreviousStages(project.currentColumn, columns).map((c) => ({
    slug: c.slug,
    name: c.name,
  }));

  useEffect(() => {
    if (previousStages.length === 0) {
      setLoading(false);
      return;
    }

    setLoading(true);
    Promise.all([listDocuments(project.id), listMilestones(project.id)])
      .then(([docs, miles]) => {
        setDocuments(docs);
        setMilestones(miles);
      })
      .finally(() => setLoading(false));
  }, [project.id, previousStages.length]);

  if (previousStages.length === 0) return null;

  if (loading) {
    return (
      <div className="flex items-center gap-2 py-2 text-sm text-slate-500">
        <Loader2 className="h-4 w-4 animate-spin" />
        Carregando etapas anteriores...
      </div>
    );
  }

  return (
    <PreviousStagesAccordion
      project={project}
      stages={previousStages}
      documents={documents}
      milestones={milestones}
    />
  );
}
