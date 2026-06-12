import { describe, it, expect, vi, beforeEach } from "vitest";
import { callService } from "../call.service";
import { callRepository } from "../call.repository";
import type { CallSession } from "../call.schema";

vi.mock("../call.repository", () => ({
  callRepository: {
    findByStreamId: vi.fn(),
    update: vi.fn(),
  },
}));

vi.mock("@stream-io/node-sdk", () => {
  return {
    StreamClient: vi.fn(() => ({
      video: {
        call: vi.fn(() => ({
          listTranscriptions: vi.fn(),
        })),
      },
    })),
  };
});

describe("Call Module - Transcription Parsing and Syncing", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("SHOULD parse Stream JSONL format into speaker-annotated dialogue", async () => {
    // Mock call session in DB with proper CallSession type
    const mockSession: CallSession = {
      id: "session-uuid",
      streamCallId: "call_test_123",
      studentId: "student-uid-123",
      teacherId: "teacher-uid-456",
      notebookId: null,
      startedAt: new Date(),
      endedAt: null,
      durationSeconds: null,
      transcription: null,
      transcriptionStatus: "pending",
      createdAt: new Date(),
    };
    vi.mocked(callRepository.findByStreamId).mockResolvedValue(mockSession);

    // Mock GetStream transcription JSONL response
    const mockJsonl = `
{"speaker_id":"student-uid-123","type":"speech","text":"Hi teacher!"}
{"speaker_id":"teacher-uid-456","type":"speech","text":"Hello, welcome!"}
{"speaker_id":"some-other-id","type":"speech","text":"System sound."}
    `.trim();

    // Mock global fetch returning a Response type safely
    const mockFetchResponse = {
      ok: true,
      text: vi.fn().mockResolvedValue(mockJsonl),
    };
    const spyFetch = vi.spyOn(global, "fetch").mockResolvedValue(mockFetchResponse as unknown as Response);

    // Run the webhook handler
    await callService.handleTranscriptionWebhook("call_test_123", "https://example.com/trans.jsonl");

    // Check fetch was called with correct url
    expect(spyFetch).toHaveBeenCalledWith("https://example.com/trans.jsonl");

    // Check database update was called with formatted transcription
    expect(callRepository.update).toHaveBeenCalledWith("call_test_123", {
      transcription: "[Aluno]: Hi teacher!\n[Professor]: Hello, welcome!\n[some-other-id]: System sound.",
      transcriptionStatus: "available",
    });
  });

  it("SHOULD fall back to failed status when transcription download fails", async () => {
    const mockSession: CallSession = {
      id: "session-uuid-2",
      streamCallId: "call_test_123",
      studentId: "student-1",
      teacherId: "teacher-1",
      notebookId: null,
      startedAt: new Date(),
      endedAt: null,
      durationSeconds: null,
      transcription: null,
      transcriptionStatus: "pending",
      createdAt: new Date(),
    };
    vi.mocked(callRepository.findByStreamId).mockResolvedValue(mockSession);

    vi.spyOn(global, "fetch").mockRejectedValue(new Error("Network Error"));

    await callService.handleTranscriptionWebhook("call_test_123", "https://example.com/trans.jsonl");

    expect(callRepository.update).toHaveBeenCalledWith("call_test_123", {
      transcriptionStatus: "failed",
    });
  });
});
