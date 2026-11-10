import { useState } from "react";
import { Loader2, X } from "lucide-react";
import { CommentsSection } from "./CommentsSection";
import { PreviousStagesSection } from "./PreviousStagesSection";
import { ProjetosForm } from "./columns/ProjetosForm";
import { AnaliseInicialForm } from "./columns/AnaliseInicialForm";
import { EspecificacaoRefinadaView } from "./columns/EspecificacaoRefinadaView";
import { DocumentoRequisitosView } from "./columns/DocumentoRequisitosView";
import { PlanejamentoView } from "./columns/PlanejamentoView";
import { UxUiForm } from "./columns/UxUiForm";
import { PropostaComercialForm } from "./columns/PropostaComercialForm";
import { AguardandoClienteView } from "./columns/AguardandoClienteView";
import { EmDesenvolvimentoView } from "./columns/EmDesenvolvimentoView";
import { FinalizadosView } from "./columns/FinalizadosView";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { useKanbanStore } from "@/stores/kanbanStore";
import { toast } from "@/stores/toastStore";
import type { Project } from "@/types/project";

interface ProjectDetailSheetProps {
  project: Project;
  columnName: string;
  onClose: () => void;
}

export function ProjectDetailSheet({ project, columnName, onClose }: ProjectDetailSheetProps) {
  const updateProject = useKanbanStore((s) => s.updateProject);
  const deleteProject = useKanbanStore((s) => s.deleteProject);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const aiHeavy = [
    "especificacao-refinada",
    "documento-requisitos",
    "planejamento",
    "ux-ui",
    "proposta-comercial",
  ].includes(project.currentColumn);

  async function handleSave(patch: Partial<Project>) {
    try {
      const merged: Partial<Project> = { ...patch };
      if (patch.columnData) {
        merged.columnData = { ...project.columnData, ...patch.columnData };
      }
      await updateProject(project.id, merged);
    } catch (err) {
      toast.error("Erro ao salvar", err instanceof Error ? err.message : undefined);
      throw err;
    }
  }

  async function handleConfirmDelete() {
    setDeleting(true);
    try {
      await deleteProject(project.id);
      toast.success("Projeto excluído");
      setDeleteOpen(false);
      onClose();
    } catch (err) {
      toast.error("Erro ao excluir", err instanceof Error ? err.message : undefined);
    } finally {
      setDeleting(false);
    }
  }

  function renderColumnContent() {
    const props = { project, onSave: handleSave };
    switch (project.currentColumn) {
      case "projetos":
        return <ProjetosForm {...props} />;
      case "analise-inicial":
        return <AnaliseInicialForm {...props} />;
      case "especificacao-refinada":
        return <EspecificacaoRefinadaView project={project} />;
      case "documento-requisitos":
        return <DocumentoRequisitosView project={project} />;
      case "planejamento":
        return <PlanejamentoView project={project} />;
      case "ux-ui":
        return <UxUiForm {...props} />;
      case "proposta-comercial":
        return <PropostaComercialForm {...props} />;
      case "aguardando-cliente":
        return <AguardandoClienteView project={project} />;
      case "em-desenvolvimento":
        return <EmDesenvolvimentoView {...props} />;
      case "finalizados":
        return <FinalizadosView project={project} />;
      default:
        return null;
    }
  }

  return (
    <>
      <div
        className={`fixed inset-y-0 right-0 z-40 border-l border-slate-200 bg-white shadow-xl dark:border-slate-800 dark:bg-slate-950 ${
          aiHeavy ? "w-[min(960px,95vw)]" : "w-[min(480px,95vw)]"
        }`}
      >
        <div className="flex h-full flex-col">
          <div className="relative border-b border-slate-200 px-4 py-3 pr-12 dark:border-slate-800">
            <div>
              <h2 className="font-semibold">{project.title}</h2>
              <p className="text-sm text-slate-500 dark:text-slate-400">{columnName}</p>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
              className="absolute right-2 top-2"
              aria-label="Fechar"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>

          <ScrollArea className="flex-1">
            <div className="space-y-4 p-4">
              <section className="rounded-lg border-2 border-blue-200 bg-blue-50/40 p-4 dark:border-blue-900 dark:bg-blue-950/20">
                <div className="mb-4 flex items-center gap-2">
                  <Badge color="green">Etapa atual</Badge>
                  <span className="text-sm font-medium text-slate-700 dark:text-slate-200">
                    {columnName}
                  </span>
                </div>
                {renderColumnContent()}
              </section>

              <PreviousStagesSection project={project} />

              <Separator />
              <CommentsSection projectId={project.id} />
            </div>
          </ScrollArea>

          <div className="flex shrink-0 justify-end border-t border-slate-200 px-4 py-3 dark:border-slate-800">
            <Button variant="destructive" onClick={() => setDeleteOpen(true)}>
              Deletar
            </Button>
          </div>
        </div>
      </div>

      <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Excluir projeto?</DialogTitle>
            <DialogDescription>
              O projeto <strong>{project.title}</strong> será removido permanentemente, incluindo
              documentos, comentários e histórico de conversas. Esta ação não pode ser desfeita.
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setDeleteOpen(false)} disabled={deleting}>
              Cancelar
            </Button>
            <Button variant="destructive" onClick={handleConfirmDelete} disabled={deleting}>
              {deleting ? <Loader2 className="h-4 w-4 animate-spin" /> : "Excluir projeto"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
