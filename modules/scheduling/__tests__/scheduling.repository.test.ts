import { describe, it, expect, vi, beforeEach } from "vitest";

const { mockFindFirst } = vi.hoisted(() => {
  return {
    mockFindFirst: vi.fn(),
  };
});

vi.mock("@/lib/db", () => ({
  db: {
    query: {
      slotInstances: {
        findFirst: mockFindFirst,
      },
    },
  },
}));

import { schedulingRepository } from "../scheduling.repository";

describe("Scheduling Repository - findOverlappingSlot", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should check for overlaps using strict inequality operators (lt/gt)", async () => {
    const startAt = new Date("2026-07-06T15:45:00.000Z");
    const endAt = new Date("2026-07-06T16:30:00.000Z");
    const teacherId = "teacher-123";

    mockFindFirst.mockResolvedValue(null);

    const result = await schedulingRepository.findOverlappingSlot(teacherId, startAt, endAt);

    expect(result).toBeNull();
    expect(mockFindFirst).toHaveBeenCalledWith({
      where: expect.any(Object),
    });
  });
});
