import { useDraggable } from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getDevelopmentProgress, getWaitingIndicator } from "@/lib/dates";
import { cardBorderClasses } from "@/lib/colors";
import type { Project } from "@/types/project";
import type { ProjetosData, EmDesenvolvimentoData } from "@/types/project";

interface ProjectCardProps {
  project: Project;
  onClick: () => void;
}

export function ProjectCard({ project, onClick }: ProjectCardProps) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: project.id,
  });

  const style = {
    transform: CSS.Translate.toString(transform),
    opacity: isDragging ? 0.5 : 1,
  };

  let indicator = null;

  if (project.currentColumn === "aguardando-cliente") {
    const { days, color } = getWaitingIndicator(project.movedToCurrentColumnAt);
    indicator = <Badge color={color}>Aguardando há {days} dias</Badge>;
  }

  if (project.currentColumn === "em-desenvolvimento") {
    const data = project.columnData as EmDesenvolvimentoData;
    if (data.startedAt && data.expectedFinishDate) {
      const progress = getDevelopmentProgress(data.startedAt, data.expectedFinishDate);
      indicator = (
        <Badge color={progress.color}>
          {progress.percent}% · {progress.elapsedDays}/{progress.totalDays} dias
        </Badge>
      );
    }
  }

  const projetosData = project.columnData as ProjetosData | undefined;
  const borderColor =
    project.currentColumn === "aguardando-cliente"
      ? cardBorderClasses[getWaitingIndicator(project.movedToCurrentColumnAt).color]
      : project.currentColumn === "em-desenvolvimento" &&
          (project.columnData as EmDesenvolvimentoData).startedAt &&
          (project.columnData as EmDesenvolvimentoData).expectedFinishDate
        ? cardBorderClasses[
            getDevelopmentProgress(
              (project.columnData as EmDesenvolvimentoData).startedAt,
              (project.columnData as EmDesenvolvimentoData).expectedFinishDate,
            ).color
          ]
        : "border-l-slate-300";

  return (
    <div ref={setNodeRef} style={style} {...listeners} {...attributes} className="min-w-0">
      <Card
        className={`cursor-grab overflow-hidden border-l-4 active:cursor-grabbing ${borderColor}`}
        onClick={onClick}
      >
        <div className="themed-scrollbar themed-scrollbar-x overflow-x-auto">
          <CardHeader className="p-3 pb-2">
            <CardTitle className="w-max min-w-full text-sm font-medium whitespace-nowrap">
              {project.title}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 p-3 pt-0">
            {projetosData?.sourcePlatform && (
              <p className="w-max min-w-full text-xs whitespace-nowrap text-slate-500 dark:text-slate-400">
                {projetosData.sourcePlatform}
              </p>
            )}
            {project.proposalValue != null && project.proposalValue > 0 && (
              <p className="w-max min-w-full text-xs font-medium whitespace-nowrap text-emerald-700 dark:text-emerald-400">
                R$ {project.proposalValue.toLocaleString("pt-BR")}
              </p>
            )}
            {indicator && <div className="w-max min-w-full">{indicator}</div>}
          </CardContent>
        </div>
      </Card>
    </div>
  );
}
