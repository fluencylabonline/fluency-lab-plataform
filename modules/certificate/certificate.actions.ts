"use server";

import { managerAction, protectedAction } from "@/lib/safe-action";
import { z } from "zod";
import { certificateService } from "./certificate.service";
import { issueCertificateSchema } from "./certificate.types";
import { revalidatePath } from "next/cache";

export const getCertificateDataAction = managerAction
  .inputSchema(z.object({ studentId: z.string(), language: z.string() }))
  .action(async ({ parsedInput }) => {
    try {
      const data = await certificateService.generateCertificateData(parsedInput.studentId, parsedInput.language);
      return { success: true, data };
    } catch (error) {
      console.error("[getCertificateDataAction] Error:", error);
      return { success: false, error: (error as Error).message };
    }
  });

export const issueCertificateAction = managerAction
  .inputSchema(issueCertificateSchema)
  .action(async ({ parsedInput, ctx }) => {
    try {
      const certificate = await certificateService.issueCertificate(ctx.user.id, parsedInput);
      revalidatePath(`/hub/admin/users/${parsedInput.studentId}`);
      revalidatePath(`/hub/manager/users/${parsedInput.studentId}`);
      return { success: true, data: certificate };
    } catch (error) {
      console.error("[issueCertificateAction] Error:", error);
      return { success: false, error: (error as Error).message };
    }
  });

export const getStudentCertificatesAction = protectedAction
  .inputSchema(z.object({ studentId: z.string() }))
  .action(async ({ parsedInput }) => {
    try {
      const certificates = await certificateService.getStudentCertificates(parsedInput.studentId);
      return { success: true, data: certificates };
    } catch (error) {
      console.error("[getStudentCertificatesAction] Error:", error);
      return { success: false, error: (error as Error).message };
    }
  });

export const saveCertificatePdfAction = managerAction
  .inputSchema(z.object({ code: z.string(), pdfUrl: z.string() }))
  .action(async ({ parsedInput }) => {
    try {
      await certificateService.savePdfUrl(parsedInput.code, parsedInput.pdfUrl);
      return { success: true };
    } catch (error) {
      console.error("[saveCertificatePdfAction] Error:", error);
      return { success: false, error: (error as Error).message };
    }
  });
