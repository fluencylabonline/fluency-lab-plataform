import { createHash } from "crypto";

/**
 * Generates a SHA-256 hash for a given content string or object.
 */
export function generateHash(content: string | object): string {
  const input = typeof content === "string" ? content : JSON.stringify(content);
  return createHash("sha256").update(input).digest("hex");
}

/**
 * Approximates the number of tokens in a string.
 * Generally, 1 token is ~4 characters in English, ~3 in Portuguese.
 * Using 3.5 as a safe average for mixed content.
 */
export function approximateTokens(text: string): number {
  if (!text) return 0;
  return Math.ceil(text.length / 3.5);
}

/**
 * Truncates a string safely to not exceed a maximum token count.
 */
export function truncateByTokens(text: string, maxTokens: number): string {
  if (!text) return "";
  const currentTokens = approximateTokens(text);
  if (currentTokens <= maxTokens) return text;

  // Approximate character limit based on token ratio
  const maxChars = Math.floor(maxTokens * 3.5);
  // Truncate and add indicator
  return text.slice(0, maxChars) + "\n\n[...TRUNCATED DUE TO LENGTH...]";
}
