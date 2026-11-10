import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { getAppDataDir } from "./fs.js";

const KEY_FILENAME = ".encryption-key";
const ALGORITHM = "aes-256-gcm";
const IV_LENGTH = 12;

function getKeyPath(): string {
  return path.join(getAppDataDir(), KEY_FILENAME);
}

function getOrCreateEncryptionKey(): Buffer {
  const keyPath = getKeyPath();
  const dir = path.dirname(keyPath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  if (fs.existsSync(keyPath)) {
    const raw = fs.readFileSync(keyPath, "utf-8").trim();
    const key = Buffer.from(raw, "hex");
    if (key.length === 32) return key;
  }

  const key = crypto.randomBytes(32);
  fs.writeFileSync(keyPath, key.toString("hex"), { mode: 0o600 });
  return key;
}

/** Formato: base64(iv):base64(authTag):base64(ciphertext) */
export function encryptSecret(plaintext: string): string {
  const key = getOrCreateEncryptionKey();
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
  const encrypted = Buffer.concat([cipher.update(plaintext, "utf8"), cipher.final()]);
  const authTag = cipher.getAuthTag();
  return `${iv.toString("base64")}:${authTag.toString("base64")}:${encrypted.toString("base64")}`;
}

export function decryptSecret(payload: string): string {
  const [ivB64, tagB64, dataB64] = payload.split(":");
  if (!ivB64 || !tagB64 || !dataB64) {
    throw new Error("Payload criptografado inválido");
  }

  const key = getOrCreateEncryptionKey();
  const iv = Buffer.from(ivB64, "base64");
  const authTag = Buffer.from(tagB64, "base64");
  const encrypted = Buffer.from(dataB64, "base64");
  const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
  decipher.setAuthTag(authTag);
  return Buffer.concat([decipher.update(encrypted), decipher.final()]).toString("utf8");
}

export function maskApiKey(key: string): string {
  if (key.length <= 8) return "*".repeat(key.length);
  return `${key.slice(0, 4)}...${key.slice(-4)}`;
}
