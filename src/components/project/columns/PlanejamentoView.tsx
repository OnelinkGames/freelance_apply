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

export function PlanejamentoView({ project }: ColumnFormProps) {
  const [content, setContent] = useState("");
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasSaved, setHasSaved] = useState(false);

  useEffect(() => {
    getLatestDocument(project.id, "PLANNING").then((doc) => {
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
      const requirements = await getLatestDocument(project.id, "REQUIREMENTS");
      if (!requirements) {
        throw new Error("Gere ou insira primeiro o Documento de Requisitos");
      }
      const result = await completeWithAgent({
        projectId: project.id,
        process: "PLANNING",
        mode: "generation",
        prompt: requirements.content,
      });
      await saveDocument(project.id, "PLANNING", result.content);
      setContent(result.content);
      setHasSaved(true);
      toast.success("Documento gerado", "Planejamento salvo com sucesso.");
    } catch (err) {
      const message = err instanceof Error ? err.message : "Erro ao gerar planejamento";
      setError(message);
      toast.error("Erro ao gerar planejamento", message);
    } finally {
      setGenerating(false);
    }
  }

  return (
    <div className="space-y-3">
      <DocumentGenerateBar
        generateLabel="Gerar Planejamento"
        generating={generating}
        onGenerate={handleGenerate}
        projectId={project.id}
        documentType="PLANNING"
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
