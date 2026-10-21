import { describe, it, expect } from "vitest";
import { pickPendingTeacherCancellation } from "../reschedule-notice";

const now = new Date("2026-10-21T12:00:00Z");
const at = (days: number) => new Date(now.getTime() + days * 86_400_000);

const canceled = (id: string, days: number) => ({ id, startAt: at(days), teacherId: "t1" });
const credit = (id: string, expiresInDays: number) => ({ id, expiresAt: at(expiresInDays) });

const base = {
  canceled: [canceled("c1", 1)],
  replacedClassIds: [] as string[],
  realClassStarts: [] as Date[],
  credits: [credit("cr1", 20)],
  now,
};

describe("pickPendingTeacherCancellation", () => {
  it("mostra a aula cancelada que ainda vai acontecer", () => {
    const result = pickPendingTeacherCancellation(base);
    expect(result?.classId).toBe("c1");
    expect(result?.creditId).toBe("cr1");
    expect(result?.teacherId).toBe("t1");
  });

  it("continua mostrando depois da hora da aula cancelada, até a próxima aula começar", () => {
    const result = pickPendingTeacherCancellation({
      ...base,
      canceled: [canceled("c1", -2)],
      realClassStarts: [at(5)], // a próxima aula é daqui a 5 dias
    });
    expect(result?.classId).toBe("c1");
  });

  it("volta ao normal quando a próxima aula já começou", () => {
    const result = pickPendingTeacherCancellation({
      ...base,
      canceled: [canceled("c1", -8)],
      realClassStarts: [at(-1)], // a aula seguinte aconteceu ontem
    });
    expect(result).toBeNull();
  });

  it("uma aula futura não fecha a janela", () => {
    const result = pickPendingTeacherCancellation({ ...base, realClassStarts: [at(7)] });
    expect(result?.classId).toBe("c1");
  });

  it("não mostra aula que já foi reposta", () => {
    expect(pickPendingTeacherCancellation({ ...base, replacedClassIds: ["c1"] })).toBeNull();
  });

  it("sem crédito de cancelamento válido, não mostra", () => {
    expect(pickPendingTeacherCancellation({ ...base, credits: [] })).toBeNull();
    expect(pickPendingTeacherCancellation({ ...base, credits: [credit("cr1", -1)] })).toBeNull();
  });

  it("mostra uma aula por vez: a cancelada mais recente", () => {
    const result = pickPendingTeacherCancellation({
      ...base,
      canceled: [canceled("old", -3), canceled("new", 1)],
    });
    expect(result?.classId).toBe("new");
  });

  it("se a mais recente já foi reposta, mostra a anterior que ainda está na janela", () => {
    const result = pickPendingTeacherCancellation({
      ...base,
      canceled: [canceled("old", -3), canceled("new", 1)],
      replacedClassIds: ["new"],
      realClassStarts: [at(7)],
    });
    expect(result?.classId).toBe("old");
  });

  it("devolve o crédito que vence primeiro", () => {
    const result = pickPendingTeacherCancellation({
      ...base,
      credits: [credit("late", 25), credit("soon", 4), credit("expired", -2)],
    });
    expect(result?.creditId).toBe("soon");
    expect(result?.creditExpiresAt.getTime()).toBe(at(4).getTime());
  });

  it("aceita datas em string (vindas do cache)", () => {
    const result = pickPendingTeacherCancellation({
      ...base,
      canceled: [{ id: "c1", startAt: at(1).toISOString(), teacherId: "t1" }],
      credits: [{ id: "cr1", expiresAt: at(20).toISOString() }],
      realClassStarts: [at(8).toISOString()],
    });
    expect(result?.classId).toBe("c1");
  });

  it("sem aulas canceladas, não mostra nada", () => {
    expect(pickPendingTeacherCancellation({ ...base, canceled: [] })).toBeNull();
  });
});
