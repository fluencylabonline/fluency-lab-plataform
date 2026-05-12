import { describe, it, expect, vi, beforeEach } from "vitest";

// Usamos vi.hoisted para garantir que os mocks existam antes do hoisting do vi.mock
const { mockGetGenerativeModel, mockGenerateContent } = vi.hoisted(() => {
  const genContent = vi.fn();
  return {
    mockGenerateContent: genContent,
    mockGetGenerativeModel: vi.fn(() => ({
      generateContent: genContent,
      generateContentStream: vi.fn(),
    })),
  };
});

// Mock do GoogleGenerativeAI
vi.mock("@google/generative-ai", () => {
  return {
    GoogleGenerativeAI: class {
      getGenerativeModel = mockGetGenerativeModel;
    },
    SchemaType: {
      OBJECT: "OBJECT",
      ARRAY: "ARRAY",
      STRING: "STRING",
      NUMBER: "NUMBER",
      BOOLEAN: "BOOLEAN",
    },
  };
});

vi.mock("../ai.repository", () => ({
  aiRepository: {
    getCache: vi.fn(),
    setCache: vi.fn(),
  },
}));

vi.mock("@/lib/rate-limit", () => ({
  checkRateLimit: vi.fn().mockResolvedValue({ success: true }),
  checkDailyBudget: vi.fn().mockResolvedValue({ success: true }),
}));

vi.mock("@/env", () => ({
  env: {
    GEMINI_API_KEY: "test-key",
  },
}));

// Importar após os mocks
import { aiService } from "../ai.service";
import { aiRepository } from "../ai.repository";
import { LearningItemMetadata } from "@/modules/curriculum/curriculum.types";

describe("ai.service - Testes de Integração e Lógica", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("Sistema de Cache", () => {
    it("deve retornar o resultado do cache se disponível", async () => {
      const mockResult = { vocabulary: [], structures: [] };
      vi.mocked(aiRepository.getCache).mockResolvedValue(mockResult);

      const result = await aiService.parseLessonContent("text", "A1", "en", "pt");

      expect(result).toEqual(mockResult);
      expect(aiRepository.getCache).toHaveBeenCalled();
      expect(mockGenerateContent).not.toHaveBeenCalled();
    });

    it("deve salvar no cache após uma chamada bem-sucedida à IA", async () => {
      const mockAIResponse = {
        response: {
          text: () => JSON.stringify({ vocabulary: [{ lemma: "hello" }], structures: [] }),
        },
      };

      vi.mocked(aiRepository.getCache).mockResolvedValue(null);
      mockGenerateContent.mockResolvedValue(mockAIResponse);

      await aiService.parseLessonContent("hello text", "A1", "en", "pt");

      expect(aiRepository.setCache).toHaveBeenCalledWith(
        expect.any(String),
        "gemini_parse",
        expect.objectContaining({ vocabulary: expect.any(Array) }),
        60
      );
    });
  });

  describe("Fluxo de Criação de Lições", () => {
    it("deve analisar o conteúdo da lição e retornar o formato AnalysisResult correto", async () => {
      const mockData = {
        vocabulary: [{ lemma: "apple", type: "noun", contextual_meaning: "maçã", example_from_text: "I like apple" }],
        structures: [{ type: "s-v-o", name: "Subject Verb Object", example_from_text: "I like apple" }]
      };

      mockGenerateContent.mockResolvedValue({
        response: { text: () => JSON.stringify(mockData) }
      });

      const result = await aiService.parseLessonContent("I like apple", "A1", "en", "pt");

      expect(result).toHaveProperty("vocabulary");
      expect(result.vocabulary[0].lemma).toBe("apple");
    });
  });

  describe("Fluxo de Nivelamento (Placement)", () => {
    it("deve gerar um batch de questões de nivelamento", async () => {
      const mockItems = [
        { lemma: "hello", type: "vocabulary", metadata: {} as LearningItemMetadata }
      ];
      const mockAIResponse = {
        questions: [
          { learningItemId: "hello", content: "Question 1", options: [{ id: "a", text: "A" }], correct_option_id: "a" }
        ]
      };

      vi.mocked(aiRepository.getCache).mockResolvedValue(null);
      mockGenerateContent.mockResolvedValue({
        response: { text: () => JSON.stringify(mockAIResponse) }
      });

      const result = await aiService.generatePlacementQuestionsBatch(
        mockItems,
        "A1",
        "vocabulary",
        "en",
        "pt"
      );

      expect(result.questions).toBeInstanceOf(Array);
      expect(result.questions[0].content).toBe("Question 1");
    });
  });
});
