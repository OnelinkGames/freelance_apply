import { eq } from "drizzle-orm";
import { v4 as uuidv4 } from "uuid";
import { db } from "../db/client.js";
import { documents } from "../db/schema.js";
import { writeMarkdownFile } from "../lib/fs.js";
import { nowIso } from "../lib/utils.js";

export type DocumentType = "SPEC_REFINED" | "REQUIREMENTS" | "PLANNING" | "UX" | "PROPOSAL";

export const DOCUMENT_FILENAMES: Record<DocumentType, string> = {
  SPEC_REFINED: "specification.md",
  REQUIREMENTS: "requirements.md",
  PLANNING: "planning.md",
  UX: "ux-guidelines.md",
  PROPOSAL: "proposal.md",
};

export interface DocumentRecord {
  id: string;
  projectId: string;
  type: DocumentType;
  content: string;
  filePath?: string | null;
  createdAt: string;
}

export function listDocuments(projectId: string): DocumentRecord[] {
  return db
    .select()
    .from(documents)
    .where(eq(documents.projectId, projectId))
    .all()
    .map((row) => ({
      id: row.id,
      projectId: row.projectId,
      type: row.type as DocumentType,
      content: row.content,
      filePath: row.filePath,
      createdAt: row.createdAt,
    }));
}

export function getLatestDocument(projectId: string, type: DocumentType): DocumentRecord | null {
  const all = listDocuments(projectId).filter((d) => d.type === type);
  if (all.length === 0) return null;
  return all.sort((a, b) => b.createdAt.localeCompare(a.createdAt))[0];
}

export function saveDocument(
  projectId: string,
  type: DocumentType,
  content: string,
): DocumentRecord {
  const filename = DOCUMENT_FILENAMES[type];
  const filePath = writeMarkdownFile(projectId, filename, content);

  const record: DocumentRecord = {
    id: uuidv4(),
    projectId,
    type,
    content,
    filePath,
    createdAt: nowIso(),
  };

  db.insert(documents).values(record).run();
  return record;
}
