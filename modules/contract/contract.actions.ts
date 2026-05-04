"use server";

import { protectedAction } from "@/lib/safe-action";
import { signContractSchema, type ContractInstance } from "./contract.schema";
import { contractService } from "./contract.service";
import { contractRepository } from "./contract.repository";
import { z } from "zod";
import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { checkRateLimit } from "@/lib/rate-limit";
import { UAParser } from "ua-parser-js";
import { getGeoLocationByIp } from "./contract.utils";

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
  .inputSchema(signContractSchema)
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

      const ua = new UAParser(userAgent).getResult();
      const browser = `${ua.browser.name} ${ua.browser.version}`.trim();
      const os = `${ua.os.name} ${ua.os.version}`.trim();

      // 3. Geolocation aproximada via IP (Audit)
      const location = await getGeoLocationByIp(ip);

      const result = await contractService.signContract(
        ctx.user.id,
        parsedInput.instanceId,
        parsedInput.guardianData,
        {
          ip,
          userAgent,
          browser: browser || "unknown",
          os: os || "unknown",
          location,
          fingerprint: parsedInput.fingerprint
        }
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
    } as { success: boolean; error?: string; data?: ContractInstance | null; downloadUrl?: string };
  });

export const getContractDownloadUrlAction = protectedAction
  .schema(z.object({ instanceId: z.string() }))
  .action(async ({ parsedInput, ctx }) => {
    try {
      const instance = await contractRepository.findInstanceById(parsedInput.instanceId);
      if (!instance) throw new Error("Contrato não encontrado.");

      // Permission check: Own user or Admin/Manager
      if (instance.userId !== ctx.user.id && ctx.user.role !== "admin" && ctx.user.role !== "manager") {
        throw new Error("Sem permissão para acessar este contrato.");
      }

      if (!instance.pdfUrl) throw new Error("PDF ainda não foi gerado para este contrato.");

      const downloadUrl = await contractService.getSignedUrl(instance.pdfUrl);
      return { success: true, downloadUrl } as { success: boolean; error?: string; downloadUrl?: string };
    } catch (error) {
      const err = error as Error;
      console.error("[getContractDownloadUrlAction] Error:", err.message);
      return { success: false, error: err.message || "Falha ao gerar URL de download." };
    }
  });

export const resendContractEmailAction = protectedAction
  .schema(z.object({ instanceId: z.string() }))
  .action(async ({ parsedInput, ctx }) => {
    try {
      const result = await contractService.resendContractEmail(ctx.user.id, parsedInput.instanceId);
      return result as { success: boolean; error?: string };
    } catch (error) {
      const err = error as Error;
      console.error("[resendContractEmailAction] Error:", err.message);
      return { success: false, error: err.message || "Falha ao reenviar e-mail do contrato." };
    }
  });
