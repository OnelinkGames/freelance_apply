import { useCallback, useEffect, useState } from "react";
import { AIChatPanel } from "@/components/ai/AIChatPanel";
import { MarkdownPreview } from "@/components/ai/MarkdownPreview";
import { DocumentGenerateBar } from "@/components/documents/DocumentGenerateBar";
import { completeWithAgent } from "@/services/agents/agentService";
import {
  getOrCreateConversation,
  listMessages,
} from "@/services/ai/aiConversationService";
import { getLatestDocument, saveDocument } from "@/services/documents/documentService";
import { toast } from "@/stores/toastStore";
import type { AIMessage, Project } from "@/types/project";

interface ColumnFormProps {
  project: Project;
}

export function EspecificacaoRefinadaView({ project }: ColumnFormProps) {
  const [preview, setPreview] = useState("");
  const [generating, setGenerating] = useState(false);
  const [hasSaved, setHasSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [messages, setMessages] = useState<AIMessage[]>([]);

  useEffect(() => {
    getLatestDocument(project.id, "SPEC_REFINED").then((doc) => {
      if (doc) {
        setHasSaved(true);
        setPreview(doc.content);
      }
    });
    getOrCreateConversation(project.id, "especificacao-refinada").then((conv) =>
      listMessages(conv.id).then(setMessages),
    );
  }, [project.id]);

  const handleMessagesChange = useCallback(async (history: AIMessage[]) => {
    setMessages(history);
    if (history.length < 2) return;
    try {
      const result = await completeWithAgent({
        projectId: project.id,
        process: "SPEC_REFINED",
        mode: "preview",
        prompt: `Conversa:\n${history.map((m) => `${m.role}: ${m.content}`).join("\n\n")}`,
      });
      setPreview(result.content);
    } catch {
      // preview is best-effort
    }
  }, [project.id]);

  async function handleGenerateDocument() {
    if (messages.length === 0) {
      toast.error("Conversa vazia", "Envie ao menos uma mensagem antes de gerar.");
      return;
    }

    setGenerating(true);
    setError(null);
    try {
      const result = await completeWithAgent({
        projectId: project.id,
        process: "SPEC_REFINED",
        mode: "generation",
        prompt: `Conversa:\n${messages.map((m) => `${m.role}: ${m.content}`).join("\n\n")}`,
      });
      const doc = await saveDocument(project.id, "SPEC_REFINED", result.content);
      setPreview(doc.content);
      setHasSaved(true);
      toast.success("Documento gerado", "Especificação refinada salva com sucesso.");
    } catch (err) {
      const message = err instanceof Error ? err.message : "Erro ao gerar documento";
      setError(message);
      toast.error("Erro ao gerar documento", message);
    } finally {
      setGenerating(false);
    }
  }

  return (
    <div className="space-y-3">
      <div className="grid h-[min(60vh,560px)] min-h-0 grid-cols-1 gap-3 overflow-hidden lg:grid-cols-2">
        <div className="min-h-0 overflow-hidden">
          <AIChatPanel
            projectId={project.id}
            columnSlug="especificacao-refinada"
            process="SPEC_REFINED"
            onMessagesChange={handleMessagesChange}
          />
        </div>
        <div className="min-h-0 overflow-hidden">
          <MarkdownPreview content={preview} className="h-full" />
        </div>
      </div>
      <DocumentGenerateBar
        generateLabel="Gerar Documento"
        generating={generating}
        onGenerate={handleGenerateDocument}
        generateDisabled={messages.length === 0}
        projectId={project.id}
        documentType="SPEC_REFINED"
        content={preview}
        onContentUpdate={(text) => {
          setPreview(text);
          setHasSaved(true);
        }}
        hasSaved={hasSaved}
      />
      {error && <p className="text-sm text-red-600">{error}</p>}
    </div>
  );
}
