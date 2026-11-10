import type { IndicatorColor } from "./colors";
import { getProgressColor, getWaitingColor } from "./colors";

export function diffInDays(from: string, to: Date = new Date()): number {
  const start = new Date(from);
  const ms = to.getTime() - start.getTime();
  return Math.max(0, Math.floor(ms / (1000 * 60 * 60 * 24)));
}

export function getWaitingDays(movedAt: string): number {
  return diffInDays(movedAt);
}

export function getDevelopmentProgress(
  startedAt: string,
  expectedFinishDate: string,
): { elapsedDays: number; totalDays: number; percent: number; color: IndicatorColor } {
  const start = new Date(startedAt);
  const end = new Date(expectedFinishDate);
  const now = new Date();

  const totalMs = Math.max(end.getTime() - start.getTime(), 1);
  const elapsedMs = Math.max(now.getTime() - start.getTime(), 0);
  const totalDays = Math.max(Math.ceil(totalMs / (1000 * 60 * 60 * 24)), 1);
  const elapsedDays = Math.floor(elapsedMs / (1000 * 60 * 60 * 24));
  const percent = Math.min(100, Math.round((elapsedMs / totalMs) * 100));

  return {
    elapsedDays,
    totalDays,
    percent,
    color: getProgressColor(percent),
  };
}

export function getWaitingIndicator(movedAt: string) {
  const days = getWaitingDays(movedAt);
  return { days, color: getWaitingColor(days) };
}

export function formatDate(iso: string | null | undefined): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("pt-BR");
}
