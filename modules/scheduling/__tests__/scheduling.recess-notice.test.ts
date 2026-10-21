import { describe, it, expect } from "vitest";
import { countUpcomingRecessClasses, recessNoticeCount } from "../recess-notice";

const now = new Date("2026-10-21T12:00:00Z");
const inDays = (d: number) => new Date(now.getTime() + d * 86_400_000);

describe("countUpcomingRecessClasses", () => {
  it("conta só as aulas dos próximos 14 dias", () => {
    const classes = [{ startAt: inDays(1) }, { startAt: inDays(14) }, { startAt: inDays(15) }];
    expect(countUpcomingRecessClasses(classes, now)).toBe(2);
  });

  it("ignora aulas passadas", () => {
    expect(countUpcomingRecessClasses([{ startAt: inDays(-7) }, { startAt: inDays(-1) }], now)).toBe(0);
  });

  it("aceita datas em string (vindas do cache)", () => {
    expect(countUpcomingRecessClasses([{ startAt: inDays(3).toISOString() }], now)).toBe(1);
  });
});

describe("recessNoticeCount", () => {
  it("mostra o cartão com uma única aula futura", () => {
    expect(recessNoticeCount([{ startAt: inDays(2) }], now)).toBe(1);
  });

  it("devolve só o total das aulas futuras da janela", () => {
    expect(recessNoticeCount([{ startAt: inDays(2) }, { startAt: inDays(9) }, { startAt: inDays(-3) }], now)).toBe(2);
  });

  it("não mostra o cartão se todas as aulas são passadas", () => {
    expect(recessNoticeCount([{ startAt: inDays(-10) }, { startAt: inDays(-20) }], now)).toBe(0);
  });

  it("sem nenhuma aula em recesso, não mostra o cartão", () => {
    expect(recessNoticeCount([], now)).toBe(0);
  });

  it("não mostra se as duas aulas estão além de duas semanas", () => {
    expect(recessNoticeCount([{ startAt: inDays(20) }, { startAt: inDays(30) }], now)).toBe(0);
  });
});
