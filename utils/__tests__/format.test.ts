import { describe, it, expect } from "vitest";
import { formatCurrency } from "../format";

// Intl usa espaço não separável entre "R$" e o número em pt-BR.
const norm = (s: string) => s.replace(/\u00a0/g, " ");

describe("formatCurrency", () => {
  it("usa BRL por padrão, qualquer que seja o idioma", () => {
    expect(norm(formatCurrency(46200, "pt"))).toBe("R$ 462,00");
    expect(norm(formatCurrency(46200, "en"))).toBe("R$462.00");
  });

  it("respeita a moeda do dado", () => {
    expect(formatCurrency(46200, "en", "USD")).toBe("$462.00");
    expect(norm(formatCurrency(46200, "pt", "USD"))).toBe("US$ 462,00");
  });
});
