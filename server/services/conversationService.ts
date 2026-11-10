import { asc, eq } from "drizzle-orm";
import { v4 as uuidv4 } from "uuid";
import { db } from "../db/client.js";
import { aiConversations, messages, milestones } from "../db/schema.js";
import { nowIso } from "../lib/utils.js";

export interface AIConversation {
  id: string;
  projectId: string;
  columnSlug: string;
  createdAt: string;
}

export interface AIMessage {
  id: string;
  conversationId: string;
  role: "user" | "assistant" | "system";
  content: string;
  createdAt: string;
}

export interface Milestone {
  id: string;
  projectId: string;
  percentage: number;
  description: string;
  sortOrder: number;
}

export function getConversationById(id: string): AIConversation | null {
  const rows = db.select().from(aiConversations).where(eq(aiConversations.id, id)).all();
  if (rows.length === 0) return null;
  return rows[0];
}

export function getOrCreateConversation(
  projectId: string,
  columnSlug: string,
): AIConversation {
  const existing = db
    .select()
    .from(aiConversations)
    .where(eq(aiConversations.projectId, projectId))
    .all();

  const match = existing.find((c) => c.columnSlug === columnSlug);
  if (match) return match;

  const conversation: AIConversation = {
    id: uuidv4(),
    projectId,
    columnSlug,
    createdAt: nowIso(),
  };

  db.insert(aiConversations).values(conversation).run();
  return conversation;
}

export function listMessages(conversationId: string): AIMessage[] {
  return db
    .select()
    .from(messages)
    .where(eq(messages.conversationId, conversationId))
    .orderBy(asc(messages.createdAt))
    .all()
    .map((row) => ({
      id: row.id,
      conversationId: row.conversationId,
      role: row.role as AIMessage["role"],
      content: row.content,
      createdAt: row.createdAt,
    }));
}

export function addMessage(
  conversationId: string,
  role: AIMessage["role"],
  content: string,
): AIMessage {
  const message: AIMessage = {
    id: uuidv4(),
    conversationId,
    role,
    content,
    createdAt: nowIso(),
  };
  db.insert(messages).values(message).run();
  return message;
}

export function listMilestones(projectId: string): Milestone[] {
  return db
    .select()
    .from(milestones)
    .where(eq(milestones.projectId, projectId))
    .orderBy(asc(milestones.sortOrder))
    .all();
}

export function replaceMilestones(
  projectId: string,
  items: Omit<Milestone, "id" | "projectId">[],
): Milestone[] {
  db.delete(milestones).where(eq(milestones.projectId, projectId)).run();

  const saved: Milestone[] = items.map((item, index) => ({
    id: uuidv4(),
    projectId,
    percentage: item.percentage,
    description: item.description,
    sortOrder: item.sortOrder ?? index,
  }));

  if (saved.length > 0) {
    db.insert(milestones).values(saved).run();
  }

  return saved;
}
