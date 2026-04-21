import crypto from "crypto";
import { env } from "@/env";

/**
 * Facilitador de Criptografia (FluencyLab)
 * 
 * Implementa AES-256-GCM para criptografia autenticada de dados PII
 * e HMAC-SHA256 para Blind Indexing (busca segura).
 */

const ALGORITHM = "aes-256-gcm";
const IV_LENGTH = 12;
const KEY = Buffer.from(env.ENCRYPTION_KEY, "hex");

/**
 * Criptografa um texto puro usando AES-256-GCM.
 * Retorna uma string no formato iv:encrypted:tag
 */
export function encrypt(text: string): string {
  if (!text) return "";
  
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(ALGORITHM, KEY, iv);
  
  let encrypted = cipher.update(text, "utf8", "hex");
  encrypted += cipher.final("hex");
  
  const tag = cipher.getAuthTag();
  
  return `${iv.toString("hex")}:${encrypted}:${tag.toString("hex")}`;
}

/**
 * Descriptografa uma hash gerada pela função encrypt.
 */
export function decrypt(hash: string): string {
  if (!hash || !hash.includes(":")) return "";
  
  const [ivHex, encrypted, tagHex] = hash.split(":");
  
  const iv = Buffer.from(ivHex, "hex");
  const tag = Buffer.from(tagHex, "hex");
  const decipher = crypto.createDecipheriv(ALGORITHM, KEY, iv);
  
  decipher.setAuthTag(tag);
  
  let decrypted = decipher.update(encrypted, "hex", "utf8");
  decrypted += decipher.final("utf8");
  
  return decrypted;
}

/**
 * Gera um Blind Index (HMAC) para permitir a busca de dados sensíveis
 * sem descriptografar a base de dados (ex: buscar por CPF).
 */
export function generateBlindIndex(text: string): string {
  if (!text) return "";
  // Normalizamos o texto (removemos espaços, pontuação, lowercase) antes de gerar o hash
  const normalized = text.replace(/\D/g, "").toLowerCase();
  return crypto.createHmac("sha256", KEY).update(normalized).digest("hex");
}

/**
 * Gera um hash SHA-256 para integridade de documentos (Assinatura Digital).
 */
export function generateIntegrityHash(content: string, metadata: Record<string, unknown>): string {
  const data = content + JSON.stringify(metadata);
  return crypto.createHash("sha256").update(data).digest("hex");
}
