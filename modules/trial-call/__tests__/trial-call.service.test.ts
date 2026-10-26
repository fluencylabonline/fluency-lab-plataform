import { describe, it, expect, vi, beforeEach } from "vitest";
import { generateRoomCode, trialCallService } from "../trial-call.service";
import { trialCallRepository } from "../trial-call.repository";
import { roomCodeSchema } from "../trial-call.schema";
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
  },
}));

vi.mock("@/modules/call/call.service", () => ({
  callService: { generateStreamToken: vi.fn().mockResolvedValue("host-token") },
}));

vi.mock("@/modules/user/user.repository", () => ({
  userRepository: { findById: vi.fn().mockResolvedValue({ name: "Luara Souza" }) },
}));

vi.mock("@/env", () => ({
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
  ...over,
});

const request = (over: Partial<TrialJoinRequest> = {}): TrialJoinRequest => ({
  id: "req-1",
  roomId: "room-1",
  guestId: "guest_1",
  name: "Marina",
  status: "pending",
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
