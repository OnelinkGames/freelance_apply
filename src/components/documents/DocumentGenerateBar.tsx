import { useEffect, useState } from "react";
import { FileText, Loader2, PenLine } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { saveDocument } from "@/services/documents/documentService";
import { toast } from "@/stores/toastStore";
import type { DocumentType } from "@/types/project";
import { DOCUMENT_FILENAMES } from "@/types/project";

interface DocumentGenerateBarProps {
  generateLabel: string;
  generating?: boolean;
  onGenerate: () => void | Promise<void>;
  generateDisabled?: boolean;
  projectId: string;
  documentType: DocumentType;
  content: string;
  onContentUpdate: (content: string) => void;
  hasSaved: boolean;
}

export function DocumentGenerateBar({
  generateLabel,
  generating = false,
  onGenerate,
  generateDisabled = false,
  projectId,
  documentType,
  content,
  onContentUpdate,
  hasSaved,
}: DocumentGenerateBarProps) {
  const [manualOpen, setManualOpen] = useState(false);
  const [draft, setDraft] = useState(content);
  const [saving, setSaving] = useState(false);

  const savedFilename = DOCUMENT_FILENAMES[documentType];

  useEffect(() => {
    if (!manualOpen) {
      setDraft(content);
    }
  }, [content, manualOpen]);

  async function handleSaveManual() {
    if (!draft.trim()) {
      toast.error("Documento vazio", "Cole o conteúdo antes de salvar.");
      return;
    }

    setSaving(true);
    try {
      const doc = await saveDocument(projectId, documentType, draft.trim());
      onContentUpdate(doc.content);
      setManualOpen(false);
      toast.success("Documento salvo", `${savedFilename} atualizado com sucesso.`);
    } catch (err) {
      toast.error("Erro ao salvar", err instanceof Error ? err.message : undefined);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        <Button onClick={() => void onGenerate()} disabled={generating || generateDisabled}>
          {generating ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
          {generateLabel}
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={() => setManualOpen((open) => !open)}
        >
          <PenLine className="mr-2 h-4 w-4" />
          {manualOpen ? "Fechar editor" : "Inserir manualmente"}
        </Button>
        {hasSaved && (
          <p className="flex items-center gap-1 text-sm text-emerald-700 dark:text-emerald-400">
            <FileText className="h-4 w-4" />
            {savedFilename} salvo
          </p>
        )}
      </div>

      {manualOpen && (
        <div className="space-y-2 rounded-md border border-slate-200 bg-slate-50 p-3 dark:border-slate-700 dark:bg-slate-900/50">
          <Label>Cole seu documento em Markdown</Label>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Use conteúdo gerado em outra ferramenta de IA ou editado externamente.
          </p>
          <Textarea
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            className="min-h-[240px] font-mono text-xs"
            placeholder="# Título do documento&#10;&#10;Cole aqui..."
          />
          <div className="flex gap-2">
            <Button onClick={handleSaveManual} disabled={saving || !draft.trim()}>
              {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Salvar documento
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setDraft(content);
                setManualOpen(false);
              }}
            >
              Cancelar
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
