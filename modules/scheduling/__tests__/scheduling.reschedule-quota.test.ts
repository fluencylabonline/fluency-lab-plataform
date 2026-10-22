import { describe, it, expect } from "vitest";
import { countQuotaReschedules, RESCHEDULE_MONTHLY_LIMIT } from "../reschedule-quota";

describe("countQuotaReschedules", () => {
  it("reagendamento com crédito não gasta a cota", () => {
    expect(countQuotaReschedules([{ creditId: "cr-1" }, { creditId: "cr-2" }])).toBe(0);
  });

  it("reagendamento sem crédito gasta a cota", () => {
    expect(countQuotaReschedules([{ creditId: null }, { creditId: null }])).toBe(2);
  });

  it("mistura: só os sem crédito contam", () => {
    expect(countQuotaReschedules([{ creditId: "cr-1" }, { creditId: null }, { creditId: "cr-2" }])).toBe(1);
  });

  it("sem reagendamentos, a cota está zerada", () => {
    expect(countQuotaReschedules([])).toBe(0);
  });

  it("dois reagendamentos com crédito não esgotam a cota de 2", () => {
    const used = countQuotaReschedules([{ creditId: "cr-1" }, { creditId: "cr-2" }]);
    expect(used >= RESCHEDULE_MONTHLY_LIMIT).toBe(false);
  });
});
