import { asc, eq } from "drizzle-orm";
import { v4 as uuidv4 } from "uuid";
import { db } from "../db/client.js";
import { comments } from "../db/schema.js";
import { nowIso } from "../lib/utils.js";

export interface Comment {
  id: string;
  projectId: string;
  text: string;
  createdAt: string;
}

export function listComments(projectId: string): Comment[] {
  return db
    .select()
    .from(comments)
    .where(eq(comments.projectId, projectId))
    .orderBy(asc(comments.createdAt))
    .all();
}

export function addComment(projectId: string, text: string): Comment {
  const comment: Comment = {
    id: uuidv4(),
    projectId,
    text,
    createdAt: nowIso(),
  };
  db.insert(comments).values(comment).run();
  return comment;
}

export function deleteComment(id: string): void {
  db.delete(comments).where(eq(comments.id, id)).run();
}
