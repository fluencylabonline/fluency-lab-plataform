import { contractRepository } from "./contract.repository";
import { userService } from "../user/user.service";
import { encrypt, generateIntegrityHash } from "@/lib/cryptography";
import { PDFDocument, StandardFonts } from "pdf-lib";
import { adminStorage } from "@/lib/firebase-admin";
import { injectTemplateData } from "./contract.service.utils";
import { communicationService } from "../communication/communication.service";
import { env } from "@/env";
import { billingService } from "../billing/billing.service";
import { addMonths } from "date-fns";
import { ContractSignatureMetadata } from "./contract.schema";
import { schedulingService } from "../scheduling/scheduling.service";

interface GuardianData {
  name: string;
  taxId: string;
  relationship: string;
}

/**
 * Service de Contratos (FluencyLab)
 * 
 * Orquestra a lógica de negócio, segurança e integrações (PDF/Storage).
 * Segue o padrão "Fat Server".
 */
export const contractService = {
  /**
   * Gera uma URL assinada para download de um arquivo do Storage.
   */
  async getSignedUrl(path: string): Promise<string> {
    const bucket = adminStorage.bucket(env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET);
    const [url] = await bucket.file(path).getSignedUrl({
      action: "read",
      expires: Date.now() + 1000 * 60 * 60, // 1 hora
    });
    return url;
  },

  /**
   * Cria ou atualiza um template com versionamento automático.
   */
  async createTemplate(data: { 
    name: string; 
    content: string; 
    region: "BR" | "US"; 
    type: "student" | "teacher";
    partyType?: "individual" | "business";
  }) {
    const lastTemplate = await contractRepository.findLastTemplateVersion(data.name, data.region);
    const nextVersion = lastTemplate ? (parseInt(lastTemplate.version) + 1).toString() : "1";

    // Desativa versões anteriores do mesmo template para que apenas a nova seja ativa
    await contractRepository.deactivateTemplatesByName(data.name, data.region);

    return contractRepository.insertTemplate({
      ...data,
      version: nextVersion,
      isActive: true,
    });
  },

  /**
   * Realiza a assinatura digital de um contrato com auditoria forense.
   */
  async signContract(
    userId: string, 
    instanceId: string, 
    guardianData?: GuardianData,
    auditMetadata?: { 
      ip: string; 
      userAgent: string;
      browser?: string;
      os?: string;
      location?: string;
      fingerprint?: string;
    }
  ) {
    // 1. Validações de Existência e Permissão (ABAC)
    const instance = await contractRepository.findInstanceById(instanceId);
    
    if (!instance) {
      throw new Error("Contrato não encontrado.");
    }
    
    if (instance.status !== "pending") {
      throw new Error("Este contrato já foi assinado ou está cancelado.");
    }
    
    if (instance.userId !== userId) {
      throw new Error("Você não tem permissão para assinar este contrato.");
    }

    const user = await userService.getUser(userId);
    if (!user) {
      throw new Error("Usuário associado ao contrato não encontrado.");
    }

    // 2. Busca configurações da escola (Escola Única)
    const schoolSettings = await contractRepository.getSchoolSettings();
    if (!schoolSettings) {
      throw new Error("Configurações da escola (CNPJ/Endereço) não encontradas no sistema.");
    }

    // 3. Injeção de Dados e Geração de Conteúdo Final (Snapshot)
    const finalContent = injectTemplateData(instance.template.content, {
      user: {
        name: user.name,
        email: user.email,
        taxId: user.taxId ?? "",
      },
      guardian: guardianData,
      school: schoolSettings,
      date: new Date().toLocaleDateString("pt-BR"),
    });

    // 4. Integridade: Hash SHA-256 do conteúdo + metadados
    const metadata = { userId, timestamp: new Date().toISOString() };
    const hashData = finalContent + JSON.stringify(metadata);
    const integrityHash = generateIntegrityHash(hashData, metadata);

    // 5. Segurança: Criptografia de dados sensíveis do responsável (PII)
    // Se o aluno for menor, salvamos os dados do responsável criptografados na instância.
    const encryptedGuardianData = guardianData ? encrypt(JSON.stringify(guardianData)) : null;

    // 6. Geração de PDF e Upload para Firebase Storage
    // Adicionamos o Integrity Hash e o link de verificação no PDF
    const verificationUrl = `${env.NEXT_PUBLIC_APP_URL}/verify/${integrityHash}`;
    const pdfBytes = await this.generatePDF(
      instance.template.name, 
      finalContent, 
      user.name,
      { hash: integrityHash, url: verificationUrl }
    );
    const pdfPath = `contracts/${userId}/${instanceId}_${Date.now()}.pdf`;

    const bucket = adminStorage.bucket(env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET);

    try {
      const file = bucket.file(pdfPath);
      await file.save(Buffer.from(pdfBytes), {
        metadata: { 
          contentType: "application/pdf",
          metadata: {
            ownerId: userId,
            instanceId: instanceId,
            hash: integrityHash
          }
        },
      });
    } catch (error) {
      console.error("[ContractService.signContract] PDF Storage Error:", error);
      throw new Error("Erro ao salvar o arquivo PDF do contrato.");
    }

    // 6.5 Calcular expiração baseada no plano
    const subscription = await billingService.getActiveSubscription(userId);
    const expiresAt = subscription?.plan?.durationMonths 
      ? addMonths(new Date(), subscription.plan.durationMonths)
      : null;

    // 7. Persistência Final: Transação de atualização
    await contractRepository.updateInstance(instanceId, {
      status: "signed",
      signedAt: new Date(),
      expiresAt: expiresAt,
      subscriptionId: instance.subscriptionId || subscription?.id,
      signedContent: finalContent,
      integrityHash: integrityHash,
      pdfUrl: pdfPath,
      guardianData: encryptedGuardianData as unknown as Record<string, unknown>,
    });

    // 7.1 Auditoria: Registro forense (IP/UA)
    if (auditMetadata) {
      await contractRepository.saveSignatureMetadata({
        instanceId,
        ipAddress: auditMetadata.ip,
        userAgent: auditMetadata.userAgent,
        browser: auditMetadata.browser,
        os: auditMetadata.os,
        location: auditMetadata.location,
        fingerprint: auditMetadata.fingerprint,
      });
    }

    // 8. Generate Signed URL for immediate download
    const [downloadUrl] = await bucket.file(pdfPath).getSignedUrl({
      action: "read",
      expires: Date.now() + 1000 * 60 * 60, // 1 hour
    });

    // 9. Notificação e Envio de E-mail
    // Fazemos o envio em background para não travar o retorno, mas aguardamos o e-mail principal
    try {
      await communicationService.sendContractSignedEmail(
        user.email, 
        user.name, 
        instance.template.name, 
        pdfBytes
      );
    } catch (error) {
      console.error("[ContractService.signContract] Email Error:", error);
      // Não travamos o processo se apenas o e-mail falhar, já que o contrato está assinado e salvo
    }

    return { 
      pdfPath,
      downloadUrl,
      success: true 
    };
  },

  /**
   * Solicita o cancelamento de um contrato.
   * Integra com o Billing para verificar taxas.
   */
  async requestCancellation(instanceId: string) {
    const instance = await contractRepository.findInstanceById(instanceId);
    if (!instance) throw new Error("Contrato não encontrado.");
    
    // Se não houver subscriptionId, cancela direto
    if (!instance.subscriptionId) {
      await this.finalizeCancellation(instanceId);
      return { success: true, feeRequired: false };
    }

    // Se for o último mês, a taxa é zero (Regra de Negócio tratada no Billing)
    const { billingService } = await import("../billing/billing.service");
    const result = await billingService.cancelSubscription(instance.subscriptionId);

    if (result.pixCode) {
      return { 
        success: true, 
        feeRequired: true, 
        pixCode: result.pixCode, 
        pixImage: result.pixImage 
      };
    }

    // Se o billingService cancelou direto (sem taxa), finalizamos aqui
    await this.finalizeCancellation(instanceId);
    return { success: true, feeRequired: false };
  },

  /**
   * Finaliza o cancelamento no banco de dados e envia notificação.
   */
  async finalizeCancellation(instanceId: string) {
    const instance = await contractRepository.findInstanceById(instanceId);
    if (!instance) throw new Error("Contrato não encontrado.");

    await contractRepository.updateInstance(instanceId, {
      status: "cancelled",
    });

    // 1. Cancel future classes
    await schedulingService.cancelFutureClassesForStudent(instance.userId);

    // 2. Deactivate user
    await userService.updateUser(instance.userId, { isActive: false });

    // 2.1 Update subscription status if exists
    if (instance.subscriptionId) {
      await billingService.updateSubscription(instance.subscriptionId, { status: "cancelled" });
    }

    // 3. Send notification
    if (instance?.user?.email) {
      await communicationService.sendContractCancelledEmail(
        instance.user.email, 
        instance.user.name, 
        instance.template.name
      );
    }
  },

  /**
   * Realiza a renovação de um contrato.
   * Se isAuto for true, realiza a auto-assinatura reaproveitando os dados do anterior.
   */
  async renewContract(instanceId: string, isAuto: boolean = false) {
    const oldInstance = await contractRepository.findInstanceById(instanceId);
    if (!oldInstance) throw new Error("Contrato original não encontrado.");

    // Busca versão mais recente do template do mesmo tipo/região
    const template = await contractRepository.findActiveTemplateByType(
      oldInstance.template.type, 
      oldInstance.template.region
    );
    if (!template) throw new Error("Nenhum template ativo encontrado para renovação.");

    // Cria nova instância
    // Se for auto, já nasce assinada com os dados do snapshot anterior
    const newInstance = await contractRepository.insertInstance({
      templateId: template.id,
      userId: oldInstance.userId,
      subscriptionId: oldInstance.subscriptionId,
      parentInstanceId: oldInstance.id,
      status: isAuto ? "signed" : "pending",
      autoRenew: oldInstance.autoRenew,
      signedAt: isAuto ? new Date() : null,
      signedContent: isAuto ? oldInstance.signedContent : null,
      integrityHash: isAuto ? oldInstance.integrityHash : null,
      guardianData: isAuto ? oldInstance.guardianData : null,
    });

    if (isAuto && oldInstance.user?.email) {
      await communicationService.sendContractRenewedEmail(
        oldInstance.user.email, 
        oldInstance.user.name, 
        template.name, 
        true
      );
    }

    return newInstance;
  },

  /**
   * Gera um buffer de PDF com selo de verificação digital.
   */
  async generatePDF(
    title: string, 
    content: string, 
    signeeName: string,
    verification?: { hash: string; url: string }
  ): Promise<Uint8Array> {
    const pdfDoc = await PDFDocument.create();
    const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
    
    let page = pdfDoc.addPage();
    const { width, height } = page.getSize();
    const margin = 50;

    // Cabeçalho
    page.drawText(title.toUpperCase(), {
      x: margin,
      y: height - 50,
      size: 18,
      font: boldFont,
    });

    page.drawText(`Contratante: ${signeeName}`, {
      x: margin,
      y: height - 70,
      size: 10,
      font,
    });

    page.drawText(`Assinado Digitalmente em: ${new Date().toLocaleString("pt-BR")} (UTC)`, {
      x: margin,
      y: height - 82,
      size: 10,
      font,
    });

    // Corpo do documento
    const lines = content.split("\n");
    let currentY = height - 120;
    const fontSize = 11;

    for (const line of lines) {
      if (currentY < margin + 60) { // Espaço para o selo no rodapé
        page = pdfDoc.addPage();
        currentY = height - margin;
      }
      
      if (line.trim()) {
        page.drawText(line.trim(), {
          x: margin,
          y: currentY,
          size: fontSize,
          font,
          maxWidth: width - (margin * 2),
        });
      }
      currentY -= 15;
    }

    // Selo de Verificação (Apenas na última página)
    if (verification) {
      const footerY = 60;
      page.drawRectangle({
        x: margin - 10,
        y: footerY - 10,
        width: width - (margin * 2) + 20,
        height: 50,
        borderWidth: 1,
        opacity: 0.1,
      });

      page.drawText("SELADO DIGITALMENTE — FLUENCY LAB", { x: margin, y: footerY + 25, size: 9, font: boldFont });
      page.drawText(`Integrity Hash: ${verification.hash.substring(0, 32)}...`, { x: margin, y: footerY + 12, size: 7, font });
      
      page.drawText("Verificar autenticidade em:", { x: width - 230, y: footerY + 25, size: 8, font });
      page.drawText(verification.url, { 
        x: width - 230, 
        y: footerY + 12, 
        size: 8, 
        font: boldFont,
      });
    }

    return await pdfDoc.save();
  },

  /**
   * Valida publicamente a integridade de um contrato pelo hash.
   */
  async verifyContract(hash: string) {
    const instance = await contractRepository.findInstanceByIntegrityHash(hash);
    if (!instance) return { isValid: false };

    return {
      isValid: true,
      contractName: instance.template.name,
      signedBy: instance.user?.name,
      signedAt: instance.signedAt,
      region: instance.template.region,
      audit: instance.signaturesMetadata.map((m: ContractSignatureMetadata) => ({
        timestamp: m.createdAt,
        ip: m.ipAddress,
      })),
    };
  },

  /**
   * Busca contratos do usuário logado.
   */
  async getMyContracts(userId: string) {
    return contractRepository.findUserInstances(userId);
  },

  async prepareOnboardingContract(userId: string, region: "BR" | "US" = "BR") {
    // 1. Check if already has a pending one
    const instance = await contractRepository.findPendingOnboardingInstance(userId);
    
    // Get active subscription to link (both share the same validity)
    const subscription = await billingService.getActiveSubscription(userId);

    if (instance) {
      // If we found a pending instance but it doesn't have a subscriptionId, link it now
      if (!instance.subscriptionId && subscription) {
        return contractRepository.updateInstance(instance.id, { subscriptionId: subscription.id });
      }
      return instance;
    }

    // 2. Get active template based on user role
    const user = await userService.getUser(userId);
    if (!user) throw new Error("Usuário não encontrado.");

    const contractType = user.role === "teacher" ? "teacher" : "student";
    const template = await contractRepository.findActiveTemplateByType(contractType, region);
    if (!template) throw new Error(`Template de contrato (${contractType}) não encontrado.`);

    // 3. Create instance with the subscription link
    return contractRepository.insertInstance({
      templateId: template.id,
      userId,
      subscriptionId: subscription?.id,
      status: "pending",
    });
  }
};
