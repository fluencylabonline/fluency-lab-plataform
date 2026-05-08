import { describe, it, expect, vi, beforeEach } from "vitest";
import { cancelSubscriptionAction, getInstallmentStatusAction, getPaymentDetailsAction } from "../billing.actions";
import { getCurrentUser } from "@/lib/auth-server";
import { billingRepository } from "../billing.repository";
import { billingService } from "../billing.service";
import { createMockUser } from "../../user/__tests__/test-utils";

// Mocks
vi.mock("@/lib/auth-server", () => ({
  getCurrentUser: vi.fn(),
  verifySudoMode: vi.fn(),
}));

vi.mock("../billing.repository", () => ({
  billingRepository: {
    findSubscriptionById: vi.fn(),
  },
}));

vi.mock("../billing.service", () => ({
  billingService: {
    cancelSubscription: vi.fn(),
    getPaymentDetailsForReceipt: vi.fn(),
    getInstallmentById: vi.fn(),
  },
}));

vi.mock("next-intl/server", () => ({
  getTranslations: () => Promise.resolve((key: string) => key),
}));

vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
}));

describe("Billing IDOR Prevention", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const USER_A_ID = "user-a-uuid";
  const USER_B_ID = "user-b-uuid";
  const UUID = "647b0a3c-1b7a-449e-9d8a-6b6d5c6e5a4b";

  it("[IDOR] Student B SHOULD NOT be able to cancel subscription of Student A", async () => {
    vi.mocked(getCurrentUser).mockResolvedValue(createMockUser({
      id: USER_B_ID,
      role: "student",
    }));

    vi.mocked(billingRepository.findSubscriptionById).mockResolvedValue({
      id: UUID,
      studentId: USER_A_ID,
    } as never);

    const result = await cancelSubscriptionAction({ subscriptionId: UUID });

    expect(result.serverError).toBe("unauthorized");
    expect(billingService.cancelSubscription).not.toHaveBeenCalled();
  });

  it("[IDOR] Student B SHOULD NOT be able to see payment details of Student A", async () => {
    vi.mocked(getCurrentUser).mockResolvedValue(createMockUser({
      id: USER_B_ID,
      role: "student",
    }));

    vi.mocked(billingService.getPaymentDetailsForReceipt).mockResolvedValue({
      id: UUID,
      studentId: USER_A_ID,
    } as never);

    const result = await getPaymentDetailsAction({ id: UUID });

    const data = result.data as { success?: boolean; error?: string };
    expect(data?.success).toBe(false);
    expect(data?.error).toBe("Acesso negado");
  });

  it("[OWNER] Student A SHOULD be able to cancel their own subscription", async () => {
    vi.mocked(getCurrentUser).mockResolvedValue(createMockUser({
      id: USER_A_ID,
      role: "student",
    }));

    vi.mocked(billingRepository.findSubscriptionById).mockResolvedValue({
      id: UUID,
      studentId: USER_A_ID,
    } as never);

    vi.mocked(billingService.cancelSubscription).mockResolvedValue({ success: true } as never);

    const result = await cancelSubscriptionAction({ subscriptionId: UUID });

    expect(result.serverError).toBeUndefined();
    const data = result.data as { success?: boolean; error?: string };
    expect(data?.success).toBe(true);
    expect(billingService.cancelSubscription).toHaveBeenCalledWith(UUID);
  });

  it("[IDOR] Student B SHOULD NOT be able to view installment status of Student A", async () => {
    vi.mocked(getCurrentUser).mockResolvedValue(createMockUser({
      id: USER_B_ID,
      role: "student",
    }));

    vi.mocked(billingService.getInstallmentById).mockResolvedValue({
      id: UUID,
      subscriptionId: UUID,
      status: "pending",
    } as never);

    vi.mocked(billingRepository.findSubscriptionById).mockResolvedValue({
      id: UUID,
      studentId: USER_A_ID,
    } as never);

    const result = await getInstallmentStatusAction({ installmentId: UUID });

    expect(result.serverError).toBe("unauthorized");
  });

  it("[ADMIN] Admin SHOULD be able to cancel any subscription (Role Bypass)", async () => {
    vi.mocked(getCurrentUser).mockResolvedValue(createMockUser({
      id: "admin-uuid",
      role: "admin",
    }));

    vi.mocked(billingRepository.findSubscriptionById).mockResolvedValue({
      id: UUID,
      studentId: USER_A_ID,
    } as never);

    vi.mocked(billingService.cancelSubscription).mockResolvedValue({ success: true } as never);

    const result = await cancelSubscriptionAction({ subscriptionId: UUID });

    expect(result.serverError).toBeUndefined();
    const data = result.data as { success?: boolean; error?: string };
    expect(data?.success).toBe(true);
  });
});
