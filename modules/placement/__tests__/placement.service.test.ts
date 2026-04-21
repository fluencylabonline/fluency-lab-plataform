import { describe, it, expect, vi, beforeEach } from "vitest";
import { placementService } from "../placement.service";
import { placementRepository } from "../placement.repository";
import { userRepository } from "@/modules/user/user.repository";
import { User } from "@/modules/user/user.schema";
import { Question, PlacementTest, TestAnswer } from "../placement.schema";

// Mock the repositories
vi.mock("../placement.repository", () => ({
  placementRepository: {
    getActiveTest: vi.fn(),
    createNewTest: vi.fn(),
    countTestAnswers: vi.fn(),
    getLastAnswerScore: vi.fn(),
    getAnsweredQuestionIds: vi.fn(),
    getNextAdaptiveQuestion: vi.fn(),
    getQuestionById: vi.fn(),
    insertTestAnswer: vi.fn(),
    updateQuestionCalibration: vi.fn(),
    completeTest: vi.fn(),
  }
}));

vi.mock("@/modules/user/user.repository", () => ({
  userRepository: {
    findById: vi.fn(),
    update: vi.fn(),
  }
}));

describe("PlacementService", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("checkEligibility", () => {
    it("should allow if user has no last test date", async () => {
      vi.mocked(userRepository.findById).mockResolvedValueOnce({ id: "1" } as unknown as User);
      const isEligible = await placementService.checkEligibility("1");
      expect(isEligible).toBe(true);
    });

    it("should block if test was taken less than 6 months ago", async () => {
      const fiveMonthsAgo = new Date();
      fiveMonthsAgo.setMonth(fiveMonthsAgo.getMonth() - 5);
      vi.mocked(userRepository.findById).mockResolvedValueOnce({ 
        id: "1", 
        lastPlacementTestDate: fiveMonthsAgo 
      } as unknown as User);

      const isEligible = await placementService.checkEligibility("1");
      expect(isEligible).toBe(false);
    });

    it("should allow if test was taken more than 6 months ago", async () => {
      const sevenMonthsAgo = new Date();
      sevenMonthsAgo.setMonth(sevenMonthsAgo.getMonth() - 7);
      vi.mocked(userRepository.findById).mockResolvedValueOnce({ 
        id: "1", 
        lastPlacementTestDate: sevenMonthsAgo 
      } as unknown as User);

      const isEligible = await placementService.checkEligibility("1");
      expect(isEligible).toBe(true);
    });
  });

  describe("startOrResumeTest", () => {
    it("should create a new test if no active test exists", async () => {
      vi.mocked(userRepository.findById).mockResolvedValue({ 
        id: "1", 
        currentEloScore: 600,
        lastPlacementTestDate: null
      } as unknown as User);
      
      vi.mocked(placementRepository.getActiveTest).mockResolvedValueOnce(undefined);
      vi.mocked(placementRepository.createNewTest).mockResolvedValueOnce({ id: 99, initialEloScore: 600 } as unknown as PlacementTest);
      vi.mocked(placementRepository.countTestAnswers).mockResolvedValueOnce(0);
      vi.mocked(placementRepository.getLastAnswerScore).mockResolvedValueOnce(undefined);

      const result = await placementService.startOrResumeTest("1", "e435c2f1-e6cd-4f5b-871b-63516284787d");

      expect(placementRepository.createNewTest).toHaveBeenCalledWith("1", "e435c2f1-e6cd-4f5b-871b-63516284787d", 600);
      expect(result.test.id).toBe(99);
      expect(result.currentElo).toBe(600);
      expect(result.answeredCount).toBe(0);
    });
  });

  describe("getNextQuestion", () => {
    it("should use the circular queue for skills based on answeredCount", async () => {
      vi.mocked(placementRepository.getAnsweredQuestionIds).mockResolvedValue([1, 2]);
      vi.mocked(placementRepository.getNextAdaptiveQuestion).mockResolvedValue({ id: 3 } as unknown as Question);

      // count 0 -> grammar
      await placementService.getNextQuestion("1", 99, "e435c2f1-e6cd-4f5b-871b-63516284787d", 500, 0);
      expect(placementRepository.getNextAdaptiveQuestion).toHaveBeenCalledWith("e435c2f1-e6cd-4f5b-871b-63516284787d", "grammar", 500, [1, 2]);

      // count 5 -> vocabulary
      await placementService.getNextQuestion("1", 99, "e435c2f1-e6cd-4f5b-871b-63516284787d", 500, 5);
      expect(placementRepository.getNextAdaptiveQuestion).toHaveBeenCalledWith("e435c2f1-e6cd-4f5b-871b-63516284787d", "vocabulary", 500, [1, 2]);
    });
  });

  describe("submitAnswer", () => {
    it("should process an answer, update elo, and return next question", async () => {
      const activeTest = { id: 99, initialEloScore: 500 };
      const question = { id: 10, correctOptionId: "A", difficultyLevel: 500, timesAnswered: 0 };
      
      vi.mocked(placementRepository.getActiveTest).mockResolvedValueOnce(activeTest as unknown as PlacementTest);
      vi.mocked(placementRepository.getQuestionById).mockResolvedValueOnce(question as unknown as Question);
      vi.mocked(placementRepository.countTestAnswers).mockResolvedValueOnce(0);
      vi.mocked(placementRepository.getLastAnswerScore).mockResolvedValueOnce(undefined);
      
      // CalculateElo will be called: 500 vs 500 is 0.5 win probability.
      // If correct, user wins 0.5 * 64 (kFactor for count < 5) = 32 points. New Elo = 532.
      // Question loses: 0.5 * 32 (kFactor for timesAnswered < 20) = -16 points. New diff = 484.
      vi.mocked(placementRepository.insertTestAnswer).mockResolvedValueOnce({} as unknown as TestAnswer);
      vi.mocked(placementRepository.getNextAdaptiveQuestion).mockResolvedValueOnce({ id: 11 } as unknown as Question);

      const result = await placementService.submitAnswer("1", {
        testId: 99,
        questionId: 10,
        selectedOptionId: "A" // Correct
      });

      expect(result.isCorrect).toBe(true);
      expect(result.currentElo).toBe(532);
      expect(result.isFinished).toBe(false);
      expect(placementRepository.insertTestAnswer).toHaveBeenCalledWith(99, 10, "A", true, 532);
      expect(placementRepository.updateQuestionCalibration).toHaveBeenCalledWith(10, 484);
    });

    it("should finish the test if it's the 25th question", async () => {
      const activeTest = { id: 99, initialEloScore: 500 };
      const question = { id: 10, correctOptionId: "A", difficultyLevel: 500, timesAnswered: 100 };
      
      vi.mocked(placementRepository.getActiveTest).mockResolvedValueOnce(activeTest as unknown as PlacementTest);
      vi.mocked(placementRepository.getQuestionById).mockResolvedValueOnce(question as unknown as Question);
      
      // 24 questions answered previously
      vi.mocked(placementRepository.countTestAnswers).mockResolvedValueOnce(24);
      vi.mocked(placementRepository.getLastAnswerScore).mockResolvedValueOnce(800);
      
      const result = await placementService.submitAnswer("2", {
        testId: 99,
        questionId: 10,
        selectedOptionId: "B" // Incorrect
      });

      expect(result.isFinished).toBe(true);
      expect(result.nextQuestion).toBeNull();
      expect(placementRepository.completeTest).toHaveBeenCalled();
      expect(userRepository.update).toHaveBeenCalled();
    });
  });
});
