import { describe, it, expect, vi, beforeEach } from "vitest";
import { billingService } from "../billing.service";
import { billingRepository } from "../billing.repository";
import { userService } from "../../user/user.service";
import { createStripePixPaymentIntent } from "@/lib/stripe";
import { createPixCharge } from "@/lib/abacate-pay";

// Mocks
vi.mock("@/lib/stripe", () => ({
  createStripePixPaymentIntent: vi.fn(),
  stripe: {
    paymentIntents: {
      retrieve: vi.fn(),
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

describe("Billing Gateway Dispatcher (Stripe vs AbacatePay)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const INSTALLMENT_ID = "inst-123";
  const SUB_ID = "sub-123";
  const STUDENT_ID = "student-123";

  it("SHOULD dispatch to Stripe Pix when the student is a foreign student", async () => {
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
      },
    } as unknown as Awaited<ReturnType<typeof billingRepository.findSubscriptionById>>);

    vi.mocked(userService.getUser).mockResolvedValue({
      id: STUDENT_ID,
      email: "foreign@example.com",
      name: "John Doe",
      nationality: "foreign",
      cellphone: "123456789",
    } as unknown as Awaited<ReturnType<typeof userService.getUser>>);

    // 2. Mock Stripe PaymentIntent response
    vi.mocked(createStripePixPaymentIntent).mockResolvedValue({
      id: "pi_stripe_123",
      next_action: {
        display_pix_qr_code: {
          data: "stripe_pix_copy_paste_payload",
          qr_code_image_base64: "stripe_qr_code_base64_data",
        },
      },
    } as unknown as Awaited<ReturnType<typeof createStripePixPaymentIntent>>);

    // 3. Call service
    await billingService.generateInvoiceForInstallment(INSTALLMENT_ID);

    // 4. Assertions
    expect(createStripePixPaymentIntent).toHaveBeenCalledWith({
      amount: 15000,
      email: "foreign@example.com",
      name: "John Doe",
      description: "Mensalidade Premium Plan - 1/12",
      metadata: {
        installmentId: INSTALLMENT_ID,
        subscriptionId: SUB_ID,
      },
    });

    expect(billingRepository.updateInstallment).toHaveBeenCalledWith(INSTALLMENT_ID, {
      stripePaymentIntentId: "pi_stripe_123",
      pixPayload: "stripe_pix_copy_paste_payload",
      pixImage: "data:image/png;base64,stripe_qr_code_base64_data",
      status: "pending",
    });

    expect(createPixCharge).not.toHaveBeenCalled();
  });

  it("SHOULD dispatch to AbacatePay when the student is a Brazilian student", async () => {
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
    expect(createStripePixPaymentIntent).not.toHaveBeenCalled();

    expect(billingRepository.updateInstallment).toHaveBeenCalledWith(INSTALLMENT_ID, {
      abacatePayBillingId: "ch_abacate_123",
      pixPayload: "abacate_pix_copy_paste_payload",
      pixImage: "abacate_qr_code_base64_data",
      status: "pending",
    });
  });
});
