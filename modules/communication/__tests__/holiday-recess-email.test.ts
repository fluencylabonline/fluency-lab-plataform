import { describe, it, expect } from "vitest";
import { buildHolidayRecessEmail } from "../templates/holiday-recess-translations";

const startDates = { firstDayOff: "18 de dezembro", lastDayOff: "14 de janeiro", returnDay: "15 de janeiro" };

describe("buildHolidayRecessEmail", () => {
  it("aviso do recesso para o aluno traz o período e o link das aulas gravadas", () => {
    const email = buildHolidayRecessEmail(
      { kind: "studentStart", name: "Ana Souza", ...startDates, reminder: false, classesUrl: "https://app/hub/student/holiday-classes" },
      "pt"
    );
    expect(email.heading).toBe("Olá, Ana!");
    expect(email.subject).toContain("18 de dezembro a 14 de janeiro");
    expect(email.button?.url).toBe("https://app/hub/student/holiday-classes");
  });

  it("o lembrete de 15/12 marca o assunto como lembrete", () => {
    const email = buildHolidayRecessEmail({ kind: "teacherStart", name: "Bia", ...startDates, reminder: true }, "pt");
    expect(email.subject.startsWith("Lembrete:")).toBe(true);
    expect(email.button).toBeUndefined();
  });

  it("volta das aulas mostra data, horário e professor da próxima aula", () => {
    const email = buildHolidayRecessEmail(
      {
        kind: "studentReturn",
        name: "Caio",
        returnDay: "15 de janeiro",
        nextClass: { dateTime: "quinta-feira, 15 de janeiro, 14:00", teacherName: "Prof. Lia" },
        scheduleUrl: "https://app/hub/student/schedule",
      },
      "pt"
    );
    expect(email.highlight).toEqual(["Sua próxima aula: quinta-feira, 15 de janeiro, 14:00 com Prof. Lia."]);
  });

  it("sem aula marcada, orienta a conferir a agenda", () => {
    const email = buildHolidayRecessEmail(
      { kind: "studentReturn", name: "Caio", returnDay: "January 15", nextClass: null, scheduleUrl: "https://app" },
      "en"
    );
    expect(email.highlight?.[0]).toContain("couldn't find a scheduled class");
    expect(email.subject).toBe("Live classes are back on January 15");
  });
});
