import { formatDate } from "@/lib/dates";
import type { Project } from "@/types/project";

interface ColumnFormProps {
  project: Project;
}

export function FinalizadosView({ project }: ColumnFormProps) {
  return (
    <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-4">
      <p className="font-medium text-emerald-800">Projeto finalizado</p>
      <p className="mt-2 text-sm text-emerald-700">
        Concluído em {formatDate(project.updatedAt)}
      </p>
      {project.proposalValue != null && (
        <p className="mt-1 text-sm text-emerald-700">
          Valor: R$ {project.proposalValue.toLocaleString("pt-BR")}
        </p>
      )}
    </div>
  );
}
