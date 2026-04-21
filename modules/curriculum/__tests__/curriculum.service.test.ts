import { describe, it, expect, vi, beforeEach } from 'vitest';
import { curriculumService } from '../curriculum.service';
import { curriculumRepository } from '../curriculum.repository';

vi.mock('../curriculum.repository', () => ({
  curriculumRepository: {
    findLessonById: vi.fn(),
    createLesson: vi.fn(),
    linkItemToLesson: vi.fn(),
    deleteLesson: vi.fn(),
    updateLesson: vi.fn(),
  },
}));

vi.mock('@/modules/ai/ai.service', () => ({
  aiService: {
    getEmbeddings: vi.fn().mockResolvedValue([0.1, 0.2]),
  },
}));

describe('CurriculumService - Versioning & Practice Items', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should clone a lesson and increment version', async () => {
    const oldLesson = {
      id: 'old-uuid',
      title: 'Original Lesson',
      version: 1,
      languageId: 'lang-1',
      difficulty: 'A1',
      items: [
        { item: { id: 'item-1' }, priority: 'CORE' }
      ]
    };

    const newLesson = { id: 'new-uuid', version: 2 };

    vi.mocked(curriculumRepository.findLessonById).mockResolvedValue(await (oldLesson as unknown as ReturnType<typeof curriculumRepository.findLessonById>));
    vi.mocked(curriculumRepository.createLesson).mockResolvedValue(await (newLesson as unknown as ReturnType<typeof curriculumRepository.createLesson>));

    const result = await curriculumService.cloneLesson('old-uuid');

    expect(result.version).toBe(2);
    expect(curriculumRepository.createLesson).toHaveBeenCalledWith(expect.objectContaining({
      version: 2,
      title: 'Original Lesson'
    }));

    // Check if items were cloned
    expect(curriculumRepository.linkItemToLesson).toHaveBeenCalledWith('new-uuid', 'item-1', 'CORE');

    // Check if old one was soft-deleted
    expect(curriculumRepository.deleteLesson).toHaveBeenCalledWith('old-uuid');
  });

  it('should ensure useTTS is true for practice items in finalizeLesson', async () => {
    const lesson = {
      id: 'lesson-1',
      items: [
        {
          item: {
            id: 'item-1',
            type: 'VOCABULARY',
            lemma: 'Hello',
            metadata: {
              meanings: [{ definition: 'Greeting' }],
              examples: ['Hello world']
            }
          }
        }
      ],
      contentText: 'Hello',
      contentHash: 'some-hash'
    };

    vi.mocked(curriculumRepository.findLessonById).mockResolvedValue(await (lesson as unknown as ReturnType<typeof curriculumRepository.findLessonById>));
    vi.mocked(curriculumRepository.updateLesson).mockResolvedValue(await ({} as unknown as ReturnType<typeof curriculumRepository.updateLesson>));

    const result = await curriculumService.finalizeLesson('lesson-1');

    const flashcard = result.practiceItems.find(p => p.renderMode === 'flashcard_visual');
    const gapFill = result.practiceItems.find(p => p.renderMode === 'gap_fill_listening');

    expect(flashcard?.flashcard?.useTTS).toBe(true);
    expect(gapFill?.gapFill?.useTTS).toBe(true);
  });
});
