import { describe, it, expect, vi, beforeEach } from "vitest";
import { generateRoomCode, trialCallService } from "../trial-call.service";
import { trialCallRepository } from "../trial-call.repository";
import { aiService } from "@/modules/ai/ai.service";
import { learningRepository } from "@/modules/learning/learning.repository";
import { roomCodeSchema, trialNotesSchema, emptyTrialNotes } from "../trial-call.schema";
import type { TrialJoinRequest, TrialRoom } from "../trial-call.schema";

vi.mock("../trial-call.repository", () => ({
  trialCallRepository: {
    createRoom: vi.fn(),
    findRoomByCode: vi.fn(),
    endRoom: vi.fn(),
    endStaleRooms: vi.fn(),
    createRequest: vi.fn(),
    findRequest: vi.fn(),
    listPendingRequests: vi.fn(),
    setRequestStatus: vi.fn(),
    findRoomById: vi.fn(),
    findRoomByStreamCallId: vi.fn(),
    saveNotes: vi.fn(),
    saveTranscription: vi.fn(),
    setProfile: vi.fn(),
    setRequestEmail: vi.fn(),
    listApprovedRequests: vi.fn().mockResolvedValue([]),
    findUnlinkedProfileByEmail: vi.fn(),
  },
}));

vi.mock("@/modules/ai/ai.service", () => ({
  aiService: { extractStudentProfileFromTranscript: vi.fn() },
}));

vi.mock("@/modules/learning/learning.repository", () => ({
  learningRepository: { findProfileById: vi.fn(), upsertProfile: vi.fn(), associateProfileToStudent: vi.fn() },
}));

vi.mock("@/modules/call/call.service", () => ({
  callService: { generateStreamToken: vi.fn().mockResolvedValue("host-token") },
}));

vi.mock("@/modules/user/user.repository", () => ({
  userRepository: { findById: vi.fn().mockResolvedValue({ name: "Luara Souza" }) },
}));

vi.mock("@/env/server", () => ({
  env: { NEXT_PUBLIC_STREAM_API_KEY: "key", STREAM_SECRET: "secret" },
}));

vi.mock("@stream-io/node-sdk", () => ({
  StreamClient: class {
    generateUserToken = vi.fn(() => "guest-token");
    video = {
      call: vi.fn(() => ({
        getOrCreate: vi.fn(),
        get: vi.fn().mockResolvedValue({ call: { session: { participants: [] } } }),
        end: vi.fn(),
      })),
    };
  },
}));

const room = (over: Partial<TrialRoom> = {}): TrialRoom => ({
  id: "room-1",
  code: "abc-defg-hij",
  hostId: "host-1",
  streamCallId: "trial_x",
  status: "active",
  createdAt: new Date(),
  endedAt: null,
  notes: null,
  transcription: null,
  transcriptionStatus: "pending",
  profileId: null,
  analyzedAt: null,
  ...over,
});

const request = (over: Partial<TrialJoinRequest> = {}): TrialJoinRequest => ({
  id: "req-1",
  roomId: "room-1",
  guestId: "guest_1",
  name: "Marina",
  status: "pending",
  email: null,
  createdAt: new Date(),
  ...over,
});

describe("Trial Call - código da sala", () => {
  it("SHOULD generate codes in the abc-defg-hij format", () => {
    for (let i = 0; i < 50; i++) expect(roomCodeSchema.safeParse(generateRoomCode()).success).toBe(true);
  });
});

describe("Trial Call - fluxo de entrada", () => {
  beforeEach(() => vi.clearAllMocks());

  it("SHOULD NOT issue a guest token while the request is pending", async () => {
    vi.mocked(trialCallRepository.findRoomByCode).mockResolvedValue(room());
    vi.mocked(trialCallRepository.findRequest).mockResolvedValue(request());

    const res = await trialCallService.getRequestStatus("abc-defg-hij", "req-1", "guest_1");
    expect(res).toEqual({ status: "pending" });
  });

  it("SHOULD issue credentials only after the host approves", async () => {
    vi.mocked(trialCallRepository.findRoomByCode).mockResolvedValue(room());
    vi.mocked(trialCallRepository.findRequest).mockResolvedValue(request({ status: "approved" }));

    const res = await trialCallService.getRequestStatus("abc-defg-hij", "req-1", "guest_1");
    expect(res.status).toBe("approved");
    if (res.status === "approved") {
      expect(res.credentials.streamToken).toBe("guest-token");
      expect(res.credentials.userId).toBe("guest_1");
      expect(res.credentials.callId).toBe("trial_x");
    }
  });

  it("SHOULD NOT reveal a request to someone with a different guestId", async () => {
    vi.mocked(trialCallRepository.findRoomByCode).mockResolvedValue(room());
    vi.mocked(trialCallRepository.findRequest).mockResolvedValue(request({ status: "approved" }));

    const res = await trialCallService.getRequestStatus("abc-defg-hij", "req-1", "guest_other");
    expect(res).toEqual({ status: "denied" });
  });

  it("SHOULD report ended when the room is closed", async () => {
    vi.mocked(trialCallRepository.findRoomByCode).mockResolvedValue(room({ status: "ended" }));
    const res = await trialCallService.getRequestStatus("abc-defg-hij", "req-1", "guest_1");
    expect(res).toEqual({ status: "ended" });
  });

  it("SHOULD NOT create join requests for ended or unknown rooms", async () => {
    vi.mocked(trialCallRepository.findRoomByCode).mockResolvedValueOnce(undefined);
    expect(await trialCallService.requestToJoin("abc-defg-hij", "Ana")).toBeNull();

    vi.mocked(trialCallRepository.findRoomByCode).mockResolvedValueOnce(room({ status: "ended" }));
    expect(await trialCallService.requestToJoin("abc-defg-hij", "Ana")).toBeNull();
    expect(trialCallRepository.createRequest).not.toHaveBeenCalled();
  });

  it("SHOULD only let the host of the room decide requests", async () => {
    vi.mocked(trialCallRepository.findRoomByCode).mockResolvedValue(room());

    await expect(trialCallService.decide("abc-defg-hij", "req-1", true, "someone-else")).rejects.toThrow("unauthorized");
    expect(trialCallRepository.setRequestStatus).not.toHaveBeenCalled();

    vi.mocked(trialCallRepository.findRequest).mockResolvedValue(request());
    await trialCallService.decide("abc-defg-hij", "req-1", true, "host-1");
    expect(trialCallRepository.setRequestStatus).toHaveBeenCalledWith("req-1", "approved");
  });

  it("SHOULD NOT give host credentials to another user", async () => {
    vi.mocked(trialCallRepository.findRoomByCode).mockResolvedValue(room());
    expect(await trialCallService.getHostCredentials("abc-defg-hij", { id: "intruder", name: "X" })).toBeNull();
    const creds = await trialCallService.getHostCredentials("abc-defg-hij", { id: "host-1", name: "Host" });
    expect(creds?.streamToken).toBe("host-token");
  });
});

describe("Trial Call - anotações, transcrição e perfil", () => {
  beforeEach(() => vi.clearAllMocks());

  it("SHOULD validate notes (levels, limits)", () => {
    expect(trialNotesSchema.safeParse(emptyTrialNotes()).success).toBe(true);
    expect(trialNotesSchema.safeParse({ ...emptyTrialNotes(), level: "B1", goals: ["Viajar"] }).success).toBe(true);
    expect(trialNotesSchema.safeParse({ ...emptyTrialNotes(), level: "D9" }).success).toBe(false);
    expect(trialNotesSchema.safeParse({ ...emptyTrialNotes(), goals: [""] }).success).toBe(false);
  });

  it("SHOULD only let the host save notes", async () => {
    vi.mocked(trialCallRepository.findRoomByCode).mockResolvedValue(room());
    await expect(trialCallService.saveNotes("abc-defg-hij", "intruder", emptyTrialNotes())).rejects.toThrow("unauthorized");
    await trialCallService.saveNotes("abc-defg-hij", "host-1", emptyTrialNotes());
    expect(trialCallRepository.saveNotes).toHaveBeenCalledWith("room-1", emptyTrialNotes());
  });

  it("SHOULD label the transcript with Professor and the guest name, then build the draft profile", async () => {
    const jsonl = [
      JSON.stringify({ speaker_id: "host-1", text: "Hello Marina" }),
      JSON.stringify({ speaker_id: "guest_1", text: "Hi, I want to travel" }),
    ].join("\n");
    vi.spyOn(global, "fetch").mockResolvedValue({ ok: true, text: async () => jsonl } as unknown as Response);
    vi.mocked(trialCallRepository.findRoomByStreamCallId).mockResolvedValue(room());
    vi.mocked(trialCallRepository.listApprovedRequests).mockResolvedValue([request({ status: "approved" })]);
    vi.mocked(trialCallRepository.findRoomById).mockResolvedValue(room({ transcription: "x" }));
    vi.mocked(aiService.extractStudentProfileFromTranscript).mockResolvedValue({
      responses: { step3: { mainGoals: ["travel"] } },
      evidence: { "step3.mainGoals": "I want to travel" },
    });
    vi.mocked(learningRepository.upsertProfile).mockResolvedValue({ id: "profile-1" } as never);

    await trialCallService.handleTranscriptionWebhook("trial_x", "https://example.test/t.jsonl");

    expect(trialCallRepository.saveTranscription).toHaveBeenCalledWith("room-1", {
      transcription: "[Professor]: Hello Marina\n[Marina]: Hi, I want to travel",
      status: "available",
    });
    expect(trialCallRepository.setProfile).toHaveBeenCalledWith("room-1", "profile-1");
    expect(vi.mocked(learningRepository.upsertProfile).mock.calls[0][0]).toMatchObject({ status: "draft" });
  });

  it("SHOULD keep the saved transcript when the AI fails", async () => {
    vi.spyOn(global, "fetch").mockResolvedValue({ ok: true, text: async () => JSON.stringify({ speaker_id: "host-1", text: "Hi" }) } as unknown as Response);
    vi.spyOn(console, "error").mockImplementation(() => undefined);
    vi.mocked(trialCallRepository.findRoomByStreamCallId).mockResolvedValue(room());
    vi.mocked(trialCallRepository.findRoomById).mockResolvedValue(room({ transcription: "x" }));
    vi.mocked(aiService.extractStudentProfileFromTranscript).mockRejectedValue(new Error("boom"));

    await trialCallService.handleTranscriptionWebhook("trial_x", "https://example.test/t.jsonl");

    expect(trialCallRepository.saveTranscription).toHaveBeenCalledTimes(1);
    expect(trialCallRepository.saveTranscription).toHaveBeenCalledWith("room-1", expect.objectContaining({ status: "available" }));
  });

  it("SHOULD mark the transcript as failed when the download fails", async () => {
    vi.spyOn(global, "fetch").mockResolvedValue({ ok: false, statusText: "nope" } as unknown as Response);
    vi.spyOn(console, "error").mockImplementation(() => undefined);
    vi.mocked(trialCallRepository.findRoomByStreamCallId).mockResolvedValue(room());

    await trialCallService.handleTranscriptionWebhook("trial_x", "https://example.test/t.jsonl");
    expect(trialCallRepository.saveTranscription).toHaveBeenCalledWith("room-1", { status: "failed" });
  });

  it("SHOULD ignore the webhook for unknown rooms", async () => {
    vi.mocked(trialCallRepository.findRoomByStreamCallId).mockResolvedValue(undefined);
    await trialCallService.handleTranscriptionWebhook("trial_unknown", "https://example.test/t.jsonl");
    expect(trialCallRepository.saveTranscription).not.toHaveBeenCalled();
  });

  it("SHOULD save the guest email only for the approved request of that guest", async () => {
    vi.mocked(trialCallRepository.findRoomByCode).mockResolvedValue(room());
    vi.mocked(trialCallRepository.findRequest).mockResolvedValue(request({ status: "approved" }));

    expect(await trialCallService.saveGuestEmail("abc-defg-hij", "req-1", "guest_other", "A@B.com")).toBe(false);
    expect(trialCallRepository.setRequestEmail).not.toHaveBeenCalled();

    expect(await trialCallService.saveGuestEmail("abc-defg-hij", "req-1", "guest_1", "Marina@Example.com")).toBe(true);
    expect(trialCallRepository.setRequestEmail).toHaveBeenCalledWith("req-1", "marina@example.com");
  });

  it("SHOULD link the trial profile to a new student with the same email", async () => {
    vi.mocked(trialCallRepository.findUnlinkedProfileByEmail).mockResolvedValue("profile-1");
    expect(await trialCallService.linkProfileByEmail("marina@example.com", "student-1")).toBe("profile-1");
    expect(learningRepository.associateProfileToStudent).toHaveBeenCalledWith("profile-1", "student-1");

    vi.mocked(trialCallRepository.findUnlinkedProfileByEmail).mockResolvedValue(null);
    expect(await trialCallService.linkProfileByEmail("other@example.com", "student-2")).toBeNull();
  });

  it("SHOULD keep the existing profile when the student already has one", async () => {
    vi.spyOn(console, "error").mockImplementation(() => undefined);
    vi.mocked(trialCallRepository.findUnlinkedProfileByEmail).mockResolvedValue("profile-1");
    vi.mocked(learningRepository.associateProfileToStudent).mockRejectedValue(new Error("unique violation"));
    expect(await trialCallService.linkProfileByEmail("marina@example.com", "student-1")).toBeNull();
  });
});
