import { Badge } from "@/components/ui/badge";
import { getWaitingIndicator } from "@/lib/dates";
import { formatDate } from "@/lib/dates";
import type { Project } from "@/types/project";

interface ColumnFormProps {
  project: Project;
}

export function AguardandoClienteView({ project }: ColumnFormProps) {
  const { days, color } = getWaitingIndicator(project.movedToCurrentColumnAt);

  return (
    <div className="space-y-4 rounded-lg border border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-900/60">
      <p className="text-sm text-slate-600 dark:text-slate-400">
        Aguardando resposta da proposta enviada ao cliente.
      </p>
      <div className="flex items-center gap-3">
        <Badge color={color}>Aguardando há {days} dias</Badge>
        <span className="text-sm text-slate-500 dark:text-slate-400">
          Desde {formatDate(project.movedToCurrentColumnAt)}
        </span>
      </div>
      <div className="text-xs text-slate-400">
        ≤ 15 dias: verde · 16–30 dias: laranja · &gt; 30 dias: vermelho
      </div>
    </div>
  );
}
