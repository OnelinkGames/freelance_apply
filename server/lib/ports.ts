export const DEFAULT_BACKEND_PORT = 3001;
export const DEFAULT_FRONTEND_PORT = 5173;

export function parsePort(value: string | undefined, fallback: number): number {
  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed < 1 || parsed > 65535) {
    return fallback;
  }
  return parsed;
}

export function getBackendPort(env: Record<string, string | undefined> = process.env): number {
  return parsePort(env.BACKEND_PORT, DEFAULT_BACKEND_PORT);
}

export function getFrontendPort(env: Record<string, string | undefined> = process.env): number {
  return parsePort(env.FRONTEND_PORT, DEFAULT_FRONTEND_PORT);
}
