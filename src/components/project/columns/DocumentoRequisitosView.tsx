import { useEffect, useState } from "react";
import { MarkdownPreview } from "@/components/ai/MarkdownPreview";
import { DocumentGenerateBar } from "@/components/documents/DocumentGenerateBar";
import { completeWithAgent } from "@/services/agents/agentService";
import { getLatestDocument, saveDocument } from "@/services/documents/documentService";
import { toast } from "@/stores/toastStore";
import type { Project } from "@/types/project";

interface ColumnFormProps {
  project: Project;
}

export function DocumentoRequisitosView({ project }: ColumnFormProps) {
  const [content, setContent] = useState("");
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasSaved, setHasSaved] = useState(false);

  useEffect(() => {
    getLatestDocument(project.id, "REQUIREMENTS").then((doc) => {
      if (doc) {
        setContent(doc.content);
        setHasSaved(true);
      }
    });
  }, [project.id]);

  async function handleGenerate() {
    setGenerating(true);
    setError(null);
    try {
      const spec = await getLatestDocument(project.id, "SPEC_REFINED");
      if (!spec) {
        throw new Error("Gere ou insira primeiro a Especificação Refinada");
      }
      const result = await completeWithAgent({
        projectId: project.id,
        process: "REQUIREMENTS",
        mode: "generation",
        prompt: spec.content,
      });
      await saveDocument(project.id, "REQUIREMENTS", result.content);
      setContent(result.content);
      setHasSaved(true);
      toast.success("Documento gerado", "Requisitos salvos com sucesso.");
    } catch (err) {
      const message = err instanceof Error ? err.message : "Erro ao gerar requisitos";
      setError(message);
      toast.error("Erro ao gerar requisitos", message);
    } finally {
      setGenerating(false);
    }
  }

  return (
    <div className="space-y-3">
      <DocumentGenerateBar
        generateLabel="Gerar Requisitos"
        generating={generating}
        onGenerate={handleGenerate}
        projectId={project.id}
        documentType="REQUIREMENTS"
        content={content}
        onContentUpdate={(text) => {
          setContent(text);
          setHasSaved(true);
        }}
        hasSaved={hasSaved}
      />
      {error && <p className="text-sm text-red-600">{error}</p>}
      <MarkdownPreview content={content} className="h-[50vh]" />
    </div>
  );
}
