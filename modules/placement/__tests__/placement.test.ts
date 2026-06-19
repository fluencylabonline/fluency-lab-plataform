import { describe, it, expect, vi, beforeEach } from "vitest";
import { placementService } from "../placement.service";
import { placementRepository } from "../placement.repository";
import { Question, PlacementTest } from "../placement.schema";

vi.mock("../placement.repository", () => ({
  placementRepository: {
    getActiveTestById: vi.fn(),
    getQuestionById: vi.fn(),
    countTestAnswers: vi.fn().mockResolvedValue(0),
    getLastAnswerScore: vi.fn().mockResolvedValue(null),
    insertTestAnswer: vi.fn().mockResolvedValue({}),
    updateQuestionCalibration: vi.fn().mockResolvedValue({}),
    getNextAdaptiveQuestion: vi.fn(),
    getAnsweredQuestionIds: vi.fn().mockResolvedValue([]),
  },
}));

vi.mock("../user/user.service", () => ({
  userService: {
    getUserById: vi.fn(),
    updateUser: vi.fn(),
  },
}));

vi.mock("@/lib/adaptive-scoring", () => ({
  calculateElo: vi.fn().mockReturnValue({ newStudentScore: 1050, newQuestionDifficulty: 950 }),
  mapEloToCEFR: vi.fn().mockReturnValue("A1"),
}));

vi.mock("../learning/learning.service", () => ({
  learningService: {
    recordPracticeResult: vi.fn().mockResolvedValue({}),
  },
}));

describe("Placement Service - submitAnswer", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should evaluate a writing question as correct when user input matches the correct option text ignoring case and trailing spaces", async () => {
    const mockTest: PlacementTest = {
      id: 1,
      userId: "user-123",
      languageId: "00000000-0000-0000-0000-000000000000",
      initialEloScore: 1000,
      startedAt: new Date(),
      completedAt: null,
      finalEloScore: null,
      status: "in_progress",
    };

    const mockQuestion: Question = {
      id: 56,
      content: "Ouça o áudio e escreva a palavra que falta:",
      context: "____ work.",
      options: [
        { id: "gap", text: "I" }
      ],
      correctOptionId: "gap",
      skill: "listening",
      type: "writing",
      difficultyLevel: 1000,
      cefrLevel: "A1",
      languageId: "00000000-0000-0000-0000-000000000000",
      status: "active",
      audioScript: null,
      learningItemId: null,
      sourceMediaId: null,
      metadata: null,
      timesAnswered: 0,
      createdAt: new Date(),
    };

    vi.mocked(placementRepository.getActiveTestById).mockResolvedValue(mockTest);
    vi.mocked(placementRepository.getQuestionById).mockResolvedValue(mockQuestion);
    vi.spyOn(placementService, "getNextQuestion").mockResolvedValue(null);

    const result = await placementService.submitAnswer("user-123", {
      testId: 1,
      questionId: 56,
      selectedOptionId: "I ", // Trailing space
    });

    expect(result.isCorrect).toBe(true);
    expect(placementRepository.insertTestAnswer).toHaveBeenCalledWith(
      1,
      56,
      "I ",
      true,
      1050
    );
  });

  it("should evaluate a writing question with smart quotes correctly", async () => {
    const mockTest: PlacementTest = {
      id: 1,
      userId: "user-123",
      languageId: "00000000-0000-0000-0000-000000000000",
      initialEloScore: 1000,
      startedAt: new Date(),
      completedAt: null,
      finalEloScore: null,
      status: "in_progress",
    };

    const mockQuestion: Question = {
      id: 57,
      content: "Ouça o áudio e escreva a palavra que falta:",
      context: "____ work.",
      options: [
        { id: "gap", text: "I'm" }
      ],
      correctOptionId: "gap",
      skill: "listening",
      type: "writing",
      difficultyLevel: 1000,
      cefrLevel: "A1",
      languageId: "00000000-0000-0000-0000-000000000000",
      status: "active",
      audioScript: null,
      learningItemId: null,
      sourceMediaId: null,
      metadata: null,
      timesAnswered: 0,
      createdAt: new Date(),
    };

    vi.mocked(placementRepository.getActiveTestById).mockResolvedValue(mockTest);
    vi.mocked(placementRepository.getQuestionById).mockResolvedValue(mockQuestion);
    vi.spyOn(placementService, "getNextQuestion").mockResolvedValue(null);

    const result = await placementService.submitAnswer("user-123", {
      testId: 1,
      questionId: 57,
      selectedOptionId: "i’m", // Smart apostrophe and lowercase
    });

    expect(result.isCorrect).toBe(true);
  });

  it("should evaluate a writing question as incorrect when user input does not match correct option text", async () => {
    const mockTest: PlacementTest = {
      id: 1,
      userId: "user-123",
      languageId: "00000000-0000-0000-0000-000000000000",
      initialEloScore: 1000,
      startedAt: new Date(),
      completedAt: null,
      finalEloScore: null,
      status: "in_progress",
    };

    const mockQuestion: Question = {
      id: 56,
      content: "Ouça o áudio e escreva a palavra que falta:",
      context: "____ work.",
      options: [
        { id: "gap", text: "I" }
      ],
      correctOptionId: "gap",
      skill: "listening",
      type: "writing",
      difficultyLevel: 1000,
      cefrLevel: "A1",
      languageId: "00000000-0000-0000-0000-000000000000",
      status: "active",
      audioScript: null,
      learningItemId: null,
      sourceMediaId: null,
      metadata: null,
      timesAnswered: 0,
      createdAt: new Date(),
    };

    vi.mocked(placementRepository.getActiveTestById).mockResolvedValue(mockTest);
    vi.mocked(placementRepository.getQuestionById).mockResolvedValue(mockQuestion);
    vi.spyOn(placementService, "getNextQuestion").mockResolvedValue(null);

    const result = await placementService.submitAnswer("user-123", {
      testId: 1,
      questionId: 56,
      selectedOptionId: "you",
    });

    expect(result.isCorrect).toBe(false);
  });
});
