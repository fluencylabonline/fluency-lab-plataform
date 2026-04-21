import { curriculumRepository } from "./curriculum.repository";
import { aiService } from "@/modules/ai/ai.service";
import { mediaService } from "@/modules/media/media.service";
import crypto from "crypto";
import { CEFRLevel, LearningItemMetadata, PracticeItem } from "./curriculum.types";

export const curriculumService = {
  /**
   * Step 1: Creates a new lesson record.
   */
  async createLesson(data: { title: string, difficulty: CEFRLevel, languageId: string }) {
    const lesson = await curriculumRepository.createLesson({
      ...data,
      status: "draft",
      creationStep: 1
    });
    return lesson;
  },

  /**
   * Step 2: Processes lesson media and generates transcription.
   */
  async processLessonMedia(lessonId: string, mediaUrl: string, userId?: string) {
    const lesson = await curriculumRepository.findLessonById(lessonId);
    if (!lesson) throw new Error("Lesson not found");

    await curriculumRepository.updateLesson(lessonId, {
      status: "processing_items", // Temporary logic status
      creationStep: 2
    });

    try {
      // 1. Transcribe
      const transcription = await aiService.transcribeMedia(mediaUrl, "video", userId);

      // 2. Create Media record
      const media = await curriculumRepository.createMedia({
        url: mediaUrl,
        transcriptionText: transcription.full_text,
        transcriptionTimestamps: transcription.segments,
        status: "pending_review"
      });

      // 3. Update Lesson
      await curriculumRepository.updateLesson(lessonId, {
        mediaId: media.id,
        contentText: transcription.full_text,
        status: "draft", // Reset to draft for next manual review/step
        creationStep: 2
      });

      return { media, transcription };
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Unknown error during transcription";
      await curriculumRepository.updateLesson(lessonId, {
        status: "error",
        errorMessage: `Transcription failed: ${message}`
      });
      throw error;
    }
  },

  /**
   * Step 3: Analyzes lesson content and suggests learning items.
   */
  async analyzeLesson(lessonId: string, userId?: string) {
    const lesson = await curriculumRepository.findLessonById(lessonId);
    if (!lesson || !lesson.contentText) throw new Error("Lesson or content not found");

    await curriculumRepository.updateLesson(lessonId, { status: "analyzing" });

    try {
      const { vocabulary, structures } = await aiService.parseLessonContent(
        lesson.contentText,
        lesson.difficulty as CEFRLevel,
        userId
      );

      // We don't save them automatically to LearningItems yet,
      // we just return them for the manager to review (Step 4).
      // But we update the lesson step.
      await curriculumRepository.updateLesson(lessonId, {
        status: "reviewing",
        creationStep: 3
      });

      return { vocabulary, structures };
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Parsing failed";
      await curriculumRepository.updateLesson(lessonId, {
        status: "error",
        errorMessage: message
      });
      throw error;
    }
  },

  /**
   * Step 5: Enriches selected learning items with metadata and images.
   */
  async enrichItems(lessonId: string, items: Array<{ lemma: string, type: string, contextual_meaning: string }>, userId?: string) {
    const lesson = await curriculumRepository.findLessonById(lessonId);
    if (!lesson) throw new Error("Lesson not found");

    await curriculumRepository.updateLesson(lessonId, {
      status: "processing_items",
      creationStep: 4
    });

    try {
      const difficulty = lesson.difficulty as CEFRLevel;
      const isA1A2 = ["A1", "A2"].includes(difficulty);
      const isB1 = difficulty === "B1";

      const targetLang = lesson.language?.code || "en";
      const targetLanguageName = lesson.language?.name || "English";
      const nativeLanguageName = targetLang === "en" ? "Portuguese" : "English";

      const translationPrompt = isA1A2
        ? `translate lemma, meanings and examples to ${nativeLanguageName}`
        : isB1 ? `translate only lemma to ${nativeLanguageName}` : "no translation";

      const mappedItemsToEnrich = items.map(item => ({
        lemma: item.lemma,
        type: item.type,
        context: item.contextual_meaning
      }));

      const batchResponse = await aiService.enrichBatchLearningItems(
        mappedItemsToEnrich,
        targetLanguageName,
        nativeLanguageName,
        translationPrompt,
        difficulty,
        userId
      );

      const batchResults = batchResponse.results as LearningItemMetadata[];

      for (let i = 0; i < items.length; i++) {
        const item = items[i];
        const metadata = batchResults[i];

        if (!metadata) continue; // Safety check

        // Search and attach image if visual
        if (metadata.is_visual && metadata.key_image_words) {
          try {
            const imageUrl = await mediaService.searchImage(metadata.key_image_words, userId);
            metadata.image_url = imageUrl;
          } catch (e) {
            console.error("Failed to get image", e);
          }
        }

        const itemId = `${targetLang.toUpperCase()}_${item.lemma.toLowerCase().replace(/\s+/g, '_')}_${item.type}`;

        // Force level to lesson difficulty to ensure they are found for this level's diagnostic test
        metadata.level = difficulty;

        await curriculumRepository.upsertLearningItem({
          id: itemId,
          languageId: lesson.languageId,
          type: item.type.toUpperCase() as "VOCABULARY" | "STRUCTURE",
          lemma: item.lemma,
          translation: (isA1A2 || isB1) ? metadata.translation : null,
          metadata: metadata,
        });

        await curriculumRepository.linkItemToLesson(lessonId, itemId, "CORE");
      }

    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Item enrichment failed";
      await curriculumRepository.updateLesson(lessonId, {
        status: "error",
        errorMessage: message
      });
      throw error;
    }

    await curriculumRepository.updateLesson(lessonId, {
      status: "analyzing", // Moving to Quiz generation step
      creationStep: 5
    });
  },

  /**
   * Step 6: Generates a complete quiz for the lesson.
   */
  async generateQuiz(lessonId: string, userId?: string) {
    const lesson = await curriculumRepository.findLessonById(lessonId);
    if (!lesson || !lesson.contentText) throw new Error("Lesson or content not found");

    try {
      const quiz = await aiService.generateQuiz(
        lesson.contentText,
        lesson.media?.transcriptionText ? [] : [], // Simplified for now, or use real segments
        lesson.difficulty as CEFRLevel,
        userId
      );

      await curriculumRepository.updateLesson(lessonId, {
        quizData: quiz,
        status: "reviewing_quiz",
        creationStep: 6
      });

      return quiz;
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Quiz generation failed";
      await curriculumRepository.updateLesson(lessonId, {
        status: "error",
        errorMessage: message
      });
      throw error;
    }
  },

  /**
   * Step 8: Deterministic Practice Builder.
   * Builds the PracticeItem array based on linked items and quiz.
   */
  async finalizeLesson(lessonId: string) {
    const lesson = await curriculumRepository.findLessonById(lessonId);
    if (!lesson) throw new Error("Lesson not found");

    const practiceItems: PracticeItem[] = [];

    for (const lessonItem of lesson.items) {
      const item = lessonItem.item;

      if (item.type === "VOCABULARY") {
        const meta = item.metadata as LearningItemMetadata;

        // Flashcard (Deterministic)
        practiceItems.push({
          id: item.id,
          type: "item",
          renderMode: "flashcard_visual",
          mainText: item.lemma,
          flashcard: {
            front: item.lemma,
            back: meta.meanings?.[0]?.definition || "",
            imageUrl: meta.image_url,
            useTTS: true
          }
        });

        // Gap Fill (Deterministic from Examples)
        if (meta.examples?.length > 0) {
          const gapFill = generateGapFillListening(meta.examples[0]);

          practiceItems.push({
            id: `${item.id}_gap`,
            type: "item",
            renderMode: "gap_fill_listening",
            mainText: item.lemma,
            gapFill: {
              ...gapFill,
              useTTS: true,
              audioSegment: { start: 0, end: 0 }
            }
          });
        }
      } else if (item.type === "STRUCTURE") {
        const meta = item.metadata as { example_from_text?: string };
        // Unscramble (Deterministic from Phrases)
        const phrase = meta.example_from_text || "";
        if (phrase) {
          const words = phrase.split(" ");
          const scrambled = [...words].sort(() => Math.random() - 0.5);

          practiceItems.push({
            id: item.id,
            type: "structure",
            renderMode: "sentence_unscramble",
            mainText: phrase,
            unscramble: {
              scrambledWords: scrambled,
              correctOrder: words
            }
          });
        }
      }
    }

    try {
      const contentText = lesson.contentText || "";
      const currentHash = crypto.createHash("sha256").update(contentText).digest("hex");
      
      let embedding = lesson.embedding;
      
      if (!embedding || lesson.contentHash !== currentHash) {
        embedding = await aiService.getEmbeddings(contentText);
      }

      await curriculumRepository.updateLesson(lessonId, {
        embedding: embedding,
        contentHash: currentHash,
        status: "ready",
        creationStep: 9
      });

      return { practiceItems };
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Finalization failed";
      await curriculumRepository.updateLesson(lessonId, {
        status: "error",
        errorMessage: message
      });
      throw error;
    }
  },

  /**
   * Step 7: Updates quiz data after manual review.
   */
  async updateLessonQuiz(lessonId: string, quizData: unknown) {
    await curriculumRepository.updateLesson(lessonId, {
      quizData,
      status: "reviewing_quiz",
      creationStep: 7
    });
  },

  /**
   * Permanent deletion of a lesson and its media.
   */
  async deleteLesson(lessonId: string) {
    const lesson = await curriculumRepository.findLessonById(lessonId);
    if (!lesson) return;

    // Permanent deletion
    await curriculumRepository.deleteLesson(lessonId);
  },

  /**
   * Versioning: Clones a lesson to a new version and soft-deletes the old one.
   * This ensures students on active plans keep using the old v1 (since they reference the old ID),
   * while new students will get v2.
   */
  async cloneLesson(lessonId: string) {
    const oldLesson = await curriculumRepository.findLessonById(lessonId);
    if (!oldLesson) throw new Error("Lesson not found");

    // 1. Create new lesson
    const newLesson = await curriculumRepository.createLesson({
      languageId: oldLesson.languageId,
      mediaId: oldLesson.mediaId,
      title: oldLesson.title,
      difficulty: oldLesson.difficulty as CEFRLevel,
      contentText: oldLesson.contentText,
      contentJson: oldLesson.contentJson as Record<string, unknown>,
      quizData: oldLesson.quizData,
      status: oldLesson.status === "ready" ? "draft" : oldLesson.status, // Move back to draft to force review? Or keep status. Let's keep status if they just want a clone. Wait, actually we usually clone to EDIT.
      creationStep: oldLesson.creationStep,
      version: oldLesson.version + 1,
      contentHash: oldLesson.contentHash,
      embedding: oldLesson.embedding, // Keep embedding if content text is exactly the same
    });

    // 2. Clone learning items relationships
    for (const link of oldLesson.items) {
      const itemId = link.item ? link.item.id : link.itemId;
      await curriculumRepository.linkItemToLesson(newLesson.id, itemId, link.priority || "CORE");
    }

    // 3. Mark old as soft-deleted (so it stops appearing for new assignments)
    // The previous implementation of deleteLesson already does soft-delete: deletedAt = new Date()
    await curriculumRepository.deleteLesson(oldLesson.id);

    return newLesson;
  },

  async getRandomItemsByLevel(languageId: string, cefrLevel: string, limit: number) {
    return curriculumRepository.getRandomItemsByLevel(languageId, cefrLevel, limit);
  }
};

function generateGapFillListening(example: string): { sentenceWithGap: string, correctAnswer: string } {
  const words = example.split(" ");
  if (words.length < 2) return { sentenceWithGap: "____ " + example, correctAnswer: example };

  const gapIndex = Math.floor(Math.random() * words.length);
  const correctAnswer = words[gapIndex];
  words[gapIndex] = "____";

  return {
    sentenceWithGap: words.join(" "),
    correctAnswer
  };
}
