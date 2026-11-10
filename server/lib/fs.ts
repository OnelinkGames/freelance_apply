import fs from "node:fs";
import path from "node:path";

const DATA_DIR = process.env.DATA_DIR ?? path.join(process.cwd(), "data");

export function getAppDataDir(): string {
  return DATA_DIR;
}

export function ensureProjectDir(projectId: string): string {
  const projectDir = path.join(DATA_DIR, "projects", projectId);
  fs.mkdirSync(projectDir, { recursive: true });
  return projectDir;
}

export function writeMarkdownFile(projectId: string, filename: string, content: string): string {
  const projectDir = ensureProjectDir(projectId);
  const filePath = path.join(projectDir, filename);
  fs.writeFileSync(filePath, content, "utf-8");
  return filePath;
}

export function readMarkdownFile(projectId: string, filename: string): string {
  const filePath = path.join(DATA_DIR, "projects", projectId, filename);
  return fs.readFileSync(filePath, "utf-8");
}
