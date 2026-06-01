"use server";

import { actionClient, protectedAction, adminAction } from "@/lib/safe-action";
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
  .metadata({ name: "signContract" })
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
export const verifyContractAction = actionClient
  .metadata({ name: "verifyContract" })
  .inputSchema(z.object({ hash: z.string() }))
  .action(async ({ parsedInput }) => {
    return await contractService.verifyContract(parsedInput.hash);
  });

/**
 * Ação para buscar contratos do usuário (Read).
 */
export const getMyContractsAction = protectedAction
  .metadata({ name: "getMyContracts" })
  .action(async ({ ctx }) => {
    return await contractService.getMyContracts(ctx.user.id);
  });

export const getPendingContractAction = protectedAction
  .metadata({ name: "getPendingContract" })
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
  .metadata({ name: "getContractDownloadUrl" })
  .inputSchema(z.object({ instanceId: z.string() }))
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
  .metadata({ name: "resendContractEmail" })
  .inputSchema(z.object({ instanceId: z.string() }))
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

export const createContractTemplateAction = adminAction
  .metadata({ name: "createContractTemplate" })
  .inputSchema(
    z.object({
      name: z.string().min(3, "O nome deve ter pelo menos 3 caracteres."),
      content: z.string().min(10, "O conteúdo do contrato é obrigatório."),
      region: z.enum(["BR", "US"]),
      type: z.enum(["student", "teacher"]),
      partyType: z.enum(["individual", "business"]).optional().default("individual"),
    })
  )
  .action(async ({ parsedInput }) => {
    try {
      const template = await contractService.createTemplate(parsedInput);
      revalidatePath("/admin/contracts");
      return { success: true, data: template };
    } catch (error) {
      const err = error as Error;
      console.error("[createContractTemplateAction] Error:", err.message);
      return { success: false, error: err.message || "Falha ao criar o template de contrato." };
    }
  });

export const updateSchoolSettingsAction = adminAction
  .metadata({ name: "updateSchoolSettings" })
  .inputSchema(
    z.object({
      id: z.string().uuid().optional().nullable(),
      name: z.string().min(2, "O nome fantasia é obrigatório."),
      legalName: z.string().min(2, "A razão social é obrigatória."),
      taxId: z.string().min(9, "CNPJ ou Tax ID inválido."),
      representativeName: z.string().min(2, "O nome do representante é obrigatório."),
      representativeTaxId: z.string().min(11, "O CPF ou Tax ID do representante é inválido."),
      supportPhone: z.string().optional().nullable(),
      address: z.object({
        street: z.string().min(1, "A rua é obrigatória."),
        number: z.string().min(1, "O número é obrigatório."),
        neighborhood: z.string().min(1, "O bairro é obrigatório."),
        city: z.string().min(1, "A cidade é obrigatória."),
        state: z.string().min(2, "O estado é obrigatório."),
        zip: z.string().min(5, "O CEP ou ZIP é obrigatório."),
      }),
    })
  )
  .action(async ({ parsedInput }) => {
    try {
      const { id, ...data } = parsedInput;
      const settings = await contractService.updateSchoolSettings(id, {
        ...data,
        supportPhone: data.supportPhone ?? null,
      });
      revalidatePath("/admin/contracts");
      return { success: true, data: settings };
    } catch (error) {
      const err = error as Error;
      console.error("[updateSchoolSettingsAction] Error:", err.message);
      return { success: false, error: err.message || "Falha ao salvar as configurações da escola." };
    }
  });
