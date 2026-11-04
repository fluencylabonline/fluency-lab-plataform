/**
 * Varredura estática das chaves next-intl usadas no código (usada pelo teste
 * lib/__tests__/i18n-keys.test.ts). Considera só o caso seguro: arquivo com
 * `const t = useTranslations("Ns")` / `await getTranslations("Ns")` e chamadas
 * `t("chave")` com literal fechado. Chaves dinâmicas (template, concatenação) são ignoradas.
 */
import fs from "fs";
import path from "path";

export type Messages = Record<string, unknown>;

export function flattenKeys(obj: Messages, prefix = ""): string[] {
  return Object.entries(obj).flatMap(([k, v]) => {
    const key = prefix ? `${prefix}.${k}` : k;
    if (Array.isArray(v)) return [key, ...v.map((_, i) => `${key}.${i}`)];
    return v && typeof v === "object" ? [key, ...flattenKeys(v as Messages, key)] : [key];
  });
}

function walk(dir: string, out: string[] = []): string[] {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.name === "node_modules" || entry.name.startsWith(".") || entry.name === "__tests__" || entry.name === "i18n-key-scan.ts") continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full, out);
    else if (/\.(tsx?|jsx?)$/.test(entry.name)) out.push(full);
  }
  return out;
}

const DECL = /const\s+(\w+)\s*=\s*(?:await\s+)?(?:useTranslations|getTranslations)\(\s*(?:"([\w.]+)"|\{[^}]*namespace:\s*"([\w.]+)"[^}]*\})?\s*\)/g;

export function findUsedKeys(root: string, dirs: string[]): { file: string; key: string }[] {
  const result: { file: string; key: string }[] = [];
  for (const d of dirs) {
    const abs = path.join(root, d);
    if (!fs.existsSync(abs)) continue;
    for (const file of walk(abs)) {
      const src = fs.readFileSync(file, "utf8");
      const decls = new Map<string, Set<string>>();
      for (const m of src.matchAll(DECL)) {
        const ns = m[2] ?? m[3] ?? "";
        if (!decls.has(m[1])) decls.set(m[1], new Set());
        decls.get(m[1])!.add(ns);
      }
      for (const [fn, namespaces] of decls) {
        // Mesmo nome de função com namespaces diferentes no arquivo: ambíguo, pula.
        if (namespaces.size !== 1) continue;
        const ns = [...namespaces][0];
        const call = new RegExp(`(?<![\\w.])${fn}(?:\\.rich|\\.raw|\\.markup)?\\(\\s*"([\\w.-]+)"\\s*[,)]`, "g");
        for (const c of src.matchAll(call)) {
          result.push({ file: path.relative(root, file), key: ns ? `${ns}.${c[1]}` : c[1] });
        }
      }
    }
  }
  return result;
}
