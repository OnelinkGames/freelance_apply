import { useEffect, useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { MarkdownPreview } from "@/components/ai/MarkdownPreview";
import { DocumentGenerateBar } from "@/components/documents/DocumentGenerateBar";
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
import { completeWithAgent } from "@/services/agents/agentService";
import { listMilestones, replaceMilestones } from "@/services/ai/aiConversationService";
import { getLatestDocument, saveDocument } from "@/services/documents/documentService";
import { toast } from "@/stores/toastStore";
import type { Milestone, Project, PropostaComercialData } from "@/types/project";

interface ColumnFormProps {
  project: Project;
  onSave: (patch: Partial<Project>) => Promise<void>;
}

export function PropostaComercialForm({ project, onSave }: ColumnFormProps) {
  const data = (project.columnData ?? {}) as PropostaComercialData;
  const [form, setForm] = useState<PropostaComercialData>({
    proposedValue: data.proposedValue ?? 0,
    currency: data.currency ?? "BRL",
    estimatedHours: data.estimatedHours ?? 0,
    estimatedDays: data.estimatedDays ?? 0,
    paymentModel: data.paymentModel ?? "Valor Fechado",
    warrantyDays: data.warrantyDays,
    notes: data.notes ?? "",
  });
  const [milestones, setMilestones] = useState<Milestone[]>([]);
  const [proposalContent, setProposalContent] = useState("");
  const [generating, setGenerating] = useState(false);
  const [hasProposalSaved, setHasProposalSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const next = (project.columnData ?? {}) as PropostaComercialData;
    setForm({
      proposedValue: next.proposedValue ?? 0,
      currency: next.currency ?? "BRL",
      estimatedHours: next.estimatedHours ?? 0,
      estimatedDays: next.estimatedDays ?? 0,
      paymentModel: next.paymentModel ?? "Valor Fechado",
      warrantyDays: next.warrantyDays,
      notes: next.notes ?? "",
    });
    listMilestones(project.id).then(setMilestones);
    getLatestDocument(project.id, "PROPOSAL").then((doc) => {
      if (doc) {
        setProposalContent(doc.content);
        setHasProposalSaved(true);
      }
    });
  }, [project.id]);

  async function handleSave() {
    await onSave({
      columnData: form,
      proposalValue: form.proposedValue,
      estimatedHours: form.estimatedHours,
      estimatedDays: form.estimatedDays,
    });
    await replaceMilestones(
      project.id,
      milestones.map((m, index) => ({
        percentage: m.percentage,
        description: m.description,
        sortOrder: index,
      })),
    );
  }

  function addMilestone() {
    setMilestones([
      ...milestones,
      {
        id: crypto.randomUUID(),
        projectId: project.id,
        percentage: 0,
        description: "",
        sortOrder: milestones.length,
      },
    ]);
  }

  async function handleGenerateProposal() {
    setGenerating(true);
    setError(null);
    try {
      const requirements = await getLatestDocument(project.id, "REQUIREMENTS");
      if (!requirements) throw new Error("Gere primeiro o Documento de Requisitos");

      const context = JSON.stringify(
        {
          title: project.title,
          ...form,
          milestones: milestones.map((m) => ({ percentage: m.percentage, description: m.description })),
        },
        null,
        2,
      );

      const result = await completeWithAgent({
        projectId: project.id,
        process: "PROPOSAL",
        mode: "generation",
        prompt: `${context}\n\nRequisitos:\n${requirements.content}`,
      });
      const doc = await saveDocument(project.id, "PROPOSAL", result.content);
      setProposalContent(doc.content);
      setHasProposalSaved(true);
      toast.success("Documento gerado", "Proposta comercial salva com sucesso.");
    } catch (err) {
      const message = err instanceof Error ? err.message : "Erro ao gerar proposta";
      setError(message);
      toast.error("Erro ao gerar proposta", message);
    } finally {
      setGenerating(false);
    }
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label>Valor proposto</Label>
          <Input
            type="number"
            value={form.proposedValue}
            onChange={(e) => setForm({ ...form, proposedValue: Number(e.target.value) || 0 })}
          />
        </div>
        <div>
          <Label>Moeda</Label>
          <Input value={form.currency} onChange={(e) => setForm({ ...form, currency: e.target.value })} />
        </div>
        <div>
          <Label>Horas estimadas</Label>
          <Input
            type="number"
            value={form.estimatedHours}
            onChange={(e) => setForm({ ...form, estimatedHours: Number(e.target.value) || 0 })}
          />
        </div>
        <div>
          <Label>Dias estimados</Label>
          <Input
            type="number"
            value={form.estimatedDays}
            onChange={(e) => setForm({ ...form, estimatedDays: Number(e.target.value) || 0 })}
          />
        </div>
      </div>
      <div>
        <Label>Forma de pagamento</Label>
        <Select
          value={form.paymentModel}
          onValueChange={(value) =>
            setForm({ ...form, paymentModel: value as PropostaComercialData["paymentModel"] })
          }
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {["Valor Fechado", "Hora Trabalhada", "Mensalidade", "Por Entrega"].map((item) => (
              <SelectItem key={item} value={item}>
                {item}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div>
        <Label>Garantia (dias)</Label>
        <Input
          type="number"
          value={form.warrantyDays ?? ""}
          onChange={(e) => setForm({ ...form, warrantyDays: Number(e.target.value) || undefined })}
        />
      </div>
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label>Milestones</Label>
          <Button variant="outline" size="sm" onClick={addMilestone}>
            <Plus className="mr-1 h-4 w-4" />
            Adicionar
          </Button>
        </div>
        {milestones.map((milestone, index) => (
          <div key={milestone.id} className="flex gap-2">
            <Input
              type="number"
              className="w-24"
              value={milestone.percentage}
              onChange={(e) => {
                const next = [...milestones];
                next[index] = { ...milestone, percentage: Number(e.target.value) || 0 };
                setMilestones(next);
              }}
              placeholder="%"
            />
            <Input
              value={milestone.description}
              onChange={(e) => {
                const next = [...milestones];
                next[index] = { ...milestone, description: e.target.value };
                setMilestones(next);
              }}
              placeholder="Descrição"
            />
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setMilestones(milestones.filter((_, i) => i !== index))}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        ))}
      </div>
      <div>
        <Label>Notas</Label>
        <Textarea value={form.notes ?? ""} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
      </div>
      <Button onClick={() => void handleSave()}>Salvar dados comerciais</Button>
      <DocumentGenerateBar
        generateLabel="Gerar Proposta"
        generating={generating}
        onGenerate={handleGenerateProposal}
        projectId={project.id}
        documentType="PROPOSAL"
        content={proposalContent}
        onContentUpdate={(text) => {
          setProposalContent(text);
          setHasProposalSaved(true);
        }}
        hasSaved={hasProposalSaved}
      />
      {error && <p className="text-sm text-red-600">{error}</p>}
      {proposalContent && <MarkdownPreview content={proposalContent} className="h-64" />}
    </div>
  );
}
