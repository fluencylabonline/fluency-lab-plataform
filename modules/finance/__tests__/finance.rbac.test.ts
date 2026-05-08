import { describe, it, expect, vi, beforeEach } from "vitest";
import { getTransactionsAction, createTransactionAction } from "../finance.actions";
import { getCurrentUser } from "@/lib/auth-server";
import { createMockUser } from "../../user/__tests__/test-utils";

// Mock dependencies
vi.mock("@/lib/auth-server", () => ({
  getCurrentUser: vi.fn(),
}));

vi.mock("@/modules/finance/finance.service", () => ({
  financeService: {
    getTransactions: vi.fn().mockResolvedValue([]),
    createTransaction: vi.fn().mockResolvedValue({ id: "new-tx-id" }),
  },
}));

vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
}));

describe("Finance RBAC - finance.actions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("[RBAC] Student SHOULD NOT be able to access transactions", async () => {
    vi.mocked(getCurrentUser).mockResolvedValue(createMockUser({
      id: "student-id",
      role: "student",
      email: "student@test.com",
    }));

    const result = await getTransactionsAction({});
    const data = result.data as { success?: boolean; error?: string };
    
    expect(data?.success).toBe(false);
    expect(data?.error).toBe("Acesso negado");
  });

  it("[RBAC] Teacher SHOULD NOT be able to access transactions", async () => {
    vi.mocked(getCurrentUser).mockResolvedValue(createMockUser({
      id: "teacher-id",
      role: "teacher",
      email: "teacher@test.com",
    }));

    const result = await getTransactionsAction({});
    const data = result.data as { success?: boolean; error?: string };
    
    expect(data?.success).toBe(false);
    expect(data?.error).toBe("Acesso negado");
  });

  it("[RBAC] Manager SHOULD be able to create transaction", async () => {
    vi.mocked(getCurrentUser).mockResolvedValue(createMockUser({
      id: "manager-id",
      role: "manager",
      email: "manager@test.com",
    }));

    const result = await createTransactionAction({
      type: "income",
      amount: 100,
      description: "Test income",
      category: "others",
      status: "paid",
      date: new Date(),
    });

    expect((result.data as { success?: boolean })?.success).toBe(true);
  });

  it("[RBAC] Student SHOULD NOT be able to create transaction", async () => {
    vi.mocked(getCurrentUser).mockResolvedValue(createMockUser({
      id: "student-id",
      role: "student",
      email: "student@test.com",
    }));

    const result = await createTransactionAction({
      type: "income",
      amount: 100,
      description: "Test income",
      category: "others",
      status: "paid",
      date: new Date(),
    });

    const data = result.data as { success?: boolean; error?: string };
    expect(data?.success).toBe(false);
    expect(data?.error).toBe("Acesso negado");
  });
});
