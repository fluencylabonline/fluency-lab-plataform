import { curriculumRepository } from "./curriculum.repository";
import { aiService } from "@/modules/ai/ai.service";
import { mediaService } from "@/modules/media/media.service";
import crypto from "crypto";
import { CEFRLevel, LearningItemMetadata, PracticeItem, VocabMetadata, StructureMetadata, AnalysisResult, QuizData, QuizQuestion } from "./curriculum.types";
import { lessons, media } from "./curriculum.schema";

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
  async processLessonMedia(lessonId: string, mediaUrl: string) {
    const lesson = await curriculumRepository.findLessonById(lessonId);
    if (!lesson) throw new Error("Lesson not found");

    // 1. Create or reuse Media record (persist URL before transcription)
    let mediaRecord = lesson.media;
    if (!mediaRecord || mediaRecord.url !== mediaUrl) {
      mediaRecord = await curriculumRepository.createMedia({
        url: mediaUrl,
        status: "pending_review"
      });
      // Link media to lesson immediately
      await curriculumRepository.updateLesson(lessonId, {
        mediaId: mediaRecord.id,
      });
    }

    // 2. Set lesson status to transcribing and return
    // The actual transcription will be triggered via SSE for real-time feedback
    await curriculumRepository.updateLesson(lessonId, {
      status: "transcribing",
      creationStep: 2,
      errorMessage: null,
    });

    return { media: mediaRecord };
  },

  /**
   * Step 3: Analyzes transcription or lesson content and suggests learning items.
   */
  async analyzeLesson(lessonId: string, userId?: string) {
    const lesson = await curriculumRepository.findLessonById(lessonId);
    if (!lesson) throw new Error("Lesson not found");

    // Determine the source based on the current step
    // Step 4: Analyzes Transcription
    // Step 6: Analyzes Lesson Content
    const sourceText = lesson.creationStep === 3 || lesson.creationStep === 4
      ? lesson.media?.transcriptionText
      : lesson.contentText;

    if (!sourceText) throw new Error("No source text available for analysis");

    await curriculumRepository.updateLesson(lessonId, { status: "analyzing" });

    try {
      const { vocabulary, structures } = await aiService.parseLessonContent(
        sourceText,
        lesson.difficulty as CEFRLevel,
        userId
      );

      // Merge with existing items if any
      const existingJson = (lesson.analysisResultJson as unknown as AnalysisResult) || { vocabulary: [], structures: [] };

      const mergedVocabulary = [...(existingJson.vocabulary || [])];
      const mergedStructures = [...(existingJson.structures || [])];

      // Simple deduplication based on lemma
      vocabulary.forEach((v) => {
        if (!mergedVocabulary.find((mv) => mv.lemma === v.lemma)) {
          mergedVocabulary.push(v);
        }
      });

      structures.forEach((s) => {
        if (!mergedStructures.find((ms) => ms.name === s.name)) {
          mergedStructures.push({
            name: s.name,
            type: s.type,
            example_from_text: s.example_from_text
          });
        }
      });

      const nextStep = (lesson.creationStep === 3 || lesson.creationStep === 4) ? 5 : 7;

      await curriculumRepository.updateLesson(lessonId, {
        status: "reviewing",
        creationStep: nextStep,
        analysisResultJson: { vocabulary: mergedVocabulary, structures: mergedStructures }
      });

      return { vocabulary: mergedVocabulary, structures: mergedStructures };
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
   * Step 8: Enriches selected learning items with metadata and images.
   * Now optimized for batch processing.
   */
  async enrichItems(lessonId: string, items: Array<{ lemma: string, type: string, context?: string, contextual_meaning?: string, processed?: boolean }>, userId?: string) {
    const lesson = await curriculumRepository.findLessonById(lessonId);
    if (!lesson) throw new Error("Lesson not found");

    await curriculumRepository.updateLesson(lessonId, {
      status: "processing_items",
      creationStep: 8
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
        context: item.contextual_meaning || item.context || ""
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

        const isVocab = item.type !== "STRUCTURE" && item.type !== "structure";

        if (isVocab) {
          const vocabMeta = metadata as VocabMetadata;
          if (vocabMeta.is_visual && vocabMeta.key_image_words) {
            try {
              const imageUrl = await mediaService.searchImage(vocabMeta.key_image_words, userId);
              vocabMeta.image_url = imageUrl;
            } catch (e) {
              console.error("Failed to get image", e);
            }
          }
        }

        const itemId = `${targetLang.toUpperCase()}_${item.lemma.toLowerCase().replace(/\s+/g, '_')}_${item.type}`;

        // Force level to lesson difficulty to ensure they are found for this level's diagnostic test
        metadata.level = difficulty;

        await curriculumRepository.upsertLearningItem({
          id: itemId,
          languageId: lesson.languageId,
          type: (item.type === "STRUCTURE" || item.type === "structure") ? "STRUCTURE" : "VOCABULARY",
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
  },

  /**
   * Step 8 (entry): Enrich items from analysisResultJson in batches.
   * Acts as a queue processor.
   */
  async enrichLinkedItems(lessonId: string, userId?: string, batchSize: number = 31) {
    const lesson = await curriculumRepository.findLessonById(lessonId);
    if (!lesson) throw new Error("Lesson not found");

    const analysisResult = lesson.analysisResultJson as unknown as AnalysisResult | null;

    if (!analysisResult) throw new Error("No analysis result found. Run Step 7 first.");

    // 1. Normalize and identify pending items
    const pendingVocab = (analysisResult.vocabulary || [])
      .map((v, index) => ({
        ...v,
        originalIndex: index,
        queueType: 'vocabulary' as const,
        lemma: typeof v === "string" ? v : v.lemma,
        type: typeof v === "string" ? "noun" : (v.type || "noun"),
        context: typeof v === "string" ? "" : (v.contextual_meaning || v.context || "")
      }))
      .filter(v => !v.processed);

    const pendingStructures = (analysisResult.structures ?? [])
      .map((s, index) => ({
        ...s,
        originalIndex: index,
        queueType: 'structures' as const,
        lemma: typeof s === "string" ? s : s.name,
        type: "STRUCTURE",
        context: typeof s === "string" ? "" : (s.example_from_text || s.context || "")
      }))
      .filter(s => !s.processed);

    const totalCount = (analysisResult.vocabulary?.length || 0) + (analysisResult.structures?.length || 0);
    const allPending = [...pendingVocab, ...pendingStructures];

    if (allPending.length === 0) {
      await curriculumRepository.updateLesson(lessonId, { creationStep: 8 });
      return { success: true, processed: 0, total: totalCount, remaining: 0 };
    }

    // 2. Take the first batch
    const batchToProcess = allPending.slice(0, batchSize);

    // 3. Enrich them
    await this.enrichItems(lessonId, batchToProcess, userId);

    // 4. Update the "queue" (analysisResultJson) marking them as processed
    batchToProcess.forEach(item => {
      if (item.queueType === 'vocabulary') {
        analysisResult.vocabulary[item.originalIndex].processed = true;
      } else {
        analysisResult.structures[item.originalIndex].processed = true;
      }
    });

    await curriculumRepository.updateLesson(lessonId, {
      analysisResultJson: analysisResult,
      status: allPending.length <= batchSize ? "analyzing" : "processing_items"
    });

    return {
      success: true,
      processed: batchToProcess.length,
      total: totalCount,
      remaining: allPending.length - batchToProcess.length
    };
  },

  /**
   * Step 8 (exit): Bulk-update the CORE/SECONDARY priority for all linked lesson items.
   */
  async updateItemsPriority(lessonId: string, priorities: Array<{ itemId: string; priority: "CORE" | "SECONDARY" }>) {
    for (const { itemId, priority } of priorities) {
      await curriculumRepository.linkItemToLesson(lessonId, itemId, priority);
    }
    await curriculumRepository.updateLesson(lessonId, { creationStep: 9 });
  },

  /**
   * Step 9: Generates a complete quiz for the lesson.
   */
  async generateQuiz(lessonId: string, userId?: string) {
    const lesson = await curriculumRepository.findLessonById(lessonId);
    if (!lesson || !lesson.contentText) throw new Error("Lesson or content not found");

    try {
      const quiz = await aiService.generateQuiz({
        contentText: lesson.contentText,
        items: lesson.items || [],
        level: lesson.difficulty as CEFRLevel,
        transcriptionSegments: (lesson.media?.config as { segments?: Array<{ word: string, start: number, end: number }> })?.segments || lesson.media?.transcriptionTimestamps || [],
        userId
      });

      await curriculumRepository.updateLesson(lessonId, {
        quizData: quiz,
        status: "reviewing_quiz",
        creationStep: 10
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

  async updateLessonQuiz(lessonId: string, quizData: QuizData) {
    await curriculumRepository.updateLesson(lessonId, {
      quizData,
      creationStep: 11
    });
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
        const meta = item.metadata as VocabMetadata;
        const translation = meta.translation || (meta.meanings?.[0]?.translation) || "";

        // Flashcard (Deterministic)
        practiceItems.push({
          id: item.id,
          type: "item",
          renderMode: "flashcard_visual",
          mainText: item.lemma,
          flashcard: {
            front: item.lemma,
            back: meta.meanings?.[0]?.definition || translation || "",
            imageUrl: meta.image_url || null,
            useTTS: true
          }
        });

        // Gap Fill (Deterministic from Examples)
        const firstExample = meta.examples?.[0];
        if (firstExample?.text) {
          const gapFill = generateGapFillListening(firstExample.text);

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
        const meta = item.metadata as StructureMetadata;

        // Use the new structured examples if available
        const firstExample = meta.examples?.[0];

        // Priority 1: Use word_order mapping for exact word/role alignment
        const hasMapping = !!firstExample?.word_order && firstExample.word_order.length > 0;
        const sortedMapping = hasMapping ? [...firstExample!.word_order!].sort((a, b) => a.index - b.index) : [];

        const words = hasMapping
          ? sortedMapping.map(wo => wo.word)
          : (firstExample?.text || (meta as unknown as { example_from_text?: string }).example_from_text || "").split(" ").filter(Boolean);

        const phrase = firstExample?.text || (meta as unknown as { example_from_text?: string }).example_from_text || words.join(" ");

        if (words.length > 0) {
          const scrambled = [...words].sort(() => Math.random() - 0.5);

          practiceItems.push({
            id: item.id,
            type: "structure",
            renderMode: "sentence_unscramble",
            mainText: phrase,
            unscramble: {
              scrambledWords: scrambled,
              correctOrder: words,
              wordRoles: hasMapping ? sortedMapping.map(wo => wo.role) : undefined
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
        creationStep: 12
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
      const itemId = link.item?.id || link.itemId;
      if (!itemId) continue;

      await curriculumRepository.linkItemToLesson(newLesson.id, itemId, link.priority);
    }

    // 3. Mark old as soft-deleted (so it stops appearing for new assignments)
    // The previous implementation of deleteLesson already does soft-delete: deletedAt = new Date()
    await curriculumRepository.deleteLesson(oldLesson.id);

    return newLesson;
  },

  async getRandomItemsByLevel(languageId: string, cefrLevel: string, limit: number) {
    return curriculumRepository.getRandomItemsByLevel(languageId, cefrLevel, limit);
  },

  async findAllLanguages() {
    return curriculumRepository.findAllLanguages();
  },

  async getReadyLessons(languageId: string) {
    return curriculumRepository.findAllReady(languageId);
  },

  async getAllLessons() {
    return curriculumRepository.findAllLessons();
  },

  async getLessonsPaginated(params: { search?: string, limit?: number, offset?: number }) {
    return curriculumRepository.findLessons(params);
  },

  async updateMedia(id: string, data: Partial<typeof media.$inferInsert>) {
    return await curriculumRepository.updateMedia(id, data);
  },

  async updateLesson(id: string, data: Partial<typeof lessons.$inferInsert>) {
    return await curriculumRepository.updateLesson(id, data);
  },

  async findLessonById(id: string) {
    return await curriculumRepository.findLessonById(id);
  },

  // Language Management
  async createLanguage(data: { name: string, code: string }) {
    return await curriculumRepository.createLanguage(data);
  },

  async deleteLanguage(id: string) {
    return await curriculumRepository.deleteLanguage(id);
  },

  async findLanguageById(id: string) {
    return await curriculumRepository.findLanguageById(id);
  },

  // Media Library Management
  async getAllMedia() {
    return await curriculumRepository.findAllMedia();
  },

  async deleteMedia(id: string) {
    return await curriculumRepository.deleteMedia(id);
  },

  async createMedia(url: string) {
    return await curriculumRepository.createMedia({
      url,
      status: "pending_review",
    });
  },

  async transcribeMediaStandalone(mediaId: string, userId?: string) {
    const mediaRecord = await curriculumRepository.findMediaById(mediaId);
    if (!mediaRecord) throw new Error("Media not found");

    const { full_text, segments } = await aiService.transcribeMedia(
      mediaRecord.url,
      "audio",
      userId
    );

    return await curriculumRepository.updateMedia(mediaId, {
      transcriptionText: full_text,
      transcriptionTimestamps: segments,
      status: "approved",
    });
  },

  async getLearningItems(params: { languageId: string, type?: "VOCABULARY" | "STRUCTURE", search?: string, limit?: number }) {
    return await curriculumRepository.findLearningItems({
      languageId: params.languageId,
      type: params.type,
      search: params.search,
      limit: params.limit || 50
    });
  },

  async getRecessActivities(teacherId?: string) {
    return await curriculumRepository.findRecessActivities(teacherId);
  },

  async upsertRecessActivity(data: {
    id?: string,
    title: string,
    languageId: string,
    difficulty: CEFRLevel,
    contentJson?: Record<string, unknown> | null,
    quizData?: { questions: QuizQuestion[]; passingScore: number } | null,
    teacherId: string
  }) {
    if (data.id) {
      return await curriculumRepository.updateLesson(data.id, {
        ...data,
        isRecessActivity: true,
        status: "ready"
      });
    }
    return await curriculumRepository.createLesson({
      ...data,
      isRecessActivity: true,
      status: "ready",
      creationStep: 12
    });
  },

  async getWordOfTheDay(userId: string) {
    const { userService } = await import("@/modules/user/user.service");
    const user = await userService.getUser(userId);
    if (!user) throw new Error("User not found");

    const languages = user.languages || [];
    if (languages.length === 0) {
      // Fallback: if no languages selected, get any vocabulary
      return await curriculumRepository.getRandomVocabularyItem([]);
    }

    return await curriculumRepository.getRandomVocabularyItem(languages);
  },
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
