import { describe, it, expect } from "vitest";
import {
  brtCivilDate,
  dueCivilDate,
  monthsPastDue,
  isLastDayOfMonth,
  civilDaysBetween,
  addCivilDays,
  brtDayRangeUtc,
  isUnderPolicy,
} from "../billing.dates";

describe("billing.dates — calendário da política de inadimplência", () => {
  it("usa o dia civil de Brasília para 'hoje' (UTC-3)", () => {
    // 02:59 UTC do dia 1 ainda é dia 31 em Brasília
    expect(brtCivilDate(new Date("2026-11-01T02:59:00Z"))).toEqual({ year: 2026, month: 9, day: 31 });
    // 03:00 UTC (horário do cron de cobrança) já é dia 1
    expect(brtCivilDate(new Date("2026-11-01T03:00:00Z"))).toEqual({ year: 2026, month: 10, day: 1 });
  });

  it("lê o vencimento pelas partes UTC (gravado com startOfDay em UTC)", () => {
    expect(dueCivilDate(new Date("2026-10-01T00:00:00Z"))).toEqual({ year: 2026, month: 9, day: 1 });
  });

  it("conta meses de atraso: 0 no mês do vencimento, 1 no bloqueio, 2 no cancelamento", () => {
    const due = new Date("2026-10-10T00:00:00Z");
    expect(monthsPastDue(due, { year: 2026, month: 9, day: 31 })).toBe(0);
    expect(monthsPastDue(due, { year: 2026, month: 10, day: 1 })).toBe(1);
    expect(monthsPastDue(due, { year: 2026, month: 10, day: 30 })).toBe(1);
    expect(monthsPastDue(due, { year: 2026, month: 11, day: 1 })).toBe(2);
  });

  it("atravessa a virada de ano", () => {
    const due = new Date("2026-12-05T00:00:00Z");
    expect(monthsPastDue(due, { year: 2027, month: 0, day: 1 })).toBe(1);
    expect(monthsPastDue(due, { year: 2027, month: 1, day: 1 })).toBe(2);
  });

  it("detecta o último dia do mês, inclusive fevereiro", () => {
    expect(isLastDayOfMonth({ year: 2026, month: 9, day: 31 })).toBe(true);
    expect(isLastDayOfMonth({ year: 2026, month: 9, day: 30 })).toBe(false);
    expect(isLastDayOfMonth({ year: 2026, month: 1, day: 28 })).toBe(true);
    expect(isLastDayOfMonth({ year: 2028, month: 1, day: 28 })).toBe(false); // bissexto
  });

  it("conta dias corridos e soma dias atravessando o mês", () => {
    expect(civilDaysBetween({ year: 2026, month: 9, day: 10 }, { year: 2026, month: 9, day: 13 })).toBe(3);
    expect(addCivilDays({ year: 2026, month: 9, day: 31 }, 1)).toEqual({ year: 2026, month: 10, day: 1 });
  });

  it("converte o dia de Brasília num intervalo UTC", () => {
    const { start, end } = brtDayRangeUtc({ year: 2026, month: 10, day: 1 });
    expect(start.toISOString()).toBe("2026-11-01T03:00:00.000Z");
    expect(end.toISOString()).toBe("2026-11-02T02:59:59.999Z");
  });

  it("só aplica a política a parcelas a partir da data de início", () => {
    const start = new Date("2026-11-01T00:00:00Z");
    expect(isUnderPolicy(new Date("2026-10-31T00:00:00Z"), start)).toBe(false);
    expect(isUnderPolicy(new Date("2026-11-01T00:00:00Z"), start)).toBe(true);
    expect(isUnderPolicy(new Date("2026-11-10T00:00:00Z"), null)).toBe(false);
  });
});
