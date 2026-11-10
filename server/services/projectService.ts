import { asc, eq } from "drizzle-orm";
import { v4 as uuidv4 } from "uuid";
import { db } from "../db/client.js";
import { columns, projects } from "../db/schema.js";
import { ensureProjectDir } from "../lib/fs.js";
import { nowIso, parseJson } from "../lib/utils.js";

export type ColumnSlug =
  | "projetos"
  | "analise-inicial"
  | "especificacao-refinada"
  | "documento-requisitos"
  | "planejamento"
  | "ux-ui"
  | "proposta-comercial"
  | "aguardando-cliente"
  | "em-desenvolvimento"
  | "finalizados";

export interface Project {
  id: string;
  title: string;
  currentColumn: ColumnSlug;
  priority: string;
  tags: string[];
  statusColor?: string | null;
  columnData: Record<string, unknown>;
  proposalValue?: number | null;
  estimatedHours?: number | null;
  estimatedDays?: number | null;
  expectedFinishDate?: string | null;
  movedToCurrentColumnAt: string;
  createdAt: string;
  updatedAt: string;
}

export interface KanbanColumn {
  id: string;
  name: string;
  slug: ColumnSlug;
  sortOrder: number;
}

const DEFAULT_COLUMN_DATA = {
  projetos: { sourcePlatform: "", sourceUrl: "", shortDescription: "" },
};

function mapProject(row: typeof projects.$inferSelect): Project {
  return {
    id: row.id,
    title: row.title,
    currentColumn: row.currentColumn as ColumnSlug,
    priority: row.priority,
    tags: parseJson<string[]>(row.tags, []),
    statusColor: row.statusColor,
    columnData: parseJson(row.columnData, {}),
    proposalValue: row.proposalValue,
    estimatedHours: row.estimatedHours,
    estimatedDays: row.estimatedDays,
    expectedFinishDate: row.expectedFinishDate,
    movedToCurrentColumnAt: row.movedToCurrentColumnAt,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

export function listColumns(): KanbanColumn[] {
  return db
    .select()
    .from(columns)
    .orderBy(asc(columns.sortOrder))
    .all()
    .map((row) => ({
      id: row.id,
      name: row.name,
      slug: row.slug as ColumnSlug,
      sortOrder: row.sortOrder,
    }));
}

export function listProjects(): Project[] {
  return db
    .select()
    .from(projects)
    .orderBy(asc(projects.createdAt))
    .all()
    .map(mapProject);
}

export function getProject(id: string): Project | null {
  const rows = db.select().from(projects).where(eq(projects.id, id)).all();
  if (rows.length === 0) return null;
  return mapProject(rows[0]);
}

export interface CreateProjectInput {
  title: string;
  sourcePlatform: string;
  sourceUrl: string;
  shortDescription?: string;
}

function assertProjectBasics(input: CreateProjectInput): void {
  if (!input.title?.trim()) throw new Error("O título é obrigatório");
  if (!input.sourcePlatform?.trim()) throw new Error("A plataforma é obrigatória");
  if (!input.sourceUrl?.trim()) throw new Error("A URL é obrigatória");
}

export function createProject(input: CreateProjectInput): Project {
  assertProjectBasics(input);
  const id = uuidv4();
  const timestamp = nowIso();
  ensureProjectDir(id);

  const columnData = {
    ...DEFAULT_COLUMN_DATA.projetos,
    sourcePlatform: input.sourcePlatform ?? "",
    sourceUrl: input.sourceUrl ?? "",
    shortDescription: input.shortDescription ?? "",
  };

  const project = {
    id,
    title: input.title,
    currentColumn: "projetos" as ColumnSlug,
    priority: "medium",
    tags: "[]",
    statusColor: null,
    columnData: JSON.stringify(columnData),
    proposalValue: null,
    estimatedHours: null,
    estimatedDays: null,
    expectedFinishDate: null,
    movedToCurrentColumnAt: timestamp,
    createdAt: timestamp,
    updatedAt: timestamp,
  };

  db.insert(projects).values(project).run();
  return mapProject(project);
}

export function updateProject(
  id: string,
  patch: Partial<
    Pick<
      Project,
      | "title"
      | "priority"
      | "tags"
      | "statusColor"
      | "columnData"
      | "proposalValue"
      | "estimatedHours"
      | "estimatedDays"
      | "expectedFinishDate"
    >
  >,
): Project {
  const current = getProject(id);
  if (!current) throw new Error("Projeto não encontrado");

  const mergedColumnData = patch.columnData
    ? { ...current.columnData, ...patch.columnData }
    : current.columnData;

  const updated = {
    title: patch.title ?? current.title,
    priority: patch.priority ?? current.priority,
    tags: JSON.stringify(patch.tags ?? current.tags),
    statusColor: patch.statusColor ?? current.statusColor,
    columnData: JSON.stringify(mergedColumnData),
    proposalValue: patch.proposalValue ?? current.proposalValue,
    estimatedHours: patch.estimatedHours ?? current.estimatedHours,
    estimatedDays: patch.estimatedDays ?? current.estimatedDays,
    expectedFinishDate: patch.expectedFinishDate ?? current.expectedFinishDate,
    updatedAt: nowIso(),
  };

  db.update(projects).set(updated).where(eq(projects.id, id)).run();
  return getProject(id)!;
}

export function moveProject(id: string, targetColumn: ColumnSlug): Project {
  const current = getProject(id);
  if (!current) throw new Error("Projeto não encontrado");

  const timestamp = nowIso();
  let columnData: Record<string, unknown> = { ...current.columnData };

  if (targetColumn === "aguardando-cliente") {
    columnData = { ...columnData, movedAt: timestamp };
  }

  if (targetColumn === "em-desenvolvimento" && current.currentColumn !== "em-desenvolvimento") {
    const existing = columnData as {
      startedAt?: string;
      expectedFinishDate?: string;
      estimatedDays?: number;
    };
    columnData = {
      ...columnData,
      startedAt: existing.startedAt ?? timestamp,
      expectedFinishDate:
        existing.expectedFinishDate ??
        current.expectedFinishDate ??
        new Date(Date.now() + (current.estimatedDays ?? 30) * 86400000).toISOString(),
      estimatedDays: existing.estimatedDays ?? current.estimatedDays ?? 30,
    };
  }

  db.update(projects)
    .set({
      currentColumn: targetColumn,
      columnData: JSON.stringify(columnData),
      movedToCurrentColumnAt: timestamp,
      updatedAt: timestamp,
    })
    .where(eq(projects.id, id))
    .run();

  return getProject(id)!;
}

export function deleteProject(id: string): void {
  db.delete(projects).where(eq(projects.id, id)).run();
}
