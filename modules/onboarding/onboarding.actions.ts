"use server";

import { protectedAction } from "@/lib/safe-action";
import {
  onboardingWelcomeSchema,
  onboardingAddressSchema,
  onboardingGuardianSchema,
  onboardingPaymentSchema,
  teacherOnboardingWelcomeSchema,
  teacherOnboardingDocumentsSchema,
  teacherOnboardingPaymentSchema,
  teacherOnboardingAvailabilitySchema,
  type NewUser
} from "../user/user.schema";
import { userRepository } from "../user/user.repository";
import { encrypt } from "@/lib/cryptography";
import { billingService } from "../billing/billing.service";
import { revalidatePath } from "next/cache";

export const onboardingWelcomeAction = protectedAction
  .inputSchema(onboardingWelcomeSchema)
  .metadata({ name: "onboardingWelcomeAction" })
  .action(async ({ parsedInput, ctx }) => {
    const { name, nickname, birthDate, guardianConsent } = parsedInput;
    const terms = await import("../contract/terms-of-use.en.json");

    // Define data retention period (e.g., 5 years for legal compliance in Brazil/LGPD)
    const dataRetentionUntil = new Date();
    dataRetentionUntil.setFullYear(dataRetentionUntil.getFullYear() + 5);

    await userRepository.update(ctx.user.id, {
      name,
      nickname,
      birthDate: new Date(birthDate),
      onboardingStep: 2,
      acceptedTermsVersion: terms.version,
      acceptedAt: new Date(),
      guardianConsent: guardianConsent || false,
      dataRetentionUntil
    });

    revalidatePath("/onboarding");
    return { success: true } as { success: boolean; error?: string };
  });

export const onboardingAddressAction = protectedAction
  .inputSchema(onboardingAddressSchema)
  .metadata({ name: "onboardingAddressAction" })
  .action(async ({ parsedInput, ctx }) => {
    const { nationality, taxId, cellphone, address, guardianData } = parsedInput;

    // Encrypt sensitive data (PII)
    const encryptedTaxId = encrypt(taxId);
    const encryptedCellphone = encrypt(cellphone);
    const encryptedAddress = encrypt(JSON.stringify(address));

    const updateData: Partial<NewUser> = {
      nationality,
      taxId: encryptedTaxId,
      cellphone: encryptedCellphone,
      address: encryptedAddress,
      onboardingStep: 3
    };

    if (guardianData) {
      updateData.guardianName = guardianData.name;
      updateData.guardianTaxId = encrypt(guardianData.taxId);
      updateData.guardianRelationship = guardianData.relationship;
    }

    await userRepository.update(ctx.user.id, updateData);

    revalidatePath("/onboarding");
    return { success: true } as { success: boolean; error?: string };
  });

export const onboardingGuardianAction = protectedAction
  .inputSchema(onboardingGuardianSchema)
  .metadata({ name: "onboardingGuardianAction" })
  .action(async ({ parsedInput, ctx }) => {
    const { guardianName, guardianTaxId, guardianRelationship } = parsedInput;

    // Encrypt sensitive data (PII)
    const encryptedGuardianTaxId = encrypt(guardianTaxId);

    await userRepository.update(ctx.user.id, {
      guardianName,
      guardianTaxId: encryptedGuardianTaxId,
      guardianRelationship,
    });

    revalidatePath("/onboarding");
    return { success: true } as { success: boolean; error?: string };
  });

export const onboardingPaymentAction = protectedAction
  .inputSchema(onboardingPaymentSchema)
  .metadata({ name: "onboardingPaymentAction" })
  .action(async ({ parsedInput, ctx }) => {
    const { dueDay } = parsedInput;
    const user = await userRepository.findById(ctx.user.id);

    if (!user) throw new Error("Usuário não encontrado");
    if (!user.assignedPlanId) throw new Error("Plano não atribuído");

    // createSubscription handles the logic and revalidation
    const subscription = await billingService.createSubscription(user.id, user.assignedPlanId, dueDay);

    // Get the first installment to return PIX data
    const firstInstallment = await billingService.getInstallmentsBySubscriptionId(subscription.id).then(insts => insts[0]);

    await userRepository.update(user.id, {
      dueDay,
      onboardingStep: 4
    });

    revalidatePath("/onboarding");
    return {
      success: true,
      data: {
        pixPayload: firstInstallment?.pixPayload,
        pixImage: firstInstallment?.pixImage,
        expiresAt: firstInstallment?.dueDate,
        installmentId: firstInstallment?.id,
        status: firstInstallment?.status
      }
    };
  });

export const completeOnboardingAction = protectedAction
  .metadata({ name: "completeOnboardingAction" })
  .action(async ({ ctx }) => {
    await userRepository.update(ctx.user.id, {
      onboarded: true
    });

    revalidatePath("/onboarding");
    revalidatePath("/hub");
    return { success: true } as { success: boolean; error?: string };
  });

// --- Teacher Onboarding Actions ---

export const teacherOnboardingWelcomeAction = protectedAction
  .inputSchema(teacherOnboardingWelcomeSchema)
  .metadata({ name: "teacherOnboardingWelcomeAction" })
  .action(async ({ parsedInput, ctx }) => {
    const { name, cellphone } = parsedInput;

    await userRepository.update(ctx.user.id, {
      name,
      cellphone: encrypt(cellphone),
      onboardingStep: 2
    });

    revalidatePath("/onboarding");
    return { success: true } as { success: boolean; error?: string };
  });

export const teacherOnboardingDocumentsAction = protectedAction
  .inputSchema(teacherOnboardingDocumentsSchema)
  .metadata({ name: "teacherOnboardingDocumentsAction" })
  .action(async ({ parsedInput, ctx }) => {
    const { taxId, businessTaxId } = parsedInput;

    await userRepository.update(ctx.user.id, {
      taxId: encrypt(taxId),
      businessTaxId: encrypt(businessTaxId),
      onboardingStep: 3
    });

    revalidatePath("/onboarding");
    return { success: true } as { success: boolean; error?: string };
  });

export const teacherOnboardingPaymentAction = protectedAction
  .inputSchema(teacherOnboardingPaymentSchema)
  .metadata({ name: "teacherOnboardingPaymentAction" })
  .action(async ({ parsedInput, ctx }) => {
    const { pixKey, pixType } = parsedInput;

    await userRepository.update(ctx.user.id, {
      pixKey: encrypt(pixKey),
      pixType,
      onboardingStep: 4
    });

    revalidatePath("/onboarding");
    return { success: true } as { success: boolean; error?: string };
  });

export const teacherOnboardingContractAction = protectedAction
  .metadata({ name: "teacherOnboardingContractAction" })
  .action(async ({ ctx }) => {
    await userRepository.update(ctx.user.id, {
      onboardingStep: 5
    });

    revalidatePath("/onboarding");
    return { success: true } as { success: boolean; error?: string };
  });

import { schedulingService } from "../scheduling/scheduling.service";

export const teacherOnboardingAvailabilityAction = protectedAction
  .inputSchema(teacherOnboardingAvailabilitySchema)
  .metadata({ name: "teacherOnboardingAvailabilityAction" })
  .action(async ({ parsedInput, ctx }) => {
    const { normalSlots, makeupSlots } = parsedInput;

    // Criar regras para horários normais
    for (const slot of normalSlots) {
      await schedulingService.createRule(
        { id: ctx.user.id, role: ctx.user.role },
        {
          teacherId: ctx.user.id,
          type: "NORMAL",
          frequency: "WEEKLY",
          startTime: slot.startTime,
          endTime: slot.endTime,
          startDate: slot.startDate,
        }
      );
    }

    // Criar regras para horários de reposição
    for (const slot of makeupSlots) {
      await schedulingService.createRule(
        { id: ctx.user.id, role: ctx.user.role },
        {
          teacherId: ctx.user.id,
          type: "REPOSICAO",
          frequency: "WEEKLY",
          startTime: slot.startTime,
          endTime: slot.endTime,
          startDate: slot.startDate,
        }
      );
    }

    await userRepository.update(ctx.user.id, {
      onboardingStep: 6
    });

    revalidatePath("/onboarding");
    return { success: true } as { success: boolean; error?: string };
  });
