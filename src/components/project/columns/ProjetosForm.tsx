import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { validateProjectRequiredFields } from "@/lib/projectValidation";
import { toast } from "@/stores/toastStore";
import type { Project, ProjetosData } from "@/types/project";

interface ColumnFormProps {
  project: Project;
  onSave: (patch: Partial<Project>) => Promise<void>;
}

export function ProjetosForm({ project, onSave }: ColumnFormProps) {
  const data = (project.columnData ?? {}) as ProjetosData;
  const [form, setForm] = useState<ProjetosData>({
    sourcePlatform: data.sourcePlatform ?? "",
    sourceUrl: data.sourceUrl ?? "",
    shortDescription: data.shortDescription ?? "",
    clientName: data.clientName ?? "",
    budgetMin: data.budgetMin,
    budgetMax: data.budgetMax,
    postedAt: data.postedAt ?? "",
    notes: data.notes ?? "",
  });

  const [title, setTitle] = useState(project.title);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setTitle(project.title);
    setForm({
      sourcePlatform: data.sourcePlatform ?? "",
      sourceUrl: data.sourceUrl ?? "",
      shortDescription: data.shortDescription ?? "",
      clientName: data.clientName ?? "",
      budgetMin: data.budgetMin,
      budgetMax: data.budgetMax,
      postedAt: data.postedAt ?? "",
      notes: data.notes ?? "",
    });
  }, [project.id]);

  async function handleSave() {
    const validationError = validateProjectRequiredFields(
      title,
      form.sourcePlatform,
      form.sourceUrl,
    );
    if (validationError) {
      toast.error("Campos obrigatórios", validationError);
      return;
    }

    setSaving(true);
    try {
      await onSave({
        title,
        columnData: form,
      });
      toast.success("Informações salvas", "Título, plataforma e URL foram atualizados.");
    } catch (err) {
      toast.error("Erro ao salvar", err instanceof Error ? err.message : undefined);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-3">
      <div>
        <Label>Título *</Label>
        <Input value={title} onChange={(e) => setTitle(e.target.value)} />
      </div>
      <div>
        <Label>Plataforma *</Label>
        <Input
          value={form.sourcePlatform}
          onChange={(e) => setForm({ ...form, sourcePlatform: e.target.value })}
        />
      </div>
      <div>
        <Label>URL *</Label>
        <Input
          type="url"
          value={form.sourceUrl}
          onChange={(e) => setForm({ ...form, sourceUrl: e.target.value })}
          placeholder="https://..."
        />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label>Orçamento mínimo (R$)</Label>
          <Input
            type="number"
            value={form.budgetMin ?? ""}
            onChange={(e) => setForm({ ...form, budgetMin: Number(e.target.value) || undefined })}
          />
        </div>
        <div>
          <Label>Orçamento máximo (R$)</Label>
          <Input
            type="number"
            value={form.budgetMax ?? ""}
            onChange={(e) => setForm({ ...form, budgetMax: Number(e.target.value) || undefined })}
          />
        </div>
      </div>
      <div>
        <Label>Cliente</Label>
        <Input
          value={form.clientName ?? ""}
          onChange={(e) => setForm({ ...form, clientName: e.target.value })}
        />
      </div>
      <div>
        <Label>Descrição curta</Label>
        <Textarea
          value={form.shortDescription}
          onChange={(e) => setForm({ ...form, shortDescription: e.target.value })}
        />
      </div>
      <div>
        <Label>Notas</Label>
        <Textarea value={form.notes ?? ""} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
      </div>
      <Button onClick={handleSave} disabled={saving}>
        {saving ? "Salvando..." : "Salvar"}
      </Button>
    </div>
  );
}
