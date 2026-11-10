import { useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { getDevelopmentProgress } from "@/lib/dates";
import { formatDate } from "@/lib/dates";
import type { EmDesenvolvimentoData, Project } from "@/types/project";

interface ColumnFormProps {
  project: Project;
  onSave: (patch: Partial<Project>) => Promise<void>;
}

export function EmDesenvolvimentoView({ project, onSave }: ColumnFormProps) {
  const data = (project.columnData ?? {}) as EmDesenvolvimentoData;
  const [form, setForm] = useState<EmDesenvolvimentoData>({
    startedAt: data.startedAt ?? project.movedToCurrentColumnAt,
    expectedFinishDate: data.expectedFinishDate ?? project.expectedFinishDate ?? "",
    estimatedDays: data.estimatedDays ?? project.estimatedDays ?? 0,
  });

  useEffect(() => {
    const next = (project.columnData ?? {}) as EmDesenvolvimentoData;
    setForm({
      startedAt: next.startedAt ?? project.movedToCurrentColumnAt,
      expectedFinishDate: next.expectedFinishDate ?? project.expectedFinishDate ?? "",
      estimatedDays: next.estimatedDays ?? project.estimatedDays ?? 0,
    });
  }, [project.id]);

  const progress =
    form.startedAt && form.expectedFinishDate
      ? getDevelopmentProgress(form.startedAt, form.expectedFinishDate)
      : null;

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label>Início</Label>
          <Input
            type="date"
            value={form.startedAt ? form.startedAt.slice(0, 10) : ""}
            onChange={(e) =>
              setForm({ ...form, startedAt: new Date(e.target.value).toISOString() })
            }
          />
        </div>
        <div>
          <Label>Prazo final</Label>
          <Input
            type="date"
            value={form.expectedFinishDate ? form.expectedFinishDate.slice(0, 10) : ""}
            onChange={(e) =>
              setForm({ ...form, expectedFinishDate: new Date(e.target.value).toISOString() })
            }
          />
        </div>
      </div>
      <div>
        <Label>Dias estimados</Label>
        <Input
          type="number"
          value={form.estimatedDays}
          onChange={(e) => setForm({ ...form, estimatedDays: Number(e.target.value) || 0 })}
        />
      </div>
      <Button
        onClick={() =>
          onSave({
            columnData: form,
            expectedFinishDate: form.expectedFinishDate,
            estimatedDays: form.estimatedDays,
          })
        }
      >
        Salvar
      </Button>

      {progress && (
        <div className="space-y-2 rounded-lg border border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-900/60">
          <Badge color={progress.color}>{progress.percent}% concluído</Badge>
          <p className="text-sm">Prazo: {progress.totalDays} dias</p>
          <p className="text-sm">Passados: {progress.elapsedDays} dias</p>
          <p className="text-xs text-slate-400">
            Início: {formatDate(form.startedAt)} · Fim: {formatDate(form.expectedFinishDate)}
          </p>
        </div>
      )}
    </div>
  );
}
