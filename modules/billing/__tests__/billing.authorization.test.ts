import { describe, it, expect, vi, beforeEach } from "vitest";
import { 
  createSubscriptionAction, 
  updateInstallmentAction, 
  createPlanAction,
  togglePlanStatusAction
} from "../billing.actions";
import { getCurrentUser, verifySudoMode } from "@/lib/auth-server";
import { createMockUser } from "../../user/__tests__/test-utils";

// Mocks
vi.mock("@/lib/auth-server", () => ({
  getCurrentUser: vi.fn(),
  verifySudoMode: vi.fn(),
}));

vi.mock("../billing.service", () => ({
  billingService: {
    createSubscription: vi.fn().mockResolvedValue({ success: true }),
    markInstallmentAsPaid: vi.fn().mockResolvedValue({ success: true }),
    updateInstallment: vi.fn().mockResolvedValue({ success: true }),
    createPlan: vi.fn().mockResolvedValue({ id: "plan-123" }),
    updatePlan: vi.fn().mockResolvedValue({ id: "plan-123" }),
    findInstallmentById: vi.fn().mockResolvedValue({ id: "inst-123", status: "pending", amount: 1000 }),
  },
}));

vi.mock("next-intl/server", () => ({
  getTranslations: () => Promise.resolve((key: string) => key),
}));

vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));

describe("Billing Authorization & RBAC", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const VALID_UUID = "647b0a3c-1b7a-449e-9d8a-6b6d5c6e5a4b";

  it("[RBAC] Student SHOULD NOT be able to create a subscription", async () => {
    vi.mocked(getCurrentUser).mockResolvedValue(createMockUser({ id: "u-1", role: "student" }));
    const result = await createSubscriptionAction({ studentId: "u-2", planId: VALID_UUID, dueDay: 5 });
    expect(result.serverError).toBe("unauthorized");
  });

  it("[RBAC] Manager SHOULD NOT be able to create a plan (Admin only)", async () => {
    vi.mocked(getCurrentUser).mockResolvedValue(createMockUser({ id: "u-1", role: "manager" }));
    const result = await createPlanAction({ name: "Plan", price: 100, durationMonths: 1, language: "EN", classesPerWeek: 1 });
    expect(result.serverError).toBe("unauthorized");
  });

  it("[RBAC] Teacher SHOULD NOT be able to toggle plan status", async () => {
    vi.mocked(getCurrentUser).mockResolvedValue(createMockUser({ id: "u-1", role: "teacher" }));
    const result = await togglePlanStatusAction({ id: VALID_UUID, isActive: false });
    expect(result.serverError).toBe("unauthorized");
  });

  it("[RBAC] Admin SHOULD be able to create subscription", async () => {
    vi.mocked(getCurrentUser).mockResolvedValue(createMockUser({ id: "u-1", role: "admin" }));
    const result = await createSubscriptionAction({ studentId: "u-2", planId: VALID_UUID, dueDay: 10 });
    expect(result.serverError).toBeUndefined();
    const data = result.data as { success?: boolean; error?: string };
    expect(data?.success).toBe(true);
  });
});

describe("Billing Sudo Mode - updateInstallmentAction", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const INST_ID = "647b0a3c-1b7a-449e-9d8a-6b6d5c6e5a4b";

  it("[SUDO] SHOULD block marking as paid if password is missing", async () => {
    vi.mocked(getCurrentUser).mockResolvedValue(createMockUser({ id: "admin-id", role: "admin", email: "a@test.com" }));
    
    const result = await updateInstallmentAction({ 
      id: INST_ID, 
      status: "paid" 
    });

    const data = result.data as { success?: boolean; error?: string };
    expect(data?.success).toBe(false);
    expect(data?.error).toContain("confirmação de senha é obrigatória");
  });

  it("[SUDO] SHOULD block marking as paid if password is incorrect", async () => {
    vi.mocked(getCurrentUser).mockResolvedValue(createMockUser({ id: "admin-id", role: "admin", email: "a@test.com" }));
    vi.mocked(verifySudoMode).mockResolvedValue(false);
    
    const result = await updateInstallmentAction({ 
      id: INST_ID, 
      status: "paid",
      password: "wrong"
    });

    const data = result.data as { success?: boolean; error?: string };
    expect(data?.success).toBe(false);
    expect(data?.error).toContain("Senha incorreta");
  });

  it("[SUDO] SHOULD allow marking as paid with correct password", async () => {
    vi.mocked(getCurrentUser).mockResolvedValue(createMockUser({ id: "admin-id", role: "admin", email: "a@test.com" }));
    vi.mocked(verifySudoMode).mockResolvedValue(true);
    
    const result = await updateInstallmentAction({ 
      id: INST_ID, 
      status: "paid",
      password: "correct"
    });

    const data = result.data as { success?: boolean; error?: string };
    expect(data?.success).toBe(true);
  });

  it("[SUDO] SHOULD allow changing amount WITHOUT password (not a sensitive 'paid' status change)", async () => {
    vi.mocked(getCurrentUser).mockResolvedValue(createMockUser({ id: "admin-id", role: "admin" }));
    
    const result = await updateInstallmentAction({ 
      id: INST_ID, 
      amount: 5000 // Not changing status to paid
    });

    const data = result.data as { success?: boolean; error?: string };
    expect(data?.success).toBe(true);
    expect(verifySudoMode).not.toHaveBeenCalled();
  });
});
