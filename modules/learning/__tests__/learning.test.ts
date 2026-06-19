import { expect, test, describe } from "vitest";
import { REMINDER_TEMPLATES } from "../reminder-templates";
import { getLocalTimeDetails, isSameDayInTimeZone } from "../learning.service";

describe("Duolingo-Style Reminder Templates", () => {
  test("deve conter todas as categorias necessárias", () => {
    expect(REMINDER_TEMPLATES.daily).toBeDefined();
    expect(REMINDER_TEMPLATES.streak).toBeDefined();
    expect(REMINDER_TEMPLATES.roadmap).toBeDefined();
  });

  test("deve conter mais de 20 templates no total para garantir variedade", () => {
    const totalTemplates = 
      REMINDER_TEMPLATES.daily.length +
      REMINDER_TEMPLATES.streak.length +
      REMINDER_TEMPLATES.roadmap.length;
    
    expect(totalTemplates).toBeGreaterThanOrEqual(20);
  });

  test("deve substituir os placeholders {name} e {streak} corretamente", () => {
    const student = { name: "Matheus Fernandes", streakCount: 5 };
    const firstName = student.name.split(" ")[0];

    const streakTemplate = REMINDER_TEMPLATES.streak[0];
    
    const title = streakTemplate.title
      .replace(/{name}/g, firstName)
      .replace(/{streak}/g, String(student.streakCount));
    
    const body = streakTemplate.body
      .replace(/{name}/g, firstName)
      .replace(/{streak}/g, String(student.streakCount));

    expect(title).toContain("🔥");
    expect(body).toContain("5");
    expect(body).not.toContain("{streak}");
  });

  test("todas as frases devem ter placeholders corretos formatados sem erros", () => {
    const student = { name: "Maria Clara", streakCount: 12 };
    const firstName = student.name.split(" ")[0];

    const allCategories = ["daily", "streak", "roadmap"] as const;

    for (const cat of allCategories) {
      const templates = REMINDER_TEMPLATES[cat];
      for (const t of templates) {
        const title = t.title
          .replace(/{name}/g, firstName)
          .replace(/{streak}/g, String(student.streakCount));
        const body = t.body
          .replace(/{name}/g, firstName)
          .replace(/{streak}/g, String(student.streakCount));

        expect(title).not.toContain("{name}");
        expect(title).not.toContain("{streak}");
        expect(body).not.toContain("{name}");
        expect(body).not.toContain("{streak}");
      }
    }
  });
});

describe("Timezone Helpers", () => {
  test("getLocalTimeDetails deve retornar horas corretas no fuso horário do Brasil", () => {
    // 2026-06-18 23:00:00 UTC = 2026-06-18 20:00:00 America/Sao_Paulo (UTC-3)
    const date = new Date("2026-06-18T23:00:00Z");
    const details = getLocalTimeDetails(date, "America/Sao_Paulo");
    
    expect(details.year).toBe(2026);
    expect(details.month).toBe(6); // June
    expect(details.day).toBe(18);
    expect(details.hour).toBe(20);
  });

  test("isSameDayInTimeZone deve comparar corretamente datas no fuso horário do Brasil", () => {
    // 2026-06-19 00:30 UTC é 2026-06-18 21:30 no fuso de São Paulo
    const date1 = new Date("2026-06-19T00:30:00Z");
    // 2026-06-18 23:00 UTC é 2026-06-18 20:00 no fuso de São Paulo
    const date2 = new Date("2026-06-18T23:00:00Z");
    
    // Devem ser o mesmo dia (18) em São Paulo
    expect(isSameDayInTimeZone(date1, date2, "America/Sao_Paulo")).toBe(true);

    // 2026-06-19 04:00 UTC é 2026-06-19 01:00 no fuso de São Paulo
    const date3 = new Date("2026-06-19T04:00:00Z");
    
    // São dias diferentes (18 vs 19) em São Paulo
    expect(isSameDayInTimeZone(date1, date3, "America/Sao_Paulo")).toBe(false);
  });
});

