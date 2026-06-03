import { resend } from "@/lib/resend";
import { env } from "@/env";
import { communicationRepository } from "./communication.repository";
import { decrypt } from "@/lib/cryptography";


import { render } from "@react-email/render";
import React from "react";
import type { ReactElement } from "react";

//Templates
import { WelcomeEmail } from "./templates/WelcomeEmail";
import { ResendInviteEmail } from "./templates/ResendInviteEmail";
import { emailTranslations } from "./templates/translations";
import { PaymentConfirmedEmail } from "./templates/PaymentConfirmedEmail";
import { NewInvoiceEmail } from "./templates/NewInvoiceEmail";
import { BillingReminderEmail } from "./templates/BillingReminderEmail";
import { BillingDueDateEmail } from "./templates/BillingDueDateEmail";
import { BillingOverdueEmail } from "./templates/BillingOverdueEmail";
import { ClassOverdueTeacherEmail } from "./templates/ClassOverdueTeacherEmail";
import { ClassCancelledWithConvertEmail } from "./templates/ClassCancelledWithConvertEmail";
import {
  ContractSignedEmail,
} from "./templates/ContractSignedEmail";
import {
  ContractCancelledEmail,
  ContractExpiringEmail,
  ContractRenewedEmail,
  PlanPriceAdjustmentEmail,
  PlanChangedEmail,
} from "./templates/ContractStatusEmails";
import { ScheduleAlertEmail } from "./templates/ScheduleAlertEmail";
import { CertificateEmail } from "./templates/CertificateEmail";
import { FarewellEmail } from "./templates/FarewellEmail";
import { PasswordResetRequestEmail } from "./templates/PasswordResetRequestEmail";
import { PasswordResetConfirmationEmail } from "./templates/PasswordResetConfirmationEmail";
import type {
  SendWhatsAppTemplateOptions,
  WhatsAppResponse,
  WhatsAppRequestBody,
  WhatsAppTemplate,
  WhatsAppTemplateListResponse
} from "./communication.types";

interface SendEmailOptions {
  to: string | string[];
  subject: string;
  template: ReactElement;
  from?: string;
  attachments?: {
    filename: string;
    content: Buffer | string | Uint8Array;
  }[];
}

export class CommunicationService {
  private readonly defaultFrom = "Fluency Lab <contato@fluencylab.me>";

  /**
   * Recebe o template pronto, renderiza e envia via Resend.
   */
  async sendEmail({ to, subject, template, from, attachments }: SendEmailOptions) {
    try {
      const html = await render(template);

      return await resend.emails.send({
        from: from || this.defaultFrom,
        to,
        subject,
        html,
        attachments: attachments?.map(a => ({
          filename: a.filename,
          content: a.content instanceof Uint8Array ? Buffer.from(a.content) : a.content,
        })),
      });
    } catch (error) {
      console.error("[CommunicationService.sendEmail] Error:", error);
      throw new Error("Falha ao enviar o e-mail.");
    }
  }

  /**
   * MÉTODOS DE NEGÓCIO
   * Dados específicos e chamar o sendEmail.
   */
  private async getRecipientLocale(emailOrPhone: string): Promise<"pt" | "en"> {
    try {
      const user = emailOrPhone.includes("@")
        ? await communicationRepository.findUserByEmail(emailOrPhone)
        : await communicationRepository.findUserByPhone(emailOrPhone);
      return (user?.locale || "pt") as "pt" | "en";
    } catch (error) {
      console.error("[CommunicationService.getRecipientLocale] Error:", error);
      return "pt";
    }
  }

  async sendWelcomeAndSetPasswordEmail(
    email: string,
    name: string,
    actionLink: string,
    studentInfo?: string,
    explicitLocale?: "pt" | "en",
  ) {
    try {
      const locale = explicitLocale || await this.getRecipientLocale(email);
      const customActionLink = this.buildCustomLink(actionLink);
      const t = emailTranslations.welcome[locale];
      const subject = studentInfo
        ? (locale === "pt"
            ? "Bem-vindo(a) à Fluency Lab! Defina sua senha para acessar a conta do estudante."
            : "Welcome to Fluency Lab! Set your password to access the student account.")
        : t.subject;

      await this.sendEmail({
        to: email,
        subject,
        template: React.createElement(WelcomeEmail, {
          name,
          actionLink: customActionLink,
          studentInfo,
          locale,
        }),
      });
    } catch (error) {
      console.error("[CommunicationService.sendWelcome] Error:", error);
      throw new Error("Usuário criado, mas falha ao enviar o e-mail de boas-vindas.");
    }
  }

  async sendPasswordResetRequestEmail(
    email: string,
    name: string,
    actionLink: string,
    explicitLocale?: "pt" | "en"
  ) {
    try {
      const locale = explicitLocale || await this.getRecipientLocale(email);
      const customActionLink = this.buildResetPasswordLink(actionLink);
      const t = emailTranslations.passwordResetRequest[locale] || emailTranslations.passwordResetRequest.pt;

      await this.sendEmail({
        to: email,
        subject: t.subject,
        template: React.createElement(PasswordResetRequestEmail, {
          name,
          actionLink: customActionLink,
          locale,
        }),
      });
    } catch (error) {
      console.error("[CommunicationService.sendPasswordResetRequestEmail] Error:", error);
      throw new Error("Falha ao enviar o e-mail de recuperação de senha.");
    }
  }

  async sendPasswordResetConfirmationEmail(
    email: string,
    name: string,
    explicitLocale?: "pt" | "en"
  ) {
    try {
      const locale = explicitLocale || await this.getRecipientLocale(email);
      const t = emailTranslations.passwordResetConfirmation[locale] || emailTranslations.passwordResetConfirmation.pt;

      await this.sendEmail({
        to: email,
        subject: t.subject,
        template: React.createElement(PasswordResetConfirmationEmail, {
          name,
          locale,
        }),
      });
    } catch (error) {
      console.error("[CommunicationService.sendPasswordResetConfirmationEmail] Error:", error);
      throw new Error("Falha ao enviar o e-mail de confirmação de alteração de senha.");
    }
  }

  async sendResendInviteEmail(email: string, name: string, actionLink: string, explicitLocale?: "pt" | "en") {
    try {
      const locale = explicitLocale || await this.getRecipientLocale(email);
      const customActionLink = this.buildCustomLink(actionLink);
      const t = emailTranslations.resendInvite[locale];
      await this.sendEmail({
        to: email,
        subject: t.subject,
        template: React.createElement(ResendInviteEmail, {
          name,
          actionLink: customActionLink,
          locale,
        }),
      });
      return { success: true };
    } catch (error) {
      console.error("[CommunicationService.sendResendInviteEmail] Error:", error);
      throw error;
    }
  }

  async sendPaymentConfirmedEmail(
    email: string,
    data: { studentName: string; amount: number },
    explicitLocale?: "pt" | "en"
  ) {
    try {
      const locale = explicitLocale || await this.getRecipientLocale(email);
      const t = emailTranslations.paymentConfirmed[locale];
      await this.sendEmail({
        to: email,
        subject: t.subject,
        template: React.createElement(PaymentConfirmedEmail, { ...data, locale }),
      });
    } catch (error) {
      console.error("[CommunicationService.sendPaymentConfirmedEmail] Error:", error);
    }
  }

  async sendNewInvoiceEmail(
    email: string,
    data: {
      studentName: string;
      amount: number;
      dueDate: Date;
      pixPayload: string;
      pixImage: string;
      description?: string;
    },
    explicitLocale?: "pt" | "en"
  ) {
    try {
      const locale = explicitLocale || await this.getRecipientLocale(email);
      const t = emailTranslations.newInvoice[locale];
      await this.sendEmail({
        to: email,
        subject: t.subject,
        template: React.createElement(NewInvoiceEmail, { ...data, locale }),
      });
    } catch (error) {
      console.error("[CommunicationService.sendNewInvoiceEmail] Error:", error);
    }
  }

  async sendBillingReminderEmail(
    email: string,
    data: { studentName: string; amount: number; dueDate: Date; checkoutUrl: string },
    explicitLocale?: "pt" | "en"
  ) {
    try {
      const locale = explicitLocale || await this.getRecipientLocale(email);
      const t = emailTranslations.billingReminder[locale];
      await this.sendEmail({
        to: email,
        subject: t.subject,
        template: React.createElement(BillingReminderEmail, { ...data, locale }),
      });
    } catch (error) {
      console.error("[CommunicationService.sendBillingReminderEmail] Error:", error);
    }
  }

  async sendBillingDueDateEmail(
    email: string,
    data: { studentName: string; amount: number; checkoutUrl: string },
    explicitLocale?: "pt" | "en"
  ) {
    try {
      const locale = explicitLocale || await this.getRecipientLocale(email);
      const t = emailTranslations.billingDueDate[locale];
      await this.sendEmail({
        to: email,
        subject: t.subject,
        template: React.createElement(BillingDueDateEmail, { ...data, locale }),
      });
    } catch (error) {
      console.error("[CommunicationService.sendBillingDueDateEmail] Error:", error);
    }
  }

  async sendBillingOverdueEmail(
    email: string,
    data: { studentName: string; amount: number; checkoutUrl: string },
    explicitLocale?: "pt" | "en"
  ) {
    try {
      const locale = explicitLocale || await this.getRecipientLocale(email);
      const t = emailTranslations.billingOverdue[locale];
      await this.sendEmail({
        to: email,
        subject: t.subject,
        template: React.createElement(BillingOverdueEmail, { ...data, locale }),
      });
    } catch (error) {
      console.error("[CommunicationService.sendBillingOverdueEmail] Error:", error);
    }
  }

  async sendClassOverdueTeacherEmail(email: string, data: { teacherName: string; classDate: string }) {
    try {
      await this.sendEmail({
        to: email,
        subject: "\u26A0\uFE0F Aten\u00e7\u00e3o: Aula n\u00e3o atualizada no sistema",
        template: React.createElement(ClassOverdueTeacherEmail, data),
      });
    } catch (error) {
      console.error("[CommunicationService.sendClassOverdueTeacherEmail] Error:", error);
    }
  }

  async sendClassCancelledWithConvertEmail(
    email: string,
    data: {
      teacherName: string;
      studentName: string;
      classDate: string;
      classTime: string;
      convertUrl: string;
    }
  ) {
    try {
      await this.sendEmail({
        to: email,
        subject: `\u26A0\uFE0F Aula cancelada: ${data.studentName} - Veja como converter`,
        template: React.createElement(ClassCancelledWithConvertEmail, data),
      });
    } catch (error) {
      console.error("[CommunicationService.sendClassCancelledWithConvertEmail] Error:", error);
    }
  }

  async sendScheduleAlertEmail(email: string, name: string, message: string) {
    try {
      await this.sendEmail({
        to: email,
        subject: "\uD83D\uDCE2 Alerta de Agenda - Fluency Lab",
        template: React.createElement(ScheduleAlertEmail, { teacherName: name, message }),
      });
    } catch (error) {
      console.error("[CommunicationService.sendScheduleAlertEmail] Error:", error);
    }
  }

  // --- CONTRACT EMAILS ---

  async sendContractSignedEmail(email: string, name: string, contractName: string, pdfBytes: Uint8Array) {
    try {
      await this.sendEmail({
        to: email,
        subject: "🖋️ Contrato Assinado - Fluency Lab",
        template: React.createElement(ContractSignedEmail, { name, contractName }),
        attachments: [{
          filename: `${contractName.replace(/\s+/g, "_")}_assinado.pdf`,
          content: pdfBytes,
        }],
      });
    } catch (error) {
      console.error("[CommunicationService.sendContractSignedEmail] Error:", error);
    }
  }

  async sendContractCancelledEmail(email: string, name: string, contractName: string) {
    try {
      await this.sendEmail({
        to: email,
        subject: "🛡️ Contrato Cancelado - Fluency Lab",
        template: React.createElement(ContractCancelledEmail, { name, contractName }),
      });
    } catch (error) {
      console.error("[CommunicationService.sendContractCancelledEmail] Error:", error);
    }
  }

  async sendContractExpiringEmail(email: string, name: string, contractName: string, daysLeft: number) {
    try {
      await this.sendEmail({
        to: email,
        subject: "⏳ Seu contrato vence em breve",
        template: React.createElement(ContractExpiringEmail, { name, contractName, daysLeft }),
      });
    } catch (error) {
      console.error("[CommunicationService.sendContractExpiringEmail] Error:", error);
    }
  }

  async sendContractRenewedEmail(email: string, name: string, contractName: string, isAuto: boolean) {
    try {
      await this.sendEmail({
        to: email,
        subject: "🚀 Contrato Renovado - Fluency Lab",
        template: React.createElement(ContractRenewedEmail, { name, contractName, isAuto }),
      });
    } catch (error) {
      console.error("[CommunicationService.sendContractRenewedEmail] Error:", error);
    }
  }

  async sendPlanPriceAdjustmentEmail(email: string, name: string, planName: string, newAmount: number) {
    try {
      await this.sendEmail({
        to: email,
        subject: "🖋️ Aviso de Reajuste de Mensalidade - Fluency Lab",
        template: React.createElement(PlanPriceAdjustmentEmail, { name, planName, newAmount }),
      });
    } catch (error) {
      console.error("[CommunicationService.sendPlanPriceAdjustmentEmail] Error:", error);
    }
  }

  async sendPlanChangedEmail(
    email: string,
    name: string,
    data: { oldPlanName: string; newPlanName: string; newAmount: number; classesPerWeek: number }
  ) {
    try {
      await this.sendEmail({
        to: email,
        subject: "🚀 Seu Plano de Estudos foi Atualizado! - Fluency Lab",
        template: React.createElement(PlanChangedEmail, { name, ...data }),
      });
    } catch (error) {
      console.error("[CommunicationService.sendPlanChangedEmail] Error:", error);
    }
  }

  async sendCertificateEmail(email: string, name: string, courseLanguage: string, verifyUrl: string, pdfBase64: string) {
    try {
      // Remove data:application/pdf;base64, if present
      const base64Data = pdfBase64.split(",")[1] || pdfBase64;
      const pdfBuffer = Buffer.from(base64Data, "base64");

      await this.sendEmail({
        to: email,
        subject: `🎓 Seu certificado de ${courseLanguage} chegou!`,
        template: React.createElement(CertificateEmail, { name, courseLanguage, verifyUrl }),
        attachments: [{
          filename: `certificado-${courseLanguage.toLowerCase()}.pdf`,
          content: pdfBuffer,
        }],
      });
    } catch (error) {
      console.error("[CommunicationService.sendCertificateEmail] Error:", error);
    }
  }

  async sendFarewellEmail(email: string, name: string, explicitLocale?: "pt" | "en") {
    try {
      const locale = explicitLocale || await this.getRecipientLocale(email);
      const t = emailTranslations.farewell[locale];
      await this.sendEmail({
        to: email,
        subject: t.subject,
        template: React.createElement(FarewellEmail, { name, locale }),
      });
    } catch (error) {
      console.error("[CommunicationService.sendFarewellEmail] Error:", error);
    }
  }

  // --- WHATSAPP METHODS ---

  /**
   * Envia um lembrete de pagamento via WhatsApp.
   */
  async sendPaymentReminderWhatsApp(
    data: {
      cellphone: string;
      studentName: string;
      amount: number;
      dueDate: Date;
      pixPayload: string;
    },
    explicitLocale?: "pt" | "en"
  ) {
    try {
      const locale = explicitLocale || await this.getRecipientLocale(data.cellphone);
      const languageCode = locale === "en" ? "en_US" : "pt_BR";

      const amountStr = new Intl.NumberFormat(locale === "pt" ? "pt-BR" : "en-US", {
        style: "currency",
        currency: locale === "pt" ? "BRL" : "USD"
      }).format(data.amount / 100);

      const dateStr = locale === "pt"
        ? data.dueDate.toLocaleDateString("pt-BR")
        : data.dueDate.toLocaleDateString("en-US");

      return await this.sendWhatsAppTemplate({
        to: data.cellphone,
        templateName: "payment_reminder_v4",
        languageCode,
        components: [
          {
            type: "body",
            parameters: [
              { type: "text", text: data.studentName },
              { type: "text", text: amountStr },
              { type: "text", text: dateStr }
            ]
          },
          {
            type: "button",
            sub_type: "order_details",
            index: "0",
            parameters: [
              {
                type: "action",
                action: {
                  order_details: {
                    reference_id: `rem_${Date.now()}`,
                    order: {
                      version: 1,
                      currency: "BRL",
                      total_amount: {
                        offset: 100,
                        value: data.amount
                      },
                      payment_settings: [
                        {
                          type: "pix_dynamic_code",
                          pix_dynamic_code: {
                            code: data.pixPayload,
                            merchant_name: "Fluency Lab",
                            key: "contato@fluencylab.me",
                            key_type: "EMAIL"
                          }
                        }
                      ]
                    }
                  }
                }
              }
            ]
          }
        ]
      });
    } catch (error) {
      console.error("[CommunicationService.sendPaymentReminderWhatsApp] Error:", error);
    }
  }

  /**
   * Envia um alerta de fatura em atraso via WhatsApp.
   */
  async sendPaymentOverdueWhatsApp(
    data: {
      cellphone: string;
      studentName: string;
      amount: number;
      pixPayload: string;
    },
    explicitLocale?: "pt" | "en"
  ) {
    try {
      const locale = explicitLocale || await this.getRecipientLocale(data.cellphone);
      const languageCode = locale === "en" ? "en_US" : "pt_BR";

      const amountStr = new Intl.NumberFormat(locale === "pt" ? "pt-BR" : "en-US", {
        style: "currency",
        currency: locale === "pt" ? "BRL" : "USD"
      }).format(data.amount / 100);

      return await this.sendWhatsAppTemplate({
        to: data.cellphone,
        templateName: "payment_overdue_v4",
        languageCode,
        components: [
          {
            type: "body",
            parameters: [
              { type: "text", text: data.studentName },
              { type: "text", text: amountStr }
            ]
          },
          {
            type: "button",
            sub_type: "order_details",
            index: "0",
            parameters: [
              {
                type: "action",
                action: {
                  order_details: {
                    reference_id: `over_${Date.now()}`,
                    order: {
                      version: 1,
                      currency: "BRL",
                      total_amount: {
                        offset: 100,
                        value: data.amount
                      },
                      payment_settings: [
                        {
                          type: "pix_dynamic_code",
                          pix_dynamic_code: {
                            code: data.pixPayload,
                            merchant_name: "Fluency Lab",
                            key: "contato@fluencylab.me",
                            key_type: "EMAIL"
                          }
                        }
                      ]
                    }
                  }
                }
              }
            ]
          }
        ]
      });
    } catch (error) {
      console.error("[CommunicationService.sendPaymentOverdueWhatsApp] Error:", error);
    }
  }

  /**
   * Envia mensagem de boas-vindas e definição de senha via WhatsApp.
   */
  async sendWelcomeWhatsApp(
    data: {
      cellphone: string;
      name: string;
      actionLink: string;
    },
    explicitLocale?: "pt" | "en"
  ) {
    try {
      const locale = explicitLocale || await this.getRecipientLocale(data.cellphone);
      const languageCode = locale === "en" ? "en_US" : "pt_BR";

      // Extrai o código de ação do link do Firebase
      const u = new URL(data.actionLink);
      const oobCode = u.searchParams.get("oobCode");

      // O link final que o botão do WhatsApp vai abrir
      // Nota: No dashboard da Meta, o botão deve estar configurado como URL dinâmica.
      // Ex: https://fluency-lab-plataform.vercel.app/{{1}}
      const dynamicUrlSuffix = `create-password?oobCode=${oobCode}`;

      return await this.sendWhatsAppTemplate({
        to: data.cellphone,
        templateName: "welcome_first", // Nome do modelo pronto da Meta
        languageCode,
        components: [
          {
            type: "body",
            parameters: [
              { type: "text", parameter_name: "name", text: data.name },
            ]
          },
          {
            type: "button",
            sub_type: "url",
            index: "0",
            parameters: [
              { type: "text", text: dynamicUrlSuffix }
            ]
          }
        ]
      });
    } catch (error) {
      console.error("[CommunicationService.sendWelcomeWhatsApp] Error:", error);
    }
  }

  /**
   * Método base para envio de templates do WhatsApp.
   */
  async sendWhatsAppTemplate(options: SendWhatsAppTemplateOptions): Promise<WhatsAppResponse | null> {
    const { to, templateName, components, languageCode = "pt_BR" } = options;

    // Formata o número (garantindo que tenha o código do país e sem caracteres especiais)
    const formattedPhone = this.getCleanPhone(to);


    const response = await this.sendWhatsAppRequest({
      messaging_product: "whatsapp",
      to: formattedPhone,
      type: "template",
      template: {
        name: templateName,
        language: { code: languageCode },
        components: components
      }
    });

    if (response?.messages?.[0]?.id) {
      // Persistir no banco
      let conversation = await communicationRepository.findConversationByWaId(formattedPhone);
      if (!conversation) {
        const user = await communicationRepository.findUserByPhone(formattedPhone);
        conversation = await communicationRepository.createConversation({
          waId: formattedPhone,
          studentId: user?.id,
          lastMessageContent: `[Template: ${templateName}]`,
          lastMessageAt: new Date(),
        });
      } else {
        await communicationRepository.updateConversation(conversation.id, {
          lastMessageContent: `[Template: ${templateName}]`,
          lastMessageAt: new Date(),
        });
      }

      await communicationRepository.saveMessage({
        id: response.messages[0].id,
        conversationId: conversation.id,
        content: `[Template: ${templateName}]`,
        type: "template",
        direction: "outbound",
        status: "sent",
      });
    }

    return response;
  }

  /**
   * Envia uma mensagem de texto livre (janela de 24h).
   */
  async sendWhatsAppTextMessage(to: string, text: string): Promise<WhatsAppResponse | null> {
    const formattedPhone = this.getCleanPhone(to);

    const response = await this.sendWhatsAppRequest({
      messaging_product: "whatsapp",
      to: formattedPhone,
      type: "text",
      text: { body: text }
    });

    if (response?.messages?.[0]?.id) {
      let conversation = await communicationRepository.findConversationByWaId(formattedPhone);
      if (!conversation) {
        const user = await communicationRepository.findUserByPhone(formattedPhone);
        conversation = await communicationRepository.createConversation({
          waId: formattedPhone,
          studentId: user?.id,
          lastMessageContent: text,
          lastMessageAt: new Date(),
        });
      } else {
        await communicationRepository.updateConversation(conversation.id, {
          lastMessageContent: text,
          lastMessageAt: new Date(),
        });
      }

      await communicationRepository.saveMessage({
        id: response.messages[0].id,
        conversationId: conversation.id,
        content: text,
        type: "text",
        direction: "outbound",
        status: "sent",
      });
    }

    return response;
  }

  async getConversations() {
    return communicationRepository.getConversations();
  }

  async getMessages(conversationId: string) {
    return communicationRepository.getMessages(conversationId);
  }

  async markAsRead(conversationId: string) {
    return communicationRepository.markAsRead(conversationId);
  }

  async updateContactName(conversationId: string, name: string) {
    return communicationRepository.updateConversation(conversationId, { contactName: name });
  }

  async updateLabels(conversationId: string, labels: unknown[]) {
    return communicationRepository.updateConversation(conversationId, { labels });
  }

  /**
   * Busca templates na Graph API da Meta.
   */
  async getWhatsAppTemplates(): Promise<WhatsAppTemplate[]> {
    if (!env.WHATSAPP_BUSINESS_ACCOUNT_ID) return [];

    try {
      const response = await fetch(
        `https://graph.facebook.com/v20.0/${env.WHATSAPP_BUSINESS_ACCOUNT_ID}/message_templates`,
        {
          headers: {
            "Authorization": `Bearer ${env.WHATSAPP_ACCESS_TOKEN}`,
          },
        }
      );

      const data = await response.json() as WhatsAppTemplateListResponse;
      return data.data || [];
    } catch (error) {
      console.error("[CommunicationService.getWhatsAppTemplates] Error:", error);
      return [];
    }
  }

  /**
   * Cria um novo template na Meta.
   */
  async createWhatsAppTemplate(data: Omit<WhatsAppTemplate, "id" | "status">) {
    if (!env.WHATSAPP_BUSINESS_ACCOUNT_ID) throw new Error("WABA_ID not configured");

    try {
      const response = await fetch(
        `https://graph.facebook.com/v20.0/${env.WHATSAPP_BUSINESS_ACCOUNT_ID}/message_templates`,
        {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${env.WHATSAPP_ACCESS_TOKEN}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify(data),
        }
      );

      const result = await response.json();
      if (!response.ok) throw new Error(result.error?.message || "Failed to create template");

      return result;
    } catch (error) {
      console.error("[CommunicationService.createWhatsAppTemplate] Error:", error);
      throw error;
    }
  }

  /**
   * Remove um template na Meta.
   */
  async deleteWhatsAppTemplate(name: string) {
    if (!env.WHATSAPP_BUSINESS_ACCOUNT_ID) throw new Error("WABA_ID not configured");

    try {
      const response = await fetch(
        `https://graph.facebook.com/v20.0/${env.WHATSAPP_BUSINESS_ACCOUNT_ID}/message_templates?name=${name}`,
        {
          method: "DELETE",
          headers: {
            "Authorization": `Bearer ${env.WHATSAPP_ACCESS_TOKEN}`,
          },
        }
      );

      const result = await response.json();
      if (!response.ok) throw new Error(result.error?.message || "Failed to delete template");

      return result;
    } catch (error) {
      console.error("[CommunicationService.deleteWhatsAppTemplate] Error:", error);
      throw error;
    }
  }

  /**
   * Utilitário Privado para chamadas à Graph API da Meta.
   */
  private async sendWhatsAppRequest(body: WhatsAppRequestBody): Promise<WhatsAppResponse | null> {
    try {
      const response = await fetch(
        `https://graph.facebook.com/v20.0/${env.WHATSAPP_PHONE_NUMBER_ID}/messages`,
        {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${env.WHATSAPP_ACCESS_TOKEN}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify(body),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        console.error("[CommunicationService.sendWhatsAppRequest] API Error:", data);
        return null;
      }

      return data as WhatsAppResponse;
    } catch (error) {
      console.error("[CommunicationService.sendWhatsAppRequest] Network Error:", error);
      return null;
    }
  }

  /**
   * Utilitários Privados
   */
  private buildCustomLink(link: string): string {
    try {
      const u = new URL(link);
      const oobCode = u.searchParams.get("oobCode");
      const base = env.NEXT_PUBLIC_APP_URL;
      if (!oobCode) return link;
      const baseUrl = base.endsWith("/") ? base.slice(0, -1) : base;

      return `${baseUrl}/create-password?oobCode=${(oobCode)}`;
    } catch {
      return link;
    }
  }

  private buildResetPasswordLink(link: string): string {
    try {
      const u = new URL(link);
      const oobCode = u.searchParams.get("oobCode");
      const base = env.NEXT_PUBLIC_APP_URL;
      if (!oobCode) return link;
      const baseUrl = base.endsWith("/") ? base.slice(0, -1) : base;

      return `${baseUrl}/reset-password?oobCode=${oobCode}`;
    } catch {
      return link;
    }
  }


  private getCleanPhone(to: string): string {
    if (!to) return "";
    // 1. Descriptografa se necessário (formato crypto:iv:data)
    const decrypted = to.includes(":") ? decrypt(to) : to;
    // 2. Remove tudo que não for número
    let clean = decrypted.replace(/\D/g, "");
    
    // Se for um número de 10 ou 11 dígitos, assume que é do Brasil (sem o 55) e adiciona
    if (clean.length === 10 || clean.length === 11) {
      clean = `55${clean}`;
    }
    
    return clean;
  }

  /**
   * Busca os metadados de uma mídia e seu stream binário na Graph API da Meta.
   */
  async getWhatsAppMedia(mediaId: string): Promise<{ buffer: Buffer; mimeType: string } | null> {
    try {
      // 1. Buscar a URL temporária de download da mídia
      const response = await fetch(
        `https://graph.facebook.com/v20.0/${mediaId}`,
        {
          headers: {
            "Authorization": `Bearer ${env.WHATSAPP_ACCESS_TOKEN}`,
          },
        }
      );

      if (!response.ok) {
        console.error(`[CommunicationService.getWhatsAppMedia] Error fetching media metadata for ID ${mediaId}:`, await response.json());
        return null;
      }

      const metadata = await response.json() as { url: string; mime_type: string };
      if (!metadata.url) {
        console.error(`[CommunicationService.getWhatsAppMedia] No download URL returned for media ID ${mediaId}`);
        return null;
      }

      // 2. Baixar o arquivo binário usando a URL temporária com a autorização da Meta
      const mediaResponse = await fetch(metadata.url, {
        headers: {
          "Authorization": `Bearer ${env.WHATSAPP_ACCESS_TOKEN}`,
        },
      });

      if (!mediaResponse.ok) {
        console.error(`[CommunicationService.getWhatsAppMedia] Error downloading binary media from URL:`, mediaResponse.statusText);
        return null;
      }

      const arrayBuffer = await mediaResponse.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);

      return {
        buffer,
        mimeType: metadata.mime_type,
      };
    } catch (error) {
      console.error("[CommunicationService.getWhatsAppMedia] Error:", error);
      return null;
    }
  }
}


export const communicationService = new CommunicationService();
