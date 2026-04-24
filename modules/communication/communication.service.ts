import { resend } from "@/lib/resend";
import { env } from "@/env";
import { render } from "@react-email/render";
import React from "react";
import type { ReactElement } from "react";

//Templates
import { WelcomeEmail } from "./templates/WelcomeEmail";
import { ResendInviteEmail } from "./templates/ResendInviteEmail";
import { PaymentConfirmedEmail } from "./templates/PaymentConfirmedEmail";
import { NewInvoiceEmail } from "./templates/NewInvoiceEmail";
import { BillingReminderEmail } from "./templates/BillingReminderEmail";
import { BillingDueDateEmail } from "./templates/BillingDueDateEmail";
import { BillingOverdueEmail } from "./templates/BillingOverdueEmail";
import { ClassOverdueTeacherEmail } from "./templates/ClassOverdueTeacherEmail";
import {
  ContractSignedEmail,
} from "./templates/ContractSignedEmail";
import {
  ContractCancelledEmail,
  ContractExpiringEmail,
  ContractRenewedEmail,
} from "./templates/ContractStatusEmails";
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
  private readonly defaultFrom = "Fluency Lab <contato@matheusfernandes.me>";

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
  async sendWelcomeAndSetPasswordEmail(
    email: string,
    name: string,
    actionLink: string,
    studentInfo?: string,
  ) {
    try {
      const customActionLink = this.buildCustomLink(actionLink);
      const subject = studentInfo
        ? "Bem-vindo(a) à Fluency Lab! Defina sua senha para acessar a conta do estudante."
        : "Bem-vindo(a) à Fluency Lab! Defina sua senha.";

      await this.sendEmail({
        to: email,
        subject,
        template: React.createElement(WelcomeEmail, {
          name,
          actionLink: customActionLink,
          studentInfo,
        }),
      });
    } catch (error) {
      console.error("[CommunicationService.sendWelcome] Error:", error);
      throw new Error("Usuário criado, mas falha ao enviar o e-mail de boas-vindas.");
    }
  }

  async sendResendInviteEmail(email: string, name: string, actionLink: string) {
    try {
      const customActionLink = this.buildCustomLink(actionLink);
      await this.sendEmail({
        to: email,
        subject: "Novo link de acesso disponível! 🚀",
        template: React.createElement(ResendInviteEmail, {
          name,
          actionLink: customActionLink,
        }),
      });
      return { success: true };
    } catch (error) {
      console.error("[CommunicationService.sendResendInviteEmail] Error:", error);
      throw error;
    }
  }

  async sendClassScheduledEmail() { /* TODO */ }
  async sendClassRescheduledEmail() { /* TODO */ }
  async sendClassCanceledEmail() { /* TODO */ }

  async sendPaymentConfirmedEmail(email: string, data: { studentName: string; amount: number }) {
    try {
      await this.sendEmail({
        to: email,
        subject: "\u2705 Pagamento confirmado! Boas aulas.",
        template: React.createElement(PaymentConfirmedEmail, data),
      });
    } catch (error) {
      console.error("[CommunicationService.sendPaymentConfirmedEmail] Error:", error);
    }
  }

  async sendNewInvoiceEmail(email: string, data: { studentName: string; amount: number; dueDate: Date; checkoutUrl: string }) {
    try {
      await this.sendEmail({
        to: email,
        subject: "\uD83D\uDCC4 Sua fatura da Fluency Lab est\u00e1 dispon\u00edvel",
        template: React.createElement(NewInvoiceEmail, data),
      });
    } catch (error) {
      console.error("[CommunicationService.sendNewInvoiceEmail] Error:", error);
    }
  }

  async sendBillingReminderEmail(email: string, data: { studentName: string; amount: number; dueDate: Date; checkoutUrl: string }) {
    try {
      await this.sendEmail({
        to: email,
        subject: "\u23F3 Lembrete: Sua fatura vence em 2 dias",
        template: React.createElement(BillingReminderEmail, data),
      });
    } catch (error) {
      console.error("[CommunicationService.sendBillingReminderEmail] Error:", error);
    }
  }

  async sendBillingDueDateEmail(email: string, data: { studentName: string; amount: number; checkoutUrl: string }) {
    try {
      await this.sendEmail({
        to: email,
        subject: "\u23F0 Aten\u00e7\u00e3o: Sua fatura vence hoje",
        template: React.createElement(BillingDueDateEmail, data),
      });
    } catch (error) {
      console.error("[CommunicationService.sendBillingDueDateEmail] Error:", error);
    }
  }

  async sendBillingOverdueEmail(email: string, data: { studentName: string; amount: number; checkoutUrl: string }) {
    try {
      await this.sendEmail({
        to: email,
        subject: "\u26A0\uFE0F Sua fatura est\u00e1 em atraso",
        template: React.createElement(BillingOverdueEmail, data),
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

  // --- WHATSAPP METHODS ---

  /**
   * Envia um lembrete de pagamento via WhatsApp.
   */
  async sendPaymentReminderWhatsApp(data: {
    cellphone: string;
    studentName: string;
    amount: number;
    dueDate: Date;
    pixPayload: string;
  }) {
    try {
      const amountStr = new Intl.NumberFormat("pt-BR", {
        style: "currency",
        currency: "BRL"
      }).format(data.amount / 100);

      const dateStr = data.dueDate.toLocaleDateString("pt-BR");

      return await this.sendWhatsAppTemplate({
        to: data.cellphone,
        templateName: "payment_reminder",
        components: [
          {
            type: "body",
            parameters: [
              { type: "text", parameter_name: "student_name", text: data.studentName },
              { type: "text", parameter_name: "amount", text: amountStr },
              { type: "text", parameter_name: "due_date", text: dateStr },
              { type: "text", parameter_name: "pix_payload", text: data.pixPayload },
            ]
          },
          {
            type: "button",
            sub_type: "copy_code",
            index: "0",
            parameters: [
              { type: "text", text: data.pixPayload }
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
  async sendPaymentOverdueWhatsApp(data: {
    cellphone: string;
    studentName: string;
    amount: number;
  }) {
    try {
      const amountStr = new Intl.NumberFormat("pt-BR", {
        style: "currency",
        currency: "BRL"
      }).format(data.amount / 100);

      return await this.sendWhatsAppTemplate({
        to: data.cellphone,
        templateName: "payment_overdue",
        components: [
          {
            type: "body",
            parameters: [
              { type: "text", parameter_name: "student_name", text: data.studentName },
              { type: "text", parameter_name: "amount", text: amountStr },
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
   * Template: "Hi {{texto}}, Your new account has been created successfully. Please verify {{texto}}..."
   */
  async sendWelcomeWhatsApp(data: {
    cellphone: string;
    name: string;
    actionLink: string;
  }) {
    try {
      // Extrai o código de ação do link do Firebase
      const u = new URL(data.actionLink);
      const oobCode = u.searchParams.get("oobCode");

      // O link final que o botão do WhatsApp vai abrir
      // Nota: No dashboard da Meta, o botão deve estar configurado como URL dinâmica.
      // Ex: https://seu-app.com/create-password?oobCode={{1}}
      const dynamicUrlSuffix = `?oobCode=${oobCode}`;

      return await this.sendWhatsAppTemplate({
        to: data.cellphone,
        templateName: "finalize_account_setup", // Nome do modelo pronto da Meta
        components: [
          {
            type: "body",
            parameters: [
              { type: "text", parameter_name: "name", text: data.name },
              { type: "text", parameter_name: "detail", text: "your account" },
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
    const formattedPhone = to.replace(/\D/g, "");

    return this.sendWhatsAppRequest({
      messaging_product: "whatsapp",
      to: formattedPhone,
      type: "template",
      template: {
        name: templateName,
        language: { code: languageCode },
        components: components
      }
    });
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
}

export const communicationService = new CommunicationService();
