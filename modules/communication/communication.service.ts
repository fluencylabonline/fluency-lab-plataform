import { resend } from "@/lib/resend";
import { env } from "@/env";
import { render } from "@react-email/render";
import React from "react";
import type { ReactElement } from "react";

//Templates
import { WelcomeEmail } from "./templates/WelcomeEmail";
import { ResendInviteEmail } from "./templates/ResendInviteEmail";

interface SendEmailOptions {
  to: string | string[];
  subject: string;
  template: ReactElement;
  from?: string;
}

export class CommunicationService {
  private readonly defaultFrom = "Fluency Lab <contato@matheusfernandes.me>";

  /**
   * Recebe o template pronto, renderiza e envia via Resend.
   */
  async sendEmail({ to, subject, template, from }: SendEmailOptions) {
    try {
      const html = await render(template);

      return await resend.emails.send({
        from: from || this.defaultFrom,
        to,
        subject,
        html,
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
