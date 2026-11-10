export const COLUMN_SLUGS = [
  "projetos",
  "analise-inicial",
  "especificacao-refinada",
  "documento-requisitos",
  "planejamento",
  "ux-ui",
  "proposta-comercial",
  "aguardando-cliente",
  "em-desenvolvimento",
  "finalizados",
] as const;

export type ColumnSlug = (typeof COLUMN_SLUGS)[number];

export type DocumentType =
  | "SPEC_REFINED"
  | "REQUIREMENTS"
  | "PLANNING"
  | "UX"
  | "PROPOSAL";

export interface Comment {
  id: string;
  projectId: string;
  text: string;
  createdAt: string;
}

export interface Milestone {
  id: string;
  projectId: string;
  percentage: number;
  description: string;
  sortOrder: number;
}

export interface Attachment {
  id: string;
  projectId: string;
  url: string;
  type: string;
  notes?: string | null;
}

export interface DocumentRecord {
  id: string;
  projectId: string;
  type: DocumentType;
  content: string;
  filePath?: string | null;
  createdAt: string;
}

export interface AIMessage {
  id: string;
  conversationId: string;
  role: "user" | "assistant" | "system";
  content: string;
  createdAt: string;
}

export interface AIConversation {
  id: string;
  projectId: string;
  columnSlug: string;
  createdAt: string;
}

export interface ProjetosData {
  sourcePlatform: string;
  sourceUrl: string;
  shortDescription: string;
  clientName?: string;
  budgetMin?: number;
  budgetMax?: number;
  postedAt?: string;
  notes?: string;
}

export interface AnaliseInicialData {
  overview: string;
  objectives: string;
  technologies: string[];
  assumptions: string;
  risks: string;
  estimatedComplexity: "Baixa" | "Média" | "Alta" | "Muito Alta";
  estimatedValue: number;
}

export interface UxUiData {
  figmaUrl?: string;
  inspirationUrls: string[];
  notes?: string;
  /** Evita sobrescrever `notes` da coluna Projetos */
  uxNotes?: string;
}

export interface PropostaComercialData {
  proposedValue: number;
  currency: string;
  estimatedHours: number;
  estimatedDays: number;
  paymentModel: "Valor Fechado" | "Hora Trabalhada" | "Mensalidade" | "Por Entrega";
  warrantyDays?: number;
  notes?: string;
}

export interface AguardandoClienteData {
  movedAt?: string;
}

export interface EmDesenvolvimentoData {
  startedAt: string;
  expectedFinishDate: string;
  estimatedDays: number;
}

export type ColumnDataMap = {
  projetos: ProjetosData;
  "analise-inicial": AnaliseInicialData;
  "especificacao-refinada": Record<string, never>;
  "documento-requisitos": Record<string, never>;
  planejamento: Record<string, never>;
  "ux-ui": UxUiData;
  "proposta-comercial": PropostaComercialData;
  "aguardando-cliente": AguardandoClienteData;
  "em-desenvolvimento": EmDesenvolvimentoData;
  finalizados: Record<string, never>;
};

export interface KanbanColumn {
  id: string;
  name: string;
  slug: ColumnSlug;
  sortOrder: number;
}

export interface Project {
  id: string;
  title: string;
  currentColumn: ColumnSlug;
  priority: string;
  tags: string[];
  statusColor?: string | null;
  columnData: Partial<ColumnDataMap[ColumnSlug]>;
  proposalValue?: number | null;
  estimatedHours?: number | null;
  estimatedDays?: number | null;
  expectedFinishDate?: string | null;
  movedToCurrentColumnAt: string;
  createdAt: string;
  updatedAt: string;
}

export interface EnvConfig {
  provider: string;
  has_api_key: boolean;
  api_key_masked: string | null;
  default_model: string;
  usd_to_brl: number;
  /** @deprecated use default_model */
  openai_model: string;
  openai_api_key?: string | null;
  anthropic_api_key?: string | null;
  google_api_key?: string | null;
  deepseek_api_key?: string | null;
}

export const DEFAULT_COLUMN_DATA: Record<ColumnSlug, ColumnDataMap[ColumnSlug]> = {
  projetos: {
    sourcePlatform: "",
    sourceUrl: "",
    shortDescription: "",
  },
  "analise-inicial": {
    overview: "",
    objectives: "",
    technologies: [],
    assumptions: "",
    risks: "",
    estimatedComplexity: "Média",
    estimatedValue: 0,
  },
  "especificacao-refinada": {},
  "documento-requisitos": {},
  planejamento: {},
  "ux-ui": {
    inspirationUrls: [],
  },
  "proposta-comercial": {
    proposedValue: 0,
    currency: "BRL",
    estimatedHours: 0,
    estimatedDays: 0,
    paymentModel: "Valor Fechado",
  },
  "aguardando-cliente": {},
  "em-desenvolvimento": {
    startedAt: new Date().toISOString(),
    expectedFinishDate: new Date().toISOString(),
    estimatedDays: 0,
  },
  finalizados: {},
};

export const DOCUMENT_FILENAMES: Record<DocumentType, string> = {
  SPEC_REFINED: "specification.md",
  REQUIREMENTS: "requirements.md",
  PLANNING: "planning.md",
  UX: "ux-guidelines.md",
  PROPOSAL: "proposal.md",
};

export const DOCUMENT_LABELS: Record<DocumentType, string> = {
  SPEC_REFINED: "Especificação Refinada",
  REQUIREMENTS: "Documento de Requisitos",
  PLANNING: "Planejamento",
  UX: "UX/UI",
  PROPOSAL: "Proposta Comercial",
};
