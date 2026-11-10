import { useDroppable } from "@dnd-kit/core";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ProjectCard } from "./ProjectCard";
import type { KanbanColumn, Project } from "@/types/project";

interface KanbanColumnProps {
  column: KanbanColumn;
  projects: Project[];
  onProjectClick: (project: Project) => void;
  onAddProject?: () => void;
}

export function KanbanColumnComponent({
  column,
  projects,
  onProjectClick,
  onAddProject,
}: KanbanColumnProps) {
  const { setNodeRef, isOver } = useDroppable({ id: column.slug });

  return (
    <div
      ref={setNodeRef}
      className={`flex h-full w-72 shrink-0 flex-col rounded-lg border bg-slate-50 dark:bg-slate-900/60 ${
        isOver
          ? "border-blue-400 bg-blue-50/50 dark:border-blue-500 dark:bg-blue-950/30"
          : "border-slate-200 dark:border-slate-700"
      }`}
    >
      <div className="flex items-center justify-between border-b border-slate-200 px-3 py-2 dark:border-slate-700">
        <div>
          <h3 className="text-sm font-semibold">{column.name}</h3>
          <p className="text-xs text-slate-500 dark:text-slate-400">{projects.length} cards</p>
        </div>
        {column.slug === "projetos" && onAddProject && (
          <Button variant="ghost" size="icon" onClick={onAddProject}>
            <Plus className="h-4 w-4" />
          </Button>
        )}
      </div>
      <ScrollArea className="min-h-0 flex-1 p-2">
        <div className="space-y-2 pb-2">
          {projects.map((project) => (
            <ProjectCard key={project.id} project={project} onClick={() => onProjectClick(project)} />
          ))}
        </div>
      </ScrollArea>
    </div>
  );
}
