import { describe, it, expect } from "vitest";
import {
  holidayRecessCampaignFor,
  holidayRecessCampaignKey,
  holidayRecessDates,
  isHolidayRecessPeriod,
} from "../holiday-recess";

// Datas em UTC; Brasília é UTC-3.
const brt = (iso: string) => new Date(`${iso}-03:00`);
const noEnv = {};

describe("isHolidayRecessPeriod", () => {
  it("fica fora do período até 17/12", () => {
    expect(isHolidayRecessPeriod(brt("2026-12-17T23:59:00"), noEnv)).toBe(false);
  });

  it("começa em 18/12 à meia-noite de Brasília", () => {
    expect(isHolidayRecessPeriod(brt("2026-12-18T00:00:00"), noEnv)).toBe(true);
  });

  it("atravessa a virada do ano", () => {
    expect(isHolidayRecessPeriod(brt("2026-12-31T23:00:00"), noEnv)).toBe(true);
    expect(isHolidayRecessPeriod(brt("2027-01-01T08:00:00"), noEnv)).toBe(true);
  });

  it("vai até 14/01 e termina em 15/01", () => {
    expect(isHolidayRecessPeriod(brt("2027-01-14T23:59:00"), noEnv)).toBe(true);
    expect(isHolidayRecessPeriod(brt("2027-01-15T00:00:00"), noEnv)).toBe(false);
  });

  it("usa o horário de Brasília, não UTC", () => {
    // 18/12 01:00 UTC ainda é 17/12 22:00 em Brasília.
    expect(isHolidayRecessPeriod(new Date("2026-12-18T01:00:00Z"), noEnv)).toBe(false);
  });

  it("fora do período no resto do ano", () => {
    expect(isHolidayRecessPeriod(brt("2026-10-21T12:00:00"), noEnv)).toBe(false);
  });

  it("HOLIDAY_RECESS_FORCE liga o período fora de produção", () => {
    const date = brt("2026-10-21T12:00:00");
    expect(isHolidayRecessPeriod(date, { HOLIDAY_RECESS_FORCE: "true", VERCEL_ENV: "preview" })).toBe(true);
    expect(isHolidayRecessPeriod(date, { HOLIDAY_RECESS_FORCE: "true", VERCEL_ENV: "production" })).toBe(false);
  });
});

describe("holidayRecessCampaignFor", () => {
  it("identifica os quatro dias de envio", () => {
    expect(holidayRecessCampaignFor(brt("2026-12-01T09:00:00"))).toBe("dec-01");
    expect(holidayRecessCampaignFor(brt("2026-12-15T09:00:00"))).toBe("dec-15");
    expect(holidayRecessCampaignFor(brt("2027-01-01T09:00:00"))).toBe("jan-01");
    expect(holidayRecessCampaignFor(brt("2027-01-10T09:00:00"))).toBe("jan-10");
  });

  it("retorna null nos outros dias", () => {
    expect(holidayRecessCampaignFor(brt("2026-12-02T09:00:00"))).toBeNull();
    expect(holidayRecessCampaignFor(brt("2026-10-21T09:00:00"))).toBeNull();
  });
});

describe("holidayRecessCampaignKey e datas", () => {
  it("chave por ano e campanha", () => {
    expect(holidayRecessCampaignKey("jan-10", brt("2027-01-10T09:00:00"))).toBe("2027-jan-10");
  });

  it("textos de início e volta", () => {
    expect(holidayRecessDates(brt("2026-12-01T09:00:00"))).toMatchObject({ firstDayOff: "18/12", endDay: "14/01", returnDay: "15/01", startYear: 2026 });
    expect(holidayRecessDates(brt("2027-01-10T09:00:00")).startYear).toBe(2026);
  });
});
