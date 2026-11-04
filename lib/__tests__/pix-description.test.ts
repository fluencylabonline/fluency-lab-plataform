import { describe, it, expect } from "vitest";

import { buildPixDescription, sanitizePixText, PIX_DESCRIPTION_MAX } from "../pix-description";

describe("buildPixDescription", () => {
  it("preserva a parcela e corta só o nome do plano", () => {
    const d = buildPixDescription("Mensalidade", "English Classes Intensivo Premium", "3/12");
    expect(d.length).toBeLessThanOrEqual(PIX_DESCRIPTION_MAX);
    expect(d.startsWith("Mensalidade ")).toBe(true);
    expect(d.endsWith(" 3/12")).toBe(true);
  });

  it("remove colchetes e acentos que o provedor recusa", () => {
    expect(sanitizePixText("[TESTE] Inglês Ação")).toBe("TESTE Ingles Acao");
    const d = buildPixDescription("Taxa Cancelamento", "[TESTE] English Classes USD");
    expect(d).not.toMatch(/[[\]]/);
    expect(d.length).toBeLessThanOrEqual(PIX_DESCRIPTION_MAX);
  });

  it("mantém nomes curtos inteiros", () => {
    expect(buildPixDescription("Mensalidade", "Basic", "1/6")).toBe("Mensalidade Basic 1/6");
  });
});
