import { describe, it, expect } from "vitest";
import { isQuietHours, brtHourMinute } from "../quiet-hours";

// Brasília = UTC-3 o ano todo (sem horário de verão)
describe("quiet-hours — silêncio de 00:00 às 07:00 (Brasília)", () => {
  it("converte UTC para a hora de Brasília", () => {
    expect(brtHourMinute(new Date("2026-11-01T03:00:00Z"))).toEqual({ hour: 0, minute: 0 });
    expect(brtHourMinute(new Date("2026-11-01T02:59:00Z"))).toEqual({ hour: 23, minute: 59 });
    expect(brtHourMinute(new Date("2026-11-01T10:30:00Z"))).toEqual({ hour: 7, minute: 30 });
  });

  it("é silêncio de meia-noite até 06:59", () => {
    expect(isQuietHours(new Date("2026-11-01T03:00:00Z"))).toBe(true); // 00:00
    expect(isQuietHours(new Date("2026-11-01T04:00:00Z"))).toBe(true); // 01:00 (cron de contratos antigo)
    expect(isQuietHours(new Date("2026-11-01T09:59:00Z"))).toBe(true); // 06:59
  });

  it("libera a partir das 07:00 até 23:59", () => {
    expect(isQuietHours(new Date("2026-11-01T10:00:00Z"))).toBe(false); // 07:00
    expect(isQuietHours(new Date("2026-11-01T12:00:00Z"))).toBe(false); // 09:00 (novo cron de cobrança)
    expect(isQuietHours(new Date("2026-11-01T00:00:00Z"))).toBe(false); // 21:00 (cron de aulas bloqueadas)
    expect(isQuietHours(new Date("2026-11-01T02:59:00Z"))).toBe(false); // 23:59
  });
});
