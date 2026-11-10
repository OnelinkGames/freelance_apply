import { useCallback, useEffect, useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { AIChatPanel } from "@/components/ai/AIChatPanel";
import { MarkdownPreview } from "@/components/ai/MarkdownPreview";
import { DocumentGenerateBar } from "@/components/documents/DocumentGenerateBar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { completeWithAgent } from "@/services/agents/agentService";
import { getLatestDocument, saveDocument } from "@/services/documents/documentService";
import { useDebouncedAutoSave } from "@/hooks/useDebouncedAutoSave";
import { toast } from "@/stores/toastStore";
import type { Project, UxUiData } from "@/types/project";

interface ColumnFormProps {
  project: Project;
  onSave: (patch: Partial<Project>) => Promise<void>;
}

export function UxUiForm({ project, onSave }: ColumnFormProps) {
  const data = (project.columnData ?? {}) as UxUiData;
  const [form, setForm] = useState<UxUiData>({
    figmaUrl: data.figmaUrl ?? "",
    inspirationUrls: data.inspirationUrls ?? [],
    notes: data.notes ?? "",
  });
  const [saving, setSaving] = useState(false);
  const [docContent, setDocContent] = useState("");
  const [hasDocSaved, setHasDocSaved] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const next = (project.columnData ?? {}) as UxUiData;
    setForm({
      figmaUrl: next.figmaUrl ?? "",
      inspirationUrls: next.inspirationUrls ?? [],
      notes: next.uxNotes ?? next.notes ?? "",
    });
    getLatestDocument(project.id, "UX").then((doc) => {
      if (doc) {
        setDocContent(doc.content);
        setHasDocSaved(true);
      }
    });
  }, [project.id]);

  const persist = useCallback(async () => {
    await onSave({
      columnData: {
        figmaUrl: form.figmaUrl,
        inspirationUrls: form.inspirationUrls,
        uxNotes: form.notes,
      },
    });
  }, [form, onSave]);

  useDebouncedAutoSave(persist, [form]);

  function addUrl() {
    setForm({ ...form, inspirationUrls: [...form.inspirationUrls, ""] });
  }

  function updateUrl(index: number, value: string) {
    const urls = [...form.inspirationUrls];
    urls[index] = value;
    setForm({ ...form, inspirationUrls: urls });
  }

  function removeUrl(index: number) {
    setForm({ ...form, inspirationUrls: form.inspirationUrls.filter((_, i) => i !== index) });
  }

  async function handleSave() {
    setSaving(true);
    try {
      await persist();
      toast.success("UX/UI salvo");
    } catch (err) {
      toast.error("Erro ao salvar", err instanceof Error ? err.message : undefined);
    } finally {
      setSaving(false);
    }
  }

  async function handleGenerate() {
    setGenerating(true);
    setError(null);
    try {
      const requirements = await getLatestDocument(project.id, "REQUIREMENTS");
      if (!requirements) {
        throw new Error("Gere ou insira primeiro o Documento de Requisitos");
      }
      const result = await completeWithAgent({
        projectId: project.id,
        process: "UX",
        mode: "generation",
        prompt: requirements.content,
      });
      const doc = await saveDocument(project.id, "UX", result.content);
      setDocContent(doc.content);
      setHasDocSaved(true);
      toast.success("Documento gerado", "Diretrizes de UX/UI salvas com sucesso.");
    } catch (err) {
      const message = err instanceof Error ? err.message : "Erro ao gerar documento UX";
      setError(message);
      toast.error("Erro ao gerar", message);
    } finally {
      setGenerating(false);
    }
  }

  return (
    <div className="space-y-4">
      <p className="text-xs text-slate-500 dark:text-slate-400">
        Links e notas são salvos automaticamente. Use os botões abaixo para o documento de UX.
      </p>
      <div className="grid h-[min(45vh,480px)] min-h-0 grid-cols-1 gap-3 overflow-hidden lg:grid-cols-2">
        <div className="min-h-0 overflow-hidden">
          <AIChatPanel projectId={project.id} columnSlug="ux-ui" process="UX" />
        </div>
        <div className="min-h-0 space-y-3 overflow-y-auto rounded-md border border-slate-200 p-3 dark:border-slate-700">
          <div>
            <Label>URL do Figma</Label>
            <Input
              value={form.figmaUrl ?? ""}
              onChange={(e) => setForm({ ...form, figmaUrl: e.target.value })}
            />
          </div>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>Links de inspiração</Label>
              <Button variant="outline" size="sm" onClick={addUrl}>
                <Plus className="mr-1 h-4 w-4" />
                Adicionar
              </Button>
            </div>
            {form.inspirationUrls.map((url, index) => (
              <div key={index} className="flex gap-2">
                <Input
                  value={url}
                  onChange={(e) => updateUrl(index, e.target.value)}
                  placeholder="https://..."
                />
                <Button variant="ghost" size="icon" onClick={() => removeUrl(index)}>
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
          <div>
            <Label>Notas de UX/UI</Label>
            <Textarea
              value={form.notes ?? ""}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
            />
          </div>
          <Button onClick={handleSave} disabled={saving}>
            {saving ? "Salvando..." : "Salvar links e notas"}
          </Button>
        </div>
      </div>

      <DocumentGenerateBar
        generateLabel="Gerar Diretrizes UX"
        generating={generating}
        onGenerate={handleGenerate}
        projectId={project.id}
        documentType="UX"
        content={docContent}
        onContentUpdate={(text) => {
          setDocContent(text);
          setHasDocSaved(true);
        }}
        hasSaved={hasDocSaved}
      />
      {error && <p className="text-sm text-red-600">{error}</p>}
      {docContent && <MarkdownPreview content={docContent} className="h-[40vh]" />}
    </div>
  );
}
