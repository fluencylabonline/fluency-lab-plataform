/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

const { sendNotification } = vi.hoisted(() => ({ sendNotification: vi.fn() }));

vi.mock("web-push", () => {
  const mock = { setVapidDetails: vi.fn(), sendNotification };
  return { default: mock, ...mock };
});
vi.mock("@/lib/db", () => ({ db: {} }));
vi.mock("../notification.repository", () => ({
  notificationRepository: {
    createMany: vi.fn(),
    findSubscriptionsByUserIds: vi.fn().mockResolvedValue([
      { userId: "u1", endpoint: "e1", subscription: { endpoint: "e1" } },
    ]),
    filterUserIdsByPreference: vi.fn(),
    deleteSubscription: vi.fn(),
  },
}));

import { notificationService } from "../notification.service";
import { notificationRepository } from "../notification.repository";

const params = {
  title: "t",
  body: "b",
  targetType: "specific" as const,
  userIds: ["u1"],
  channels: { inApp: true, push: true },
};

describe("notificationService — horário de silêncio", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers({ toFake: ["Date"] });
  });
  afterEach(() => vi.useRealTimers());

  it("de madrugada registra o aviso no app mas não envia o push", async () => {
    vi.setSystemTime(new Date("2026-11-01T05:00:00Z")); // 02:00 em Brasília
    await notificationService.sendNotification(params as any);

    expect(notificationRepository.createMany).toHaveBeenCalledTimes(1);
    expect(sendNotification).not.toHaveBeenCalled();
  });

  it("durante o dia envia o push normalmente", async () => {
    vi.setSystemTime(new Date("2026-11-01T15:00:00Z")); // 12:00 em Brasília
    await notificationService.sendNotification(params as any);

    expect(notificationRepository.createMany).toHaveBeenCalledTimes(1);
    expect(sendNotification).toHaveBeenCalledTimes(1);
  });
});
