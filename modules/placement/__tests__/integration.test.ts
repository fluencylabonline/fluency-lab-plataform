import { describe, it, expect } from "vitest";
import { curriculumService } from "../../curriculum/curriculum.service";
import { placementService } from "../placement.service";
import { db } from "@/lib/db";
import { questionsTable } from "../placement.schema";
import { learningItems, languages } from "../../curriculum/curriculum.schema";
import { eq, and } from "drizzle-orm";

// This test uses the REAL database and AI. 
// Ensure your environment variables are set correctly.

describe.skip("Curriculum to Placement Pipeline (Integration)", () => {
  const TEST_USER_ID = "4TlnMS134Jaeg2aJjHkS9TObCR12"; // Valid admin user ID from DB
  let languageId: string;
  let createdLessonId: string;
  let createdItemIds: string[] = [];

  it("Step 1: Setup - Get Language ID", async () => {
    const lang = await db.query.languages.findFirst({
      where: eq(languages.code, "en")
    });
    console.log("FOUND LANGUAGE:", lang);
    expect(lang).toBeDefined();
    languageId = lang!.id;
  });

  it("Step 2: Generate Lesson & Learning Items", async () => {
    // 1. Create Lesson
    const lesson = await curriculumService.createLesson({
      title: "Integration Test: Future Travel",
      difficulty: "B1",
      languageId: languageId
    });
    createdLessonId = lesson.id;

    // 2. Mock Enrichment (we'll manually inject items to speed up/control the test)
    // In a real scenario, analyzeLesson would find these.
    const itemsToCreate = [
      { lemma: "overshadowed", type: "VOCABULARY", contextual_meaning: "made to seem less important" },
      { lemma: "nonetheless", type: "VOCABULARY", contextual_meaning: "in spite of that" },
      { lemma: "had been waiting", type: "STRUCTURE", contextual_meaning: "past perfect continuous" },
      { lemma: "seldom", type: "VOCABULARY", contextual_meaning: "not often" }
    ];

    await curriculumService.enrichItems(createdLessonId, itemsToCreate, TEST_USER_ID);

    // Verify items exist
    const items = await db.query.learningItems.findMany({
      where: eq(learningItems.languageId, languageId)
    });

    // Find the ones we just created (they include the lemma in ID)
    createdItemIds = items
      .filter(i => itemsToCreate.some(it => i.lemma.toLowerCase() === it.lemma.toLowerCase()))
      .map(i => i.id);

    expect(createdItemIds.length).toBeGreaterThanOrEqual(4);
  });

  it("Step 3: Generate Placement Questions in Bulk", async () => {
    // Generate 4 questions (one for each skill)
    const result = await placementService.generateBulkQuestions(
      languageId,
      "B1",
      4,
      TEST_USER_ID
    );

    expect(result.length).toBe(4);

    // Verify they are linked and in draft
    for (const q of result) {
      expect(q.status).toBe("draft");
      expect(q.cefrLevel).toBe("B1");
      expect(q.languageId).toBe(languageId);
      expect(q.learningItemId).toBeDefined();
      expect(createdItemIds).toContain(q.learningItemId);
    }

    // Check skill distribution
    const skills = result.map(q => q.skill);
    expect(skills).toContain("grammar");
    expect(skills).toContain("vocabulary");
    expect(skills).toContain("reading");
    expect(skills).toContain("listening");

    // Check if listening has an audio_script
    const listeningQ = result.find(q => q.skill === "listening");
    expect(listeningQ?.audioScript).toBeTruthy();
  });

  it("Step 4: Cleanup (Optional)", async () => {
    // Delete test questions
    await db.delete(questionsTable)
      .where(and(
        eq(questionsTable.cefrLevel, "B1"),
        eq(questionsTable.languageId, languageId),
        eq(questionsTable.status, "draft")
      ));

    // We'll leave them for manual review if the user wants, 
    // but for the test purpose we'll clean up the lesson.
    // await curriculumService.deleteLesson(createdLessonId);
  });
});
