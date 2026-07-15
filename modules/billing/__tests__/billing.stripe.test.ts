import { describe, it, expect, vi, beforeEach } from "vitest";
import { billingService } from "../billing.service";
import { billingRepository } from "../billing.repository";
import { userService } from "../../user/user.service";
import { createStripeCheckoutSession } from "@/lib/stripe";
import { createPixCharge } from "@/lib/abacate-pay";

// Mocks
vi.mock("@/lib/stripe", () => ({
  createStripeCheckoutSession: vi.fn(),
  stripe: {
    paymentIntents: {
      retrieve: vi.fn(),
    },
    checkout: {
      sessions: {
        retrieve: vi.fn(),
        expire: vi.fn(),
      },
    },
  },
}));

vi.mock("@/lib/abacate-pay", () => ({
  createPixCharge: vi.fn(),
  abacate: {
    customers: {
      create: vi.fn(),
    },
  },
}));

vi.mock("../billing.repository", () => ({
  billingRepository: {
    updateInstallment: vi.fn(),
    findSubscriptionById: vi.fn(),
    findInstallmentById: vi.fn(),
    createAuditLog: vi.fn(),
  },
}));

vi.mock("../../user/user.service", () => ({
  userService: {
    getUser: vi.fn(),
  },
}));

vi.mock("../../communication/communication.service", () => ({
  communicationService: {
    sendNewInvoiceEmail: vi.fn(),
    sendPaymentReminderWhatsApp: vi.fn(),
  },
}));

describe("Billing Gateway Dispatcher (Stripe Checkout vs AbacatePay)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const INSTALLMENT_ID = "inst-123";
  const SUB_ID = "sub-123";
  const STUDENT_ID = "student-123";

  it("SHOULD dispatch to Stripe Checkout Session when the plan currency is USD", async () => {
    // 1. Mock DB data
    vi.spyOn(billingService, "getInstallmentById").mockResolvedValue({
      id: INSTALLMENT_ID,
      subscriptionId: SUB_ID,
      amount: 15000,
      orderIndex: 1,
      dueDate: new Date(),
    } as unknown as Awaited<ReturnType<typeof billingService.getInstallmentById>>);

    vi.mocked(billingRepository.findSubscriptionById).mockResolvedValue({
      id: SUB_ID,
      studentId: STUDENT_ID,
      status: "active",
      plan: {
        name: "Premium Plan",
        durationMonths: 12,
        currency: "USD",
      },
    } as unknown as Awaited<ReturnType<typeof billingRepository.findSubscriptionById>>);

    vi.mocked(userService.getUser).mockResolvedValue({
      id: STUDENT_ID,
      email: "foreign@example.com",
      name: "John Doe",
      nationality: "foreign",
      cellphone: "123456789",
    } as unknown as Awaited<ReturnType<typeof userService.getUser>>);

    // 2. Mock Stripe Checkout Session response
    vi.mocked(createStripeCheckoutSession).mockResolvedValue({
      id: "cs_stripe_123",
      url: "https://checkout.stripe.com/pay/cs_stripe_123",
    } as unknown as Awaited<ReturnType<typeof createStripeCheckoutSession>>);

    // 3. Call service
    await billingService.generateInvoiceForInstallment(INSTALLMENT_ID);

    // 4. Assertions
    expect(createStripeCheckoutSession).toHaveBeenCalledWith({
      amount: 15000,
      email: "foreign@example.com",
      name: "John Doe",
      description: "Mensalidade Premium Plan - 1/12",
      successUrl: expect.stringContaining("/onboarding?success=true"),
      cancelUrl: expect.stringContaining("/onboarding?cancelled=true"),
      metadata: {
        installmentId: INSTALLMENT_ID,
        subscriptionId: SUB_ID,
      },
    });

    expect(billingRepository.updateInstallment).toHaveBeenCalledWith(INSTALLMENT_ID, {
      stripePaymentIntentId: "cs_stripe_123",
      pixPayload: "https://checkout.stripe.com/pay/cs_stripe_123",
      pixImage: null,
      status: "pending",
    });

    expect(createPixCharge).not.toHaveBeenCalled();
  });

  it("SHOULD dispatch to AbacatePay when the plan currency is BRL", async () => {
    // 1. Mock DB data
    vi.spyOn(billingService, "getInstallmentById").mockResolvedValue({
      id: INSTALLMENT_ID,
      subscriptionId: SUB_ID,
      amount: 15000,
      orderIndex: 1,
      dueDate: new Date(),
    } as unknown as Awaited<ReturnType<typeof billingService.getInstallmentById>>);

    vi.mocked(billingRepository.findSubscriptionById).mockResolvedValue({
      id: SUB_ID,
      studentId: STUDENT_ID,
      status: "active",
      plan: {
        name: "Premium Plan",
        durationMonths: 12,
        abacatePayProductId: "prod-123",
        currency: "BRL",
      },
    } as unknown as Awaited<ReturnType<typeof billingRepository.findSubscriptionById>>);

    vi.mocked(userService.getUser).mockResolvedValue({
      id: STUDENT_ID,
      email: "brazilian@example.com",
      name: "José Silva",
      nationality: "brazilian",
      taxId: "12345678901",
      cellphone: "123456789",
      abacatePayCustomerId: "cust-123",
    } as unknown as Awaited<ReturnType<typeof userService.getUser>>);

    // 2. Mock AbacatePay response
    vi.mocked(createPixCharge).mockResolvedValue({
      id: "ch_abacate_123",
      brCode: "abacate_pix_copy_paste_payload",
      brCodeBase64: "abacate_qr_code_base64_data",
    } as unknown as Awaited<ReturnType<typeof createPixCharge>>);

    // 3. Call service
    await billingService.generateInvoiceForInstallment(INSTALLMENT_ID);

    // 4. Assertions
    expect(createPixCharge).toHaveBeenCalled();
    expect(createStripeCheckoutSession).not.toHaveBeenCalled();

    expect(billingRepository.updateInstallment).toHaveBeenCalledWith(INSTALLMENT_ID, {
      abacatePayBillingId: "ch_abacate_123",
      pixPayload: "abacate_pix_copy_paste_payload",
      pixImage: "abacate_qr_code_base64_data",
      status: "pending",
    });
  });

  describe("Amount Update and Dynamic Expiration", () => {
    it("SHOULD expire Stripe session and regenerate invoice when amount changes for USD plans", async () => {
      const installmentMock = {
        id: INSTALLMENT_ID,
        subscriptionId: SUB_ID,
        amount: 10000,
        status: "pending",
        dueDate: new Date(Date.now() + 3600 * 24 * 10 * 1000), // 10 days in future
        stripePaymentIntentId: "cs_old_stripe" as string | null,
        pixPayload: null as string | null,
        pixImage: null as string | null,
        abacatePayBillingId: null as string | null,
      };

      vi.mocked(billingRepository.findInstallmentById).mockResolvedValue(
        installmentMock as unknown as Awaited<ReturnType<typeof billingRepository.findInstallmentById>>
      );

      vi.spyOn(billingService, "getInstallmentById").mockImplementation(async () => {
        return installmentMock as unknown as Awaited<ReturnType<typeof billingService.getInstallmentById>>;
      });

      vi.mocked(billingRepository.updateInstallment).mockImplementation(async (id, data) => {
        Object.assign(installmentMock, data);
      });

      vi.mocked(billingRepository.findSubscriptionById).mockResolvedValue({
        id: SUB_ID,
        studentId: STUDENT_ID,
        status: "active",
        plan: {
          name: "Premium USD",
          durationMonths: 12,
          currency: "USD",
        },
      } as unknown as Awaited<ReturnType<typeof billingRepository.findSubscriptionById>>);

      vi.mocked(userService.getUser).mockResolvedValue({
        id: STUDENT_ID,
        email: "student@example.com",
        name: "Test Student",
        cellphone: "123456",
      } as unknown as Awaited<ReturnType<typeof userService.getUser>>);

      const { stripe } = await import("@/lib/stripe");
      vi.mocked(createStripeCheckoutSession).mockResolvedValue({
        id: "cs_new_stripe",
        url: "https://newcheckout.stripe.com",
      } as unknown as Awaited<ReturnType<typeof createStripeCheckoutSession>>);

      await billingService.updateInstallment(INSTALLMENT_ID, { amount: 15000 }, { id: "admin-1", name: "Admin" });

      // Should expire the old Stripe Checkout Session
      expect(stripe.checkout.sessions.expire).toHaveBeenCalledWith("cs_old_stripe");

      // Should clean DB billing fields and save new amount
      expect(installmentMock.amount).toBe(15000);
      expect(installmentMock.stripePaymentIntentId).toBe("cs_new_stripe");
      expect(installmentMock.pixPayload).toBe("https://newcheckout.stripe.com");

      // Should create audit log
      expect(billingRepository.createAuditLog).toHaveBeenCalled();
    });

    it("SHOULD pass dynamic expiration corresponding to dueDate in createPixCharge", async () => {
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 15); // 15 days in the future

      const installmentMock = {
        id: INSTALLMENT_ID,
        subscriptionId: SUB_ID,
        amount: 12000,
        status: "pending",
        dueDate: futureDate,
        abacatePayBillingId: "ch_old_abacate" as string | null,
        pixPayload: null as string | null,
        pixImage: null as string | null,
        stripePaymentIntentId: null as string | null,
      };

      vi.mocked(billingRepository.findInstallmentById).mockResolvedValue(
        installmentMock as unknown as Awaited<ReturnType<typeof billingRepository.findInstallmentById>>
      );

      vi.spyOn(billingService, "getInstallmentById").mockImplementation(async () => {
        return installmentMock as unknown as Awaited<ReturnType<typeof billingService.getInstallmentById>>;
      });

      vi.mocked(billingRepository.updateInstallment).mockImplementation(async (id, data) => {
        Object.assign(installmentMock, data);
      });

      vi.mocked(billingRepository.findSubscriptionById).mockResolvedValue({
        id: SUB_ID,
        studentId: STUDENT_ID,
        status: "active",
        plan: {
          name: "Plan BRL",
          durationMonths: 6,
          abacatePayProductId: "prod-brl",
          currency: "BRL",
        },
      } as unknown as Awaited<ReturnType<typeof billingRepository.findSubscriptionById>>);

      vi.mocked(userService.getUser).mockResolvedValue({
        id: STUDENT_ID,
        email: "student@example.com",
        name: "Test Student",
        taxId: "12345678901",
        cellphone: "123456",
        abacatePayCustomerId: "cust-1",
      } as unknown as Awaited<ReturnType<typeof userService.getUser>>);

      vi.mocked(createPixCharge).mockResolvedValue({
        id: "ch_new_abacate",
        brCode: "new_pix_code",
        brCodeBase64: "new_pix_image",
      } as unknown as Awaited<ReturnType<typeof createPixCharge>>);

      await billingService.updateInstallment(INSTALLMENT_ID, { amount: 14000 }, { id: "admin-1", name: "Admin" });

      // Should call createPixCharge with dynamic expiresIn and updated amount
      expect(createPixCharge).toHaveBeenCalledWith(
        expect.objectContaining({
          amount: 14000,
          expiresIn: expect.any(Number),
        })
      );

      // Verify the value is approximately 15 days (greater than min 7 days)
      const callArgs = vi.mocked(createPixCharge).mock.calls[0][0];
      expect(callArgs.expiresIn).toBeGreaterThan(3600 * 24 * 14); // Greater than 14 days
      expect(callArgs.expiresIn).toBeLessThan(3600 * 24 * 16); // Less than 16 days
    });
  });
});
