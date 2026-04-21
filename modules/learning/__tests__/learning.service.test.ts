import { describe, it, expect, vi, beforeEach } from 'vitest';
import { learningService } from '../learning.service';
import { learningRepository } from '../learning.repository';

// Mock repository
vi.mock('../learning.repository', () => ({
  learningRepository: {
    findProgressByItem: vi.fn(),
    createProgress: vi.fn(),
    updateProgress: vi.fn(),
  },
}));

describe('LearningService - Cross-Context Mastery', () => {
  const studentId = 'student-123';
  const itemId = 'EN_HELLO_VOCABULARY';

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should not mark as MASTERED if practiced 3 times in the SAME lesson', async () => {
    const lessonId = 'lesson-A';

    // Initial state: active item with no contexts
    const mockProgress = {
      id: 'progress-1',
      studentId,
      itemId,
      status: 'ACTIVE',
      consecutiveCorrect: 0,
      interval: 0,
      easeFactor: 2.5,
      passedContextsIds: [] as string[],
    };

    vi.mocked(learningRepository.findProgressByItem).mockResolvedValue(await (mockProgress as unknown as ReturnType<typeof learningRepository.findProgressByItem>));
    vi.mocked(learningRepository.updateProgress).mockResolvedValue(await ({} as unknown as ReturnType<typeof learningRepository.updateProgress>));

    // First Practice (Success)
    let result = await learningService.recordPracticeResult(studentId, itemId, 5, lessonId);
    expect(result.status).toBe('RECEPTIVE');
    expect(result.distinctContexts).toBe(1);

    // Second Practice (Success, same lesson)
    // Update mock to simulate saved state
    mockProgress.passedContextsIds = [lessonId];
    mockProgress.status = 'RECEPTIVE';
    mockProgress.consecutiveCorrect = 1;

    result = await learningService.recordPracticeResult(studentId, itemId, 5, lessonId);
    expect(result.status).toBe('RECEPTIVE'); // Still Receptive
    expect(result.distinctContexts).toBe(1); // Still 1 distinct context

    // Third Practice (Success, same lesson)
    result = await learningService.recordPracticeResult(studentId, itemId, 5, lessonId);
    expect(result.status).toBe('RECEPTIVE'); // Never moves to MASTERED
    expect(result.distinctContexts).toBe(1);
  });

  it('should mark as MASTERED if practiced in 3 DIFFERENT lessons', async () => {
    // Stage 1: Lesson A
    const progress = {
      id: 'p1',
      studentId,
      itemId,
      status: 'ACTIVE',
      consecutiveCorrect: 0,
      interval: 0,
      easeFactor: 2.5,
      passedContextsIds: [] as string[],
    };
    vi.mocked(learningRepository.findProgressByItem).mockResolvedValueOnce(await (progress as unknown as ReturnType<typeof learningRepository.findProgressByItem>));

    await learningService.recordPracticeResult(studentId, itemId, 5, 'lesson-A');

    // Stage 2: Lesson B
    progress.passedContextsIds = ['lesson-A'];
    progress.status = 'RECEPTIVE';
    progress.consecutiveCorrect = 1;
    vi.mocked(learningRepository.findProgressByItem).mockResolvedValueOnce(await (progress as unknown as ReturnType<typeof learningRepository.findProgressByItem>));

    await learningService.recordPracticeResult(studentId, itemId, 5, 'lesson-B');

    // Stage 3: Lesson C
    progress.passedContextsIds = ['lesson-A', 'lesson-B'];
    progress.status = 'RECEPTIVE';
    progress.consecutiveCorrect = 2;
    vi.mocked(learningRepository.findProgressByItem).mockResolvedValueOnce(await (progress as unknown as ReturnType<typeof learningRepository.findProgressByItem>));

    const finalResult = await learningService.recordPracticeResult(studentId, itemId, 5, 'lesson-C');

    expect(finalResult.status).toBe('MASTERED');
    expect(finalResult.distinctContexts).toBe(3);

    expect(learningRepository.updateProgress).toHaveBeenCalledWith('p1', expect.objectContaining({
      status: 'MASTERED',
      passedContextsIds: ['lesson-A', 'lesson-B', 'lesson-C']
    }));
  });
});
