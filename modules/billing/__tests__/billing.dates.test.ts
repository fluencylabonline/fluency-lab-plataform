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
  renewalDueDates,
} from "../billing.dates";

const iso = (dates: Date[]) => dates.map((d) => d.toISOString().slice(0, 10));

describe("billing.dates — renovação de contrato", () => {
  it("continua no mês seguinte à última parcela, no dia de vencimento do aluno", () => {
    // Assinatura 13/06–13/12 com última parcela em 05/11, renovada em 13/12
    const dates = renewalDueDates({
      lastDueDate: new Date("2026-11-05T00:00:00Z"),
      dueDay: 5,
      count: 3,
      today: { year: 2026, month: 11, day: 1 },
    });
    expect(iso(dates)).toEqual(["2026-12-05", "2027-01-05", "2027-02-05"]);
  });

  it("não cria parcela vencida: o dia já passado no mês corrente vira hoje", () => {
    const dates = renewalDueDates({
      lastDueDate: new Date("2026-11-05T00:00:00Z"),
      dueDay: 5,
      count: 3,
      today: { year: 2026, month: 11, day: 13 },
    });
    expect(iso(dates)).toEqual(["2026-12-13", "2027-01-05", "2027-02-05"]);
  });

  it("nunca começa num mês passado, mesmo se a assinatura antiga parou antes", () => {
    // Última parcela em setembro, renovação só em novembro
    const dates = renewalDueDates({
      lastDueDate: new Date("2026-09-10T00:00:00Z"),
      dueDay: 10,
      count: 2,
      today: { year: 2026, month: 10, day: 5 },
    });
    expect(iso(dates)).toEqual(["2026-11-10", "2026-12-10"]);
  });

  it("atravessa a virada de ano e começa no mês corrente sem parcela anterior", () => {
    const dates = renewalDueDates({
      lastDueDate: null,
      dueDay: 15,
      count: 3,
      today: { year: 2026, month: 11, day: 1 },
    });
    expect(iso(dates)).toEqual(["2026-12-15", "2027-01-15", "2027-02-15"]);
  });

  it("a 1ª parcela levada para hoje continua antes da 2ª", () => {
    const dates = renewalDueDates({
      lastDueDate: new Date("2026-11-01T00:00:00Z"),
      dueDay: 1,
      count: 2,
      today: { year: 2026, month: 11, day: 30 },
    });
    expect(iso(dates)).toEqual(["2026-12-30", "2027-01-01"]);
  });
});

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
