import { describe, it, expect } from "vitest";
import {
  buildSlotRange,
  buildSummarySentence,
  buildTimeGrid,
  getDefaultFrequency,
  getFrequencyLabel,
  getSlotEndTime,
  isPastStart,
  isValidTime,
  minutesToTime,
  overlapsAny,
  slotsOverlap,
  sortTimes,
  timeToMinutes,
} from "../slot-wizard.utils";

describe("slot-wizard.utils — horários", () => {
  it("converte entre HH:mm e minutos", () => {
    expect(timeToMinutes("09:15")).toBe(555);
    expect(minutesToTime(555)).toBe("09:15");
    expect(minutesToTime(0)).toBe("00:00");
  });

  it("soma 45 minutos ao início, inclusive virando a hora", () => {
    expect(getSlotEndTime("09:00")).toBe("09:45");
    expect(getSlotEndTime("09:30")).toBe("10:15");
    expect(getSlotEndTime("21:15")).toBe("22:00");
  });

  it("valida o formato HH:mm", () => {
    expect(isValidTime("09:30")).toBe(true);
    expect(isValidTime("24:00")).toBe(false);
    expect(isValidTime("9h30")).toBe(false);
  });

  it("ordena horários cronologicamente", () => {
    expect(sortTimes(["14:00", "09:15", "10:30"])).toEqual(["09:15", "10:30", "14:00"]);
  });
});

describe("slot-wizard.utils — grade", () => {
  const grid = buildTimeGrid();

  it("gera inícios a cada 15 min entre 06:00 e 21:15", () => {
    expect(grid[0]).toBe("06:00");
    expect(grid[1]).toBe("06:15");
    expect(grid[grid.length - 1]).toBe("21:15");
    expect(grid).toHaveLength(62);
  });

  it("garante que toda aula termina até 22:00", () => {
    for (const start of grid) {
      expect(timeToMinutes(getSlotEndTime(start))).toBeLessThanOrEqual(22 * 60);
    }
  });
});

describe("slot-wizard.utils — sobreposição", () => {
  it("detecta aulas de 45 min que se cruzam", () => {
    expect(slotsOverlap("09:00", "09:15")).toBe(true);
    expect(slotsOverlap("09:00", "09:30")).toBe(true);
    expect(slotsOverlap("09:00", "09:44")).toBe(true);
  });

  it("aceita aulas coladas ou separadas", () => {
    expect(slotsOverlap("09:00", "09:45")).toBe(false);
    expect(slotsOverlap("09:00", "10:30")).toBe(false);
  });

  it("overlapsAny ignora o próprio horário", () => {
    expect(overlapsAny("09:00", ["09:00"])).toBe(false);
    expect(overlapsAny("09:15", ["09:00"])).toBe(true);
    expect(overlapsAny("10:00", ["09:00", "11:00"])).toBe(false);
  });
});

describe("slot-wizard.utils — horários passados", () => {
  const now = new Date(2026, 9, 21, 10, 30);

  it("só considera passado se o dia escolhido for hoje", () => {
    expect(isPastStart(new Date(2026, 9, 22), "07:00", now)).toBe(false);
    expect(isPastStart(new Date(2026, 9, 21), "07:00", now)).toBe(true);
    expect(isPastStart(new Date(2026, 9, 21), "10:30", now)).toBe(true);
    expect(isPastStart(new Date(2026, 9, 21), "10:45", now)).toBe(false);
  });
});

describe("slot-wizard.utils — intervalo da aula", () => {
  it("monta um intervalo de 45 minutos no dia escolhido", () => {
    const { startAt, endAt } = buildSlotRange(new Date(2026, 10, 5), "14:15");
    const start = new Date(startAt);
    const end = new Date(endAt);
    expect(start.getHours()).toBe(14);
    expect(start.getMinutes()).toBe(15);
    expect(end.getTime() - start.getTime()).toBe(45 * 60_000);
  });

  it("não altera a data recebida", () => {
    const date = new Date(2026, 10, 5, 8, 0);
    buildSlotRange(date, "14:15");
    expect(date.getHours()).toBe(8);
  });
});

describe("slot-wizard.utils — frequência", () => {
  it("usa Único como padrão da reposição e Semanal como padrão do normal", () => {
    expect(getDefaultFrequency("REPOSICAO")).toBe("NONE");
    expect(getDefaultFrequency("NORMAL")).toBe("WEEKLY");
  });

  it("mostra o dia da semana com a concordância correta em português", () => {
    expect(getFrequencyLabel("WEEKLY", 3, "pt")).toBe("Semanal (toda quarta)");
    expect(getFrequencyLabel("WEEKLY", 6, "pt")).toBe("Semanal (todo sábado)");
    expect(getFrequencyLabel("BIWEEKLY", 4, "pt")).toBe("Quinzenal (toda quinta)");
    expect(getFrequencyLabel("MONTHLY", 6, "pt")).toBe("Mensal (no sábado)");
    expect(getFrequencyLabel("MONTHLY", 3, "pt")).toBe("Mensal (na quarta)");
  });

  it("mostra o dia da semana em inglês", () => {
    expect(getFrequencyLabel("WEEKLY", 3, "en")).toBe("Weekly (every Wednesday)");
    expect(getFrequencyLabel("NONE", 3, "en")).toBe("One time (this date only)");
  });
});

describe("slot-wizard.utils — frase do resumo", () => {
  it("descreve horário recorrente com vários horários", () => {
    expect(
      buildSummarySentence({
        frequency: "WEEKLY",
        dayIndex: 3,
        dateLabel: "05/11/2026",
        startTimes: ["15:00", "14:00"],
        locale: "pt",
      })
    ).toBe("Toda quarta, às 14:00–14:45 e 15:00–15:45, a partir de 05/11/2026.");
  });

  it("descreve horário único", () => {
    expect(
      buildSummarySentence({
        frequency: "NONE",
        dayIndex: 6,
        dateLabel: "07/11/2026",
        startTimes: ["09:00"],
        locale: "pt",
      })
    ).toBe("Em 07/11/2026 (sábado), às 09:00–09:45.");
  });

  it("descreve em inglês", () => {
    expect(
      buildSummarySentence({
        frequency: "BIWEEKLY",
        dayIndex: 1,
        dateLabel: "11/02/2026",
        startTimes: ["10:00"],
        locale: "en",
      })
    ).toBe("Every other Monday, at 10:00–10:45, starting 11/02/2026.");
  });
});
