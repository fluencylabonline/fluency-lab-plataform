import { describe, it, expect, vi, beforeEach } from "vitest";

const returning = vi.fn();
const onConflictDoUpdate = vi.fn(() => ({ returning }));
const values = vi.fn(() => ({ onConflictDoUpdate }));

vi.mock("@/lib/db", () => ({
  db: { insert: vi.fn(() => ({ values })) },
}));

import { checkRateLimit } from "@/lib/rate-limit";
import { db } from "@/lib/db";

describe("checkRateLimit", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("faz um único upsert atômico, sem select prévio", async () => {
    returning.mockResolvedValue([{ count: 1 }]);

    await checkRateLimit("svc", "user-1", 3, 60_000);

    expect(db.insert).toHaveBeenCalledTimes(1);
    expect(values).toHaveBeenCalledWith(expect.objectContaining({ serviceName: "svc", identifier: "user-1", count: 1 }));
    expect(onConflictDoUpdate).toHaveBeenCalledWith(expect.objectContaining({
      set: expect.objectContaining({ count: expect.anything(), windowStart: expect.anything() }),
    }));
  });

  it.each([
    [1, { success: true, remaining: 2 }],
    [3, { success: true, remaining: 0 }],
    [4, { success: false, remaining: 0 }],
  ])("com count %i no banco retorna %o", async (count, expected) => {
    returning.mockResolvedValue([{ count }]);
    expect(await checkRateLimit("svc", "user-1", 3, 60_000)).toEqual(expected);
  });
});
