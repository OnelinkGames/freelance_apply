import { useMemo, useState } from "react";
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
} from "@dnd-kit/core";
import { Loader2, DollarSign, Settings } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AppLogo } from "@/components/brand/AppLogo";
import { ThemeSelector } from "@/components/theme/ThemeSelector";
import { isProjectBasicsValid, validateProjectRequiredFields } from "@/lib/projectValidation";
import { toast } from "@/stores/toastStore";
import { KanbanColumnComponent } from "./KanbanColumn";
import { ProjectCard } from "./ProjectCard";
import { useKanbanStore } from "@/stores/kanbanStore";
import type { ColumnSlug, Project } from "@/types/project";

interface KanbanBoardProps {
  onOpenSettings: () => void;
  onOpenCosts: () => void;
}

export function KanbanBoard({ onOpenSettings, onOpenCosts }: KanbanBoardProps) {
  const columns = useKanbanStore((s) => s.columns);
  const projects = useKanbanStore((s) => s.projects);
  const loading = useKanbanStore((s) => s.loading);
  const error = useKanbanStore((s) => s.error);
  const moveProject = useKanbanStore((s) => s.moveProject);
  const createProject = useKanbanStore((s) => s.createProject);
  const selectProject = useKanbanStore((s) => s.selectProject);

  const [activeProject, setActiveProject] = useState<Project | null>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newPlatform, setNewPlatform] = useState("");
  const [newUrl, setNewUrl] = useState("");
  const [creating, setCreating] = useState(false);

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 8 } }));

  const projectsByColumn = useMemo(() => {
    const map = new Map<ColumnSlug, Project[]>();
    for (const column of columns) {
      map.set(
        column.slug,
        projects.filter((p) => p.currentColumn === column.slug),
      );
    }
    return map;
  }, [columns, projects]);

  function handleDragStart(event: DragStartEvent) {
    const project = projects.find((p) => p.id === event.active.id);
    setActiveProject(project ?? null);
  }

  async function handleDragEnd(event: DragEndEvent) {
    setActiveProject(null);
    const { active, over } = event;
    if (!over) return;

    const projectId = String(active.id);
    const targetColumn = String(over.id) as ColumnSlug;
    const project = projects.find((p) => p.id === projectId);
    if (!project || project.currentColumn === targetColumn) return;

    await moveProject(projectId, targetColumn);
    const columnName = columns.find((c) => c.slug === targetColumn)?.name ?? targetColumn;
    toast.success("Projeto movido", columnName);
  }

  async function handleCreate() {
    const validationError = validateProjectRequiredFields(newTitle, newPlatform, newUrl);
    if (validationError) {
      toast.error("Campos obrigatórios", validationError);
      return;
    }

    setCreating(true);
    try {
      await createProject({
        title: newTitle.trim(),
        sourcePlatform: newPlatform.trim(),
        sourceUrl: newUrl.trim(),
      });
      setCreateOpen(false);
      setNewTitle("");
      setNewPlatform("");
      setNewUrl("");
      toast.success("Projeto criado", "Título, plataforma e URL foram salvos.");
    } catch (err) {
      toast.error("Erro ao criar projeto", err instanceof Error ? err.message : undefined);
    } finally {
      setCreating(false);
    }
  }

  const canCreate = isProjectBasicsValid(newTitle, newPlatform, newUrl);

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex h-full items-center justify-center">
        <p className="text-red-600">{error}</p>
      </div>
    );
  }

  return (
    <>
      <div className="flex items-center justify-between border-b border-slate-200 bg-white px-4 py-3 dark:border-slate-800 dark:bg-slate-950">
        <div className="flex items-center gap-3">
          <AppLogo className="h-9 w-9" />
          <div>
            <h1 className="text-xl font-bold">Freelance Flow</h1>
            <p className="text-sm text-slate-500 dark:text-slate-400">Copiloto para freelancers</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={onOpenCosts}>
            <DollarSign className="mr-2 h-4 w-4" />
            Custos IA
          </Button>
          <Button variant="outline" onClick={onOpenSettings}>
            <Settings className="mr-2 h-4 w-4" />
            Configurações
          </Button>
          <ThemeSelector />
        </div>
      </div>

      <DndContext sensors={sensors} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
        <div className="themed-scrollbar themed-scrollbar-x flex h-[calc(100vh-73px)] min-h-0 gap-3 overflow-x-auto p-4 pb-3">
          {columns.map((column) => (
            <KanbanColumnComponent
              key={column.id}
              column={column}
              projects={projectsByColumn.get(column.slug) ?? []}
              onProjectClick={(project) => selectProject(project.id)}
              onAddProject={() => setCreateOpen(true)}
            />
          ))}
        </div>
        <DragOverlay>
          {activeProject ? (
            <div className="w-72 rotate-2 opacity-90">
              <ProjectCard project={activeProject} onClick={() => undefined} />
            </div>
          ) : null}
        </DragOverlay>
      </DndContext>

      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Novo Projeto</DialogTitle>
            <DialogDescription>Cadastre uma oportunidade encontrada em plataformas freelance.</DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <Label htmlFor="title">Título *</Label>
              <Input id="title" value={newTitle} onChange={(e) => setNewTitle(e.target.value)} />
            </div>
            <div>
              <Label htmlFor="platform">Plataforma *</Label>
              <Input
                id="platform"
                value={newPlatform}
                onChange={(e) => setNewPlatform(e.target.value)}
                placeholder="Workana, 99freelas..."
              />
            </div>
            <div>
              <Label htmlFor="url">URL *</Label>
              <Input
                id="url"
                type="url"
                value={newUrl}
                onChange={(e) => setNewUrl(e.target.value)}
                placeholder="https://..."
              />
            </div>
            <Button onClick={handleCreate} disabled={creating || !canCreate} className="w-full">
              {creating ? <Loader2 className="h-4 w-4 animate-spin" /> : "Criar projeto"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
