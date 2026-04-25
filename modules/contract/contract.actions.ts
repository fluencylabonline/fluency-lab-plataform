"use server";

import { protectedAction } from "@/lib/safe-action";
import { signContractSchema } from "./contract.schema";
import { contractService } from "./contract.service";
import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { checkRateLimit } from "@/lib/rate-limit";

/**
 * Server Actions de Contratos (FluencyLab)
 * 
 * Porteiro de entrada para o cliente. Valida o payload e a sessão
 * antes de chamar a lógica de negócio no Service.
 */

/**
 * Ação para assinar um contrato digitalmente.
 */
export const signContractAction = protectedAction
  .schema(signContractSchema)
  .action(async ({ parsedInput, ctx }) => {
    try {
      // 1. Rate Limiting (Segurança: Limita a 5 tentativas de assinatura por dia)
      const rateLimitByIp = await checkRateLimit("contract_signature", ctx.user.id, 5);
      if (!rateLimitByIp.success) {
        return { success: false, error: "Limite de assinaturas diárias atingido. Tente novamente amanhã." };
      }

      // 2. Coleta de Metadados de Auditoria (IP e User agent)
      const h = await headers();
      const ip = h.get("x-forwarded-for")?.split(",")[0] || "unknown";
      const userAgent = h.get("user-agent") || "unknown";

      const result = await contractService.signContract(
        ctx.user.id, 
        parsedInput.instanceId, 
        parsedInput.guardianData,
        { ip, userAgent }
      );
      
      // Revalida as rotas que dependem do status dos contratos
      revalidatePath("/student", "layout");
      revalidatePath("/teacher", "layout");
      
      return { 
        success: true, 
        pdfPath: result.pdfPath,
        downloadUrl: result.downloadUrl
      } as { success: boolean; error?: string; pdfPath?: string; downloadUrl?: string };
    } catch (error) {
      const err = error as Error;
      console.error("[signContractAction] Error:", err.message);
      return { 
        success: false, 
        error: err.message || "Falha ao processar assinatura do contrato." 
      };
    }
  });

/**
 * Ação pública para verificar validade de um contrato via hash.
 */
export const verifyContractAction = async (hash: string) => {
  return await contractService.verifyContract(hash);
};

/**
 * Ação para buscar contratos do usuário (Read).
 */
export const getMyContractsAction = protectedAction
  .action(async ({ ctx }) => {
    return await contractService.getMyContracts(ctx.user.id);
  });

export const getPendingContractAction = protectedAction
  .action(async ({ ctx }) => {
    const instance = await contractService.prepareOnboardingContract(ctx.user.id);
    
    let downloadUrl: string | undefined;
    if (instance && instance.status === "signed" && instance.pdfUrl) {
      downloadUrl = await contractService.getSignedUrl(instance.pdfUrl);
    }

    return { 
      success: true, 
      data: instance,
      downloadUrl 
    } as { success: boolean; error?: string; data?: any; downloadUrl?: string };
  });
