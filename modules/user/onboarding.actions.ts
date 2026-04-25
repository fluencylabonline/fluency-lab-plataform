"use server";

import { protectedAction } from "@/lib/safe-action";
import { onboardingWelcomeSchema, onboardingAddressSchema, onboardingGuardianSchema, onboardingPaymentSchema, type NewUser } from "./user.schema";
import { userRepository } from "./user.repository";
import { encrypt } from "@/lib/cryptography";
import { billingService } from "../billing/billing.service";
import { revalidatePath } from "next/cache";

export const onboardingWelcomeAction = protectedAction
  .inputSchema(onboardingWelcomeSchema)
  .action(async ({ parsedInput, ctx }) => {
    const { name, nickname, birthDate } = parsedInput;
    
    await userRepository.update(ctx.user.id, {
      name,
      nickname,
      birthDate: new Date(birthDate),
      onboardingStep: 2
    });
    
    revalidatePath("/onboarding");
    return { success: true } as { success: boolean; error?: string };
  });

export const onboardingAddressAction = protectedAction
  .inputSchema(onboardingAddressSchema)
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
  .action(async ({ ctx }) => {
    await userRepository.update(ctx.user.id, {
      onboarded: true
    });
    
    revalidatePath("/onboarding");
    revalidatePath("/hub");
    return { success: true } as { success: boolean; error?: string };
  });
