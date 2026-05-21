import { expect, test, describe } from "vitest";
import { REMINDER_TEMPLATES } from "../reminder-templates";

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
