import { describe, it, expect, vi, beforeEach } from 'vitest';
import { learningService } from '../learning.service';
import { learningRepository } from '../learning.repository';
import { addDays } from 'date-fns';
import { studentItemProgress } from '../learning.schema';

vi.mock('../learning.repository', () => ({
  learningRepository: {
    findProgressByItem: vi.fn(),
    createProgress: vi.fn(),
    updateProgress: vi.fn(),
  },
}));

describe('LearningService - Offline Sync & Retroactivity', () => {
  const studentId = 'student-sync';
  const itemId = 'VOC_SYNC_TEST';
  const lessonId = 'lesson-sync';

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should calculate nextReviewDate based on practicedAt (2 days ago)', async () => {
    const twoDaysAgo = addDays(new Date(), -2);

    vi.mocked(learningRepository.findProgressByItem).mockResolvedValue(undefined);
    vi.mocked(learningRepository.createProgress).mockResolvedValue({
      id: 'p-new',
      studentId,
      itemId,
      status: 'ACTIVE',
      consecutiveCorrect: 0,
      interval: 0,
      easeFactor: 2.5,
      passedContextsIds: [],
    } as unknown as typeof studentItemProgress.$inferSelect);

    const result = await learningService.recordPracticeResult(
      studentId,
      itemId,
      5,
      lessonId,
      twoDaysAgo
    );

    // If q=5 and it's the first time, interval is 1.
    // nextReviewDate should be twoDaysAgo + 1 day = 1 day ago.
    const expectedDate = addDays(twoDaysAgo, 1);

    expect(result?.nextReviewDate.getDate()).toBe(expectedDate.getDate());
    expect(learningRepository.updateProgress).toHaveBeenCalledWith('p-new', expect.objectContaining({
      lastReviewedAt: twoDaysAgo,
      nextReviewDate: expect.any(Date)
    }));
  });

  it('should reject practices older than 7 days', async () => {
    const tenDaysAgo = addDays(new Date(), -10);

    const result = await learningService.recordPracticeResult(
      studentId,
      itemId,
      5,
      lessonId,
      tenDaysAgo
    );

    expect(result).toBeNull();
    expect(learningRepository.updateProgress).not.toHaveBeenCalled();
  });

  it('should process a batch of results in chronological order', async () => {
    const day1 = addDays(new Date(), -3);
    const day2 = addDays(new Date(), -2);

    vi.mocked(learningRepository.findProgressByItem).mockResolvedValue(undefined);

    // Spy BEFORE call
    const spy = vi.spyOn(learningService, 'recordPracticeResult');

    const batch = [
      { itemId, q: 5, lessonId, practicedAt: day2 }, // Sent out of order
      { itemId, q: 4, lessonId, practicedAt: day1 },
    ];

    const result = await learningService.recordBatchResult(studentId, batch);

    expect(result.count).toBe(2);

    expect(spy).toHaveBeenNthCalledWith(1, studentId, itemId, 4, lessonId, day1);
    expect(spy).toHaveBeenNthCalledWith(2, studentId, itemId, 5, lessonId, day2);
  });
});
