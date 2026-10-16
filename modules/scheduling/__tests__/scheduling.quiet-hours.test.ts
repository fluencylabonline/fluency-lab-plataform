/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

vi.mock("@/lib/db", () => ({ db: {} }));
vi.mock("../scheduling.repository", () => ({
  schedulingRepository: {
    findOverdueClasses: vi.fn().mockResolvedValue([]),
    findClassesForReminders: vi.fn().mockResolvedValue([]),
    markRemindersAsSent: vi.fn(),
    updateStatusBulk: vi.fn(),
  },
}));
vi.mock("@/lib/rbac", () => ({ hasPermission: vi.fn() }));
vi.mock("@/modules/user/user.service", () => ({ userService: { getUserById: vi.fn() } }));
vi.mock("@/modules/curriculum/curriculum.service", () => ({ curriculumService: {} }));
vi.mock("@/modules/learning/learning.service", () => ({ learningService: {} }));
vi.mock("@/modules/communication/communication.service", () => ({ communicationService: {} }));
vi.mock("@/modules/notification/notification.service", () => ({
  notificationService: { sendNotification: vi.fn() },
}));
vi.mock("@/lib/cryptography", () => ({ decrypt: vi.fn() }));

import { schedulingService } from "../scheduling.service";
import { schedulingRepository } from "../scheduling.repository";
import { notificationService } from "@/modules/notification/notification.service";

const HOUR = 3600 * 1000;

describe("scheduling — horário de silêncio (00:00-07:00 Brasília)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers({ toFake: ["Date"] });
  });
  afterEach(() => vi.useRealTimers());

  it("de madrugada não envia lembretes nem marca nada como enviado", async () => {
    vi.setSystemTime(new Date("2026-11-01T06:00:00Z")); // 03:00 em Brasília
    expect(await schedulingService.sendClassReminders()).toBe(0);
    expect(schedulingRepository.findClassesForReminders).not.toHaveBeenCalled();
    expect(schedulingRepository.markRemindersAsSent).not.toHaveBeenCalled();
    expect(notificationService.sendNotification).not.toHaveBeenCalled();
  });

  it("de madrugada não processa aulas atrasadas (nem muda o status)", async () => {
    vi.setSystemTime(new Date("2026-11-01T06:00:00Z"));
    expect(await schedulingService.processOverdueClasses()).toBe(0);
    expect(schedulingRepository.findOverdueClasses).not.toHaveBeenCalled();
    expect(schedulingRepository.updateStatusBulk).not.toHaveBeenCalled();
  });

  it("às 07:00 recupera os lembretes de 24h das aulas da madrugada de amanhã", async () => {
    const now = new Date("2026-11-01T10:00:00Z"); // 07:00 em Brasília
    vi.setSystemTime(now);
    await schedulingService.sendClassReminders();

    const call24h = (schedulingRepository.findClassesForReminders as any).mock.calls.find((c: any[]) => c[0] === "24h");
    // Janela volta até 17h à frente: pega as aulas de amanhã a partir de 00:00 (Brasília)
    expect(call24h[1].getTime()).toBe(now.getTime() + 17 * HOUR);
  });

  it("durante o dia mantém a janela normal de 23h a 25h", async () => {
    const now = new Date("2026-11-01T15:00:00Z"); // 12:00 em Brasília
    vi.setSystemTime(now);
    await schedulingService.sendClassReminders();

    const call24h = (schedulingRepository.findClassesForReminders as any).mock.calls.find((c: any[]) => c[0] === "24h");
    expect(call24h[1].getTime()).toBe(now.getTime() + 23 * HOUR);
    expect(call24h[2].getTime()).toBe(now.getTime() + 25 * HOUR);
  });
});
