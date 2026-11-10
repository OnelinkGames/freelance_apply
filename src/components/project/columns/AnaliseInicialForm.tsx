import { useCallback, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useDebouncedAutoSave } from "@/hooks/useDebouncedAutoSave";
import { toast } from "@/stores/toastStore";
import type { AnaliseInicialData, Project } from "@/types/project";

interface ColumnFormProps {
  project: Project;
  onSave: (patch: Partial<Project>) => Promise<void>;
}

export function AnaliseInicialForm({ project, onSave }: ColumnFormProps) {
  const data = (project.columnData ?? {}) as AnaliseInicialData;
  const [form, setForm] = useState<AnaliseInicialData>({
    overview: data.overview ?? "",
    objectives: data.objectives ?? "",
    technologies: data.technologies ?? [],
    assumptions: data.assumptions ?? "",
    risks: data.risks ?? "",
    estimatedComplexity: data.estimatedComplexity ?? "Média",
    estimatedValue: data.estimatedValue ?? 0,
  });
  const [techInput, setTechInput] = useState((data.technologies ?? []).join(", "));
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const next = (project.columnData ?? {}) as AnaliseInicialData;
    setForm({
      overview: next.overview ?? "",
      objectives: next.objectives ?? "",
      technologies: next.technologies ?? [],
      assumptions: next.assumptions ?? "",
      risks: next.risks ?? "",
      estimatedComplexity: next.estimatedComplexity ?? "Média",
      estimatedValue: next.estimatedValue ?? 0,
    });
    setTechInput((next.technologies ?? []).join(", "));
  }, [project.id]);

  const persist = useCallback(async () => {
    const technologies = techInput
      .split(",")
      .map((t) => t.trim())
      .filter(Boolean);
    await onSave({
      columnData: { ...form, technologies },
      proposalValue: form.estimatedValue,
    });
  }, [form, onSave, techInput]);

  useDebouncedAutoSave(persist, [form, techInput]);

  async function handleSave() {
    setSaving(true);
    try {
      await persist();
      toast.success("Análise inicial salva");
    } catch (err) {
      toast.error("Erro ao salvar", err instanceof Error ? err.message : undefined);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-3">
      <p className="text-xs text-slate-500 dark:text-slate-400">
        As alterações são salvas automaticamente ao editar.
      </p>
      <div>
        <Label>Visão geral</Label>
        <Textarea value={form.overview} onChange={(e) => setForm({ ...form, overview: e.target.value })} />
      </div>
      <div>
        <Label>Objetivos</Label>
        <Textarea value={form.objectives} onChange={(e) => setForm({ ...form, objectives: e.target.value })} />
      </div>
      <div>
        <Label>Tecnologias (separadas por vírgula)</Label>
        <Input value={techInput} onChange={(e) => setTechInput(e.target.value)} />
      </div>
      <div>
        <Label>Premissas</Label>
        <Textarea value={form.assumptions} onChange={(e) => setForm({ ...form, assumptions: e.target.value })} />
      </div>
      <div>
        <Label>Riscos</Label>
        <Textarea value={form.risks} onChange={(e) => setForm({ ...form, risks: e.target.value })} />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label>Complexidade</Label>
          <Select
            value={form.estimatedComplexity}
            onValueChange={(value) =>
              setForm({ ...form, estimatedComplexity: value as AnaliseInicialData["estimatedComplexity"] })
            }
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {["Baixa", "Média", "Alta", "Muito Alta"].map((item) => (
                <SelectItem key={item} value={item}>
                  {item}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label>Valor estimado (R$)</Label>
          <Input
            type="number"
            value={form.estimatedValue}
            onChange={(e) => setForm({ ...form, estimatedValue: Number(e.target.value) || 0 })}
          />
        </div>
      </div>
      <Button onClick={handleSave} disabled={saving}>
        {saving ? "Salvando..." : "Salvar agora"}
      </Button>
    </div>
  );
}
