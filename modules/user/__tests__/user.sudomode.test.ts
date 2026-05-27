import { describe, it, expect, vi, beforeEach } from "vitest";
import { revealSensitiveDataAction, requestStudentDeactivationAction } from "../user.actions";
import { getCurrentUser, verifySudoMode } from "@/lib/auth-server";
import { userService } from "../user.service";
import { createMockUser } from "./test-utils";

// Mocks
vi.mock("@/lib/auth-server", () => ({
  getCurrentUser: vi.fn(),
  verifySudoMode: vi.fn(),
}));

vi.mock("../user.service", () => ({
  userService: {
    getUserById: vi.fn(),
    updateUser: vi.fn().mockResolvedValue({ success: true }),
  },
}));

vi.mock("@/lib/rate-limit", () => ({
  checkRateLimit: vi.fn().mockResolvedValue({ success: true }),
}));

vi.mock("@/lib/cryptography", () => ({
  decrypt: vi.fn((val) => val.replace("enc:", "")),
}));

vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));

// Mock dynamic imports
vi.mock("../../contract/contract.repository", () => ({
  contractRepository: {
    findUserInstances: vi.fn().mockResolvedValue([]),
  },
}));

vi.mock("../../contract/contract.service", () => ({
  contractService: {
    requestCancellation: vi.fn().mockResolvedValue({ success: true }),
    getUserContracts: vi.fn().mockResolvedValue([]),
  },
}));

vi.mock("../../scheduling/scheduling.service", () => ({
  schedulingService: {
    cancelFutureClassesForStudent: vi.fn().mockResolvedValue(true),
  },
}));

describe("User Module - Sudo Mode Protection", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("revealSensitiveDataAction", () => {
    it("[SUDO] SHOULD block sensitive data reveal if password verification fails", async () => {
    vi.mocked(getCurrentUser).mockResolvedValue(createMockUser({ id: "admin-id", role: "admin", email: "admin@test.com" }));
      vi.mocked(verifySudoMode).mockResolvedValue(false);
      
      const result = await revealSensitiveDataAction({ userId: "u-1", field: "taxId", password: "wrong-password" });
      
      const data = result.data as { success: boolean; error?: string };
      expect(data?.success).toBe(false);
      expect(data?.error).toBe("authError");
      expect(userService.getUserById).not.toHaveBeenCalled();
    });

    it("[SUDO] SHOULD reveal and decrypt sensitive data if password is correct", async () => {
    vi.mocked(getCurrentUser).mockResolvedValue(createMockUser({ id: "admin-id", role: "admin", email: "admin@test.com" }));
      vi.mocked(verifySudoMode).mockResolvedValue(true);
      vi.mocked(userService.getUserById).mockResolvedValue({ id: "u-1", taxId: "enc:123456" } as never);
      
      const result = await revealSensitiveDataAction({ userId: "u-1", field: "taxId", password: "correct-password" });
      
      const data = result.data as { success: boolean; data?: string };
      expect(data?.success).toBe(true);
      expect(data?.data).toBe("123456");
    });
  });

  describe("requestStudentDeactivationAction", () => {
    it("[SUDO] SHOULD block deactivation if password verification fails", async () => {
    vi.mocked(getCurrentUser).mockResolvedValue(createMockUser({ id: "admin-id", role: "admin", email: "admin@test.com" }));
      vi.mocked(verifySudoMode).mockResolvedValue(false);
      
      const result = await requestStudentDeactivationAction({ userId: "u-1", password: "wrong-password" });
      
      const payload = result?.data as { success: boolean; error?: string };
      expect(payload?.success).toBe(false);
      expect(payload?.error).toBe("authError");
    });

    it("[SUDO] SHOULD proceed with deactivation if password is correct", async () => {
    vi.mocked(getCurrentUser).mockResolvedValue(createMockUser({ id: "admin-id", role: "admin", email: "admin@test.com" }));
      vi.mocked(verifySudoMode).mockResolvedValue(true);
      
      const result = await requestStudentDeactivationAction({ userId: "u-1", password: "correct-password" });
      
      const payload = result?.data as { success: boolean; error?: string };
      if (payload?.success === false) {
        console.log("DEBUG ERROR:", payload?.error);
      }

      expect(payload?.success).toBe(true);
    });
  });
});
