export interface PromptPlaceholderDef {
  key: string;
  token: string;
  label: string;
  column: string;
  fields: string[];
  example: string;
  description: string;
}

export const PROMPT_PLACEHOLDERS: PromptPlaceholderDef[] = [
  {
    key: "project_name",
    token: "{{project_name}}",
    label: "Nome do projeto",
    column: "Projetos",
    fields: ["Título"],
    example: "Sistema de gestão para oficina mecânica",
    description: "Título do card definido ao criar ou editar o projeto na primeira coluna.",
  },
  {
    key: "initial_spec",
    token: "{{initial_spec}}",
    label: "Contexto inicial",
    column: "Análise Inicial",
    fields: ["Visão geral", "Objetivos", "Notas"],
    example:
      "Visão geral: app web para controle de ordens de serviço.\n\nObjetivos: reduzir retrabalho e centralizar histórico do veículo.",
    description:
      "Texto combinado da Análise Inicial. Se estiver vazio, usa dados de UX/UI (Figma, notas, inspirações) como fallback.",
  },
  {
    key: "documents",
    token: "{{documents}}",
    label: "Documentos do projeto",
    column: "Várias etapas",
    fields: [
      "Especificação Refinada (specification.md)",
      "Documento de Requisitos (requirements.md)",
      "Planejamento (planning.md)",
      "Proposta Comercial (proposal.md)",
    ],
    example: "## Especificação Refinada\n…\n\n## Requisitos\n…",
    description:
      "Concatenação de todos os documentos Markdown já gerados, na ordem do fluxo. Etapas sem documento são omitidas.",
  },
  {
    key: "requirements",
    token: "{{requirements}}",
    label: "Documento de requisitos",
    column: "Documento de Requisitos",
    fields: ["Conteúdo de requirements.md"],
    example: "# Visão Geral\n…\n# Requisitos Funcionais\nRF01: …",
    description: "Última versão do documento de requisitos gerado pela IA ou salvo no projeto.",
  },
  {
    key: "planning",
    token: "{{planning}}",
    label: "Planejamento",
    column: "Planejamento",
    fields: ["Conteúdo de planning.md"],
    example: "# Backlog\n## Epic: Cadastro\n…\n# QA\n…",
    description: "Última versão do documento de planejamento (backlog e QA) do projeto.",
  },
];

import { toast } from "@/stores/toastStore";

export function copyPlaceholderToken(token: string) {
  navigator.clipboard.writeText(token).then(
    () => toast.success("Placeholder copiado", token),
    () => toast.error("Não foi possível copiar"),
  );
}
