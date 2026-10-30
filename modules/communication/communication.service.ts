import "server-only";
import { resend } from "@/lib/resend";
import { env } from "@/env/server";
import { communicationRepository } from "./communication.repository";
import { decrypt } from "@/lib/cryptography";
import { whatsappConversationsTable } from "./communication.schema";
import { adminRtdb } from "@/lib/firebase-admin";
import { settingsService } from "@/modules/settings/settings.service";
import { db } from "@/lib/db";
import { eq } from "drizzle-orm";


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
import { TeacherRecessStudentEmail } from "./templates/TeacherRecessStudentEmail";
import { LessonPdfEmail } from "./templates/LessonPdfEmail";
import { CertificateEmail } from "./templates/CertificateEmail";
import { FarewellEmail } from "./templates/FarewellEmail";
import { PasswordResetRequestEmail } from "./templates/PasswordResetRequestEmail";
import { PasswordResetConfirmationEmail } from "./templates/PasswordResetConfirmationEmail";
import { NoticeEmail } from "./templates/NoticeEmail";
import { buildDelinquencyEmail, type DelinquencyEmail } from "./templates/delinquency-translations";
import { buildHolidayRecessEmail } from "./templates/holiday-recess-translations";
import {
  HOLIDAY_RECESS_CAMPAIGNS,
  HOLIDAY_RECESS_END,
  HOLIDAY_RECESS_START,
  holidayRecessDates,
  type HolidayRecessCampaign,
} from "@/lib/holiday-recess";
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

  /**
   * Comunicado das regras de inadimplência para todos os alunos e
   * professores ativos.
   * - dryRun: só conta os destinatários;
   * - test: envia as duas versões (aluno e professor) só para quem pediu;
   * - send: envia para todos, em lotes de 100 (Resend batch), para não
   *   esbarrar no limite de requisições por segundo.
   */
  async sendDelinquencyPolicyAnnouncement(params: {
    mode: "dryRun" | "test" | "send";
    startDate: string; // YYYY-MM-DD
    requester: { email: string; name: string; locale?: string | null };
  }) {
    const { userService } = await import("@/modules/user/user.service");
    const [students, teachers] = await Promise.all([
      userService.getUsersByRole("student"),
      userService.getUsersByRole("teacher"),
    ]);
    const activeStudents = students.filter((u) => u.isActive && u.email);
    const activeTeachers = teachers.filter((u) => u.isActive && u.email);
    const counts = { students: activeStudents.length, teachers: activeTeachers.length };

    if (params.mode === "dryRun") return { ...counts, sent: 0, failed: 0 };

    const [y, m, d] = params.startDate.split("-");
    const formatStart = (locale: "pt" | "en") => (locale === "en" ? `${m}/${d}/${y}` : `${d}/${m}/${y}`);
    const appUrl = env.NEXT_PUBLIC_APP_URL;
    const build = (
      person: { email: string; name: string; locale?: string | null },
      kind: "policyStudent" | "policyTeacher"
    ) => {
      const locale = person.locale === "en" ? "en" : "pt";
      const content = buildDelinquencyEmail({ kind, name: person.name, startDate: formatStart(locale), appUrl }, locale);
      return { to: person.email, subject: content.subject, template: React.createElement(NoticeEmail, content) };
    };

    const messages =
      params.mode === "test"
        ? [build(params.requester, "policyStudent"), build(params.requester, "policyTeacher")]
        : [
            ...activeStudents.map((u) => build(u, "policyStudent")),
            ...activeTeachers.map((u) => build(u, "policyTeacher")),
          ];

    let sent = 0;
    let failed = 0;
    for (let i = 0; i < messages.length; i += 100) {
      const chunk = messages.slice(i, i + 100);
      try {
        const payload = await Promise.all(
          chunk.map(async (msg) => ({
            from: this.defaultFrom,
            to: msg.to,
            subject: msg.subject,
            html: await render(msg.template),
          }))
        );
        const result = await resend.batch.send(payload);
        if (result.error) {
          console.error("[CommunicationService.sendDelinquencyPolicyAnnouncement] Batch error:", result.error);
          failed += chunk.length;
        } else {
          sent += chunk.length;
        }
      } catch (error) {
        console.error("[CommunicationService.sendDelinquencyPolicyAnnouncement] Batch failed:", error);
        failed += chunk.length;
      }
    }

    return { ...counts, sent, failed };
  }

  /**
   * Emails do recesso de fim de ano para todos os alunos e professores ativos.
   * - "start" (01/12 e 15/12): não há aulas ao vivo; alunos recebem o link das aulas gravadas;
   * - "return" (01/01 e 10/01): as aulas voltam; alunos recebem a próxima aula marcada.
   * Modos: dryRun (só conta), test (as duas versões só para quem pediu), send (todos).
   * Não controla duplicidade: quem chama (o cron) reserva a campanha antes.
   */
  async sendHolidayRecessCampaign(params: {
    campaign: HolidayRecessCampaign;
    mode: "dryRun" | "test" | "send";
    requester?: { email: string; name: string; locale?: string | null };
    now?: Date;
  }) {
    const now = params.now ?? new Date();
    const { kind } = HOLIDAY_RECESS_CAMPAIGNS[params.campaign];
    const { userService } = await import("@/modules/user/user.service");
    const [students, teachers] = await Promise.all([
      userService.getUsersByRole("student"),
      userService.getUsersByRole("teacher"),
    ]);
    const activeStudents = students.filter((u) => u.isActive && u.email);
    const activeTeachers = teachers.filter((u) => u.isActive && u.email);
    const counts = { students: activeStudents.length, teachers: activeTeachers.length };

    if (params.mode === "dryRun") return { ...counts, sent: 0, failed: 0 };
    if (params.mode === "test" && !params.requester) throw new Error("O modo test precisa de um destinatário.");

    // Datas do recesso no idioma de cada destinatário ("18 de dezembro" / "December 18").
    const { startYear } = holidayRecessDates(now);
    const at = (year: number, month: number, day: number) => new Date(Date.UTC(year, month - 1, day, 15));
    const dayMonth = (date: Date, locale: "pt" | "en") =>
      new Intl.DateTimeFormat(locale === "en" ? "en-US" : "pt-BR", { day: "numeric", month: "long", timeZone: "America/Sao_Paulo" }).format(date);
    const datesFor = (locale: "pt" | "en") => ({
      firstDayOff: dayMonth(at(startYear, HOLIDAY_RECESS_START.month, HOLIDAY_RECESS_START.day), locale),
      lastDayOff: dayMonth(at(startYear + 1, HOLIDAY_RECESS_END.month, HOLIDAY_RECESS_END.day), locale),
      returnDay: dayMonth(at(startYear + 1, HOLIDAY_RECESS_END.month, HOLIDAY_RECESS_END.day + 1), locale),
    });
    const classDateTime = (date: Date, locale: "pt" | "en") =>
      new Intl.DateTimeFormat(locale === "en" ? "en-US" : "pt-BR", {
        weekday: "long", day: "numeric", month: "long", hour: "2-digit", minute: "2-digit", timeZone: "America/Sao_Paulo",
      }).format(date);

    // Próxima aula de cada aluno (só na volta): uma consulta para todos, nos próximos 60 dias.
    const teacherNames = new Map(teachers.map((t) => [t.id, t.name]));
    let nextClasses = new Map<string, { startAt: Date; teacherId: string }>();
    if (kind === "return") {
      const { schedulingService } = await import("@/modules/scheduling/scheduling.service");
      const ids = params.mode === "test" ? [] : activeStudents.map((s) => s.id);
      nextClasses = await schedulingService.getFirstScheduledClassByStudent(ids, now, new Date(now.getTime() + 60 * 86_400_000));
    }

    const appUrl = env.NEXT_PUBLIC_APP_URL;
    const reminder = params.campaign === "dec-15";
    const build = (person: { id?: string; email: string; name: string; locale?: string | null }, role: "student" | "teacher") => {
      const locale = person.locale === "en" ? "en" : "pt";
      const dates = datesFor(locale);
      const next = person.id ? nextClasses.get(person.id) : undefined;
      const content =
        kind === "start"
          ? role === "student"
            ? buildHolidayRecessEmail({ kind: "studentStart", name: person.name, ...dates, reminder, classesUrl: `${appUrl}/hub/student/holiday-classes` }, locale)
            : buildHolidayRecessEmail({ kind: "teacherStart", name: person.name, ...dates, reminder }, locale)
          : role === "student"
            ? buildHolidayRecessEmail({
                kind: "studentReturn",
                name: person.name,
                returnDay: dates.returnDay,
                nextClass: next ? { dateTime: classDateTime(next.startAt, locale), teacherName: teacherNames.get(next.teacherId) ?? null } : null,
                scheduleUrl: `${appUrl}/hub/student/schedule`,
              }, locale)
            : buildHolidayRecessEmail({ kind: "teacherReturn", name: person.name, returnDay: dates.returnDay, scheduleUrl: `${appUrl}/hub/teacher/schedule` }, locale);
      return { to: person.email, subject: content.subject, template: React.createElement(NoticeEmail, content) };
    };

    let messages: ReturnType<typeof build>[];
    if (params.mode === "test") {
      const requester = params.requester!;
      messages = [build(requester, "student"), build(requester, "teacher")];
      if (kind === "return") {
        // Exemplo com próxima aula: 14h do dia da volta, para conferir o texto.
        const sampleId = "__holiday-test__";
        nextClasses.set(sampleId, {
          startAt: new Date(Date.UTC(startYear + 1, HOLIDAY_RECESS_END.month - 1, HOLIDAY_RECESS_END.day + 1, 17)),
          teacherId: sampleId,
        });
        teacherNames.set(sampleId, requester.locale === "en" ? "Sample Teacher" : "Professor(a) de exemplo");
        messages.unshift(build({ ...requester, id: sampleId }, "student"));
      }
    } else {
      messages = [...activeStudents.map((u) => build(u, "student")), ...activeTeachers.map((u) => build(u, "teacher"))];
    }

    let sent = 0;
    let failed = 0;
    for (let i = 0; i < messages.length; i += 100) {
      const chunk = messages.slice(i, i + 100);
      try {
        const payload = await Promise.all(
          chunk.map(async (msg) => ({ from: this.defaultFrom, to: msg.to, subject: msg.subject, html: await render(msg.template) }))
        );
        const result = await resend.batch.send(payload);
        if (result.error) {
          console.error("[CommunicationService.sendHolidayRecessCampaign] Batch error:", result.error);
          failed += chunk.length;
        } else {
          sent += chunk.length;
        }
      } catch (error) {
        console.error("[CommunicationService.sendHolidayRecessCampaign] Batch failed:", error);
        failed += chunk.length;
      }
    }

    return { ...counts, sent, failed };
  }

  /**
   * Emails da política de inadimplência (aviso final, bloqueio, aulas
   * canceladas, cancelamento automático e comunicado das regras).
   * Textos em `templates/delinquency-translations.ts`. Não lança: retorna
   * `false` em caso de falha, para o envio em massa poder contar os erros.
   */
  async sendDelinquencyEmail(email: string, data: DelinquencyEmail, explicitLocale?: "pt" | "en") {
    try {
      const locale = explicitLocale || await this.getRecipientLocale(email);
      const content = buildDelinquencyEmail(data, locale);
      await this.sendEmail({
        to: email,
        subject: content.subject,
        template: React.createElement(NoticeEmail, content),
      });
      return true;
    } catch (error) {
      console.error(`[CommunicationService.sendDelinquencyEmail:${data.kind}] Error:`, error);
      return false;
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

  async sendTeacherRecessStudentEmail(
    email: string,
    data: {
      studentName: string;
      teacherName: string;
      startDate: string;
      endDate: string;
      fallbackLessonTitle: string;
    }
  ) {
    try {
      await this.sendEmail({
        to: email,
        subject: `\uD83D\uDCE2 Aviso de recesso: ${data.teacherName}`,
        template: React.createElement(TeacherRecessStudentEmail, data),
      });
    } catch (error) {
      console.error("[CommunicationService.sendTeacherRecessStudentEmail] Error:", error);
    }
  }

  /** Lição em PDF pedida pelo próprio usuário — o erro sobe para a tela avisar. */
  async sendLessonPdfEmail(
    email: string,
    data: { name: string; lessonTitle: string; filename: string; pdfBytes: Uint8Array }
  ) {
    const result = await this.sendEmail({
      to: email,
      subject: `📄 Sua lição em PDF: ${data.lessonTitle}`,
      template: React.createElement(LessonPdfEmail, { name: data.name, lessonTitle: data.lessonTitle }),
      attachments: [{ filename: data.filename, content: data.pdfBytes }],
    });
    // O Resend devolve o erro no resultado em vez de lançar.
    if (result?.error) {
      console.error("[CommunicationService.sendLessonPdfEmail] Error:", result.error);
      throw new Error("Falha ao enviar o e-mail.");
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

  /** `changedContractUrl`: preenchido quando a renovação trocou a versão do contrato. */
  async sendContractRenewedEmail(
    email: string,
    name: string,
    contractName: string,
    isAuto: boolean,
    locale: "pt" | "en" = "pt",
    changedContractUrl: string | null = null
  ) {
    try {
      await this.sendEmail({
        to: email,
        subject: locale === "en" ? "🚀 Agreement Renewed - Fluency Lab" : "🚀 Contrato Renovado - Fluency Lab",
        template: React.createElement(ContractRenewedEmail, { name, contractName, isAuto, locale, changedContractUrl }),
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

      const isUrl = data.pixPayload.startsWith("http://") || data.pixPayload.startsWith("https://");

      if (isUrl) {
        const dynamicUrlSuffix = `api/pay?url=${encodeURIComponent(data.pixPayload)}`;

        return await this.sendWhatsAppTemplate({
          to: data.cellphone,
          templateName: "payment_reminder_v5",
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
              sub_type: "url",
              index: "0",
              parameters: [
                { type: "text", text: dynamicUrlSuffix }
              ]
            }
          ]
        });
      }

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
                    type: "digital-goods",
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

      const isUrl = data.pixPayload.startsWith("http://") || data.pixPayload.startsWith("https://");

      if (isUrl) {
        const dynamicUrlSuffix = `api/pay?url=${encodeURIComponent(data.pixPayload)}`;

        return await this.sendWhatsAppTemplate({
          to: data.cellphone,
          templateName: "payment_overdue_v5",
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
              sub_type: "url",
              index: "0",
              parameters: [
                { type: "text", text: dynamicUrlSuffix }
              ]
            }
          ]
        });
      }

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
                    type: "digital-goods",
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
            ]
          }
        ]
      });
    } catch (error) {
      console.error("[CommunicationService.sendPaymentOverdueWhatsApp] Error:", error);
    }
  }

  /**
   * Avisos da política de inadimplência ao aluno, com botão de pagamento.
   * Templates (criados por scripts/create-delinquency-templates.js):
   * - payment_final_warning_v1: último dia do mês, o acesso bloqueia amanhã;
   * - payment_cancel_warning_v1: último dia do mês de bloqueio, a matrícula é cancelada amanhã.
   * Corpo: {{1}} nome, {{2}} valor. Botão URL dinâmico sobre NEXT_PUBLIC_APP_URL:
   * link de checkout (Stripe) passa pelo `api/pay`; PIX abre a página de pagamento.
   */
  async sendDelinquencyStudentWhatsApp(
    templateName: "payment_final_warning_v1" | "payment_cancel_warning_v1",
    data: {
      cellphone: string;
      studentName: string;
      amount: number;
      currency: string;
      pixPayload: string | null;
    },
    explicitLocale?: "pt" | "en"
  ) {
    try {
      const locale = explicitLocale || await this.getRecipientLocale(data.cellphone);
      const amountStr = new Intl.NumberFormat(locale === "en" ? "en-US" : "pt-BR", {
        style: "currency",
        currency: data.currency,
      }).format(data.amount / 100);

      const isUrl = !!data.pixPayload && /^https?:\/\//.test(data.pixPayload);
      const buttonSuffix = isUrl
        ? `api/pay?url=${encodeURIComponent(data.pixPayload!)}`
        : "payment-required";

      return await this.sendWhatsAppTemplate({
        to: data.cellphone,
        templateName,
        languageCode: locale === "en" ? "en" : "pt_BR",
        components: [
          {
            type: "body",
            parameters: [
              { type: "text", text: data.studentName },
              { type: "text", text: amountStr },
            ],
          },
          {
            type: "button",
            sub_type: "url",
            index: "0",
            parameters: [{ type: "text", text: buttonSuffix }],
          },
        ],
      });
    } catch (error) {
      console.error(`[CommunicationService.sendDelinquencyStudentWhatsApp:${templateName}] Error:`, error);
    }
  }

  /** Aviso ao aluno de que a matrícula foi cancelada por falta de pagamento ({{1}} nome). */
  async sendAccountCancelledDelinquencyWhatsApp(cellphone: string, studentName: string, explicitLocale?: "pt" | "en") {
    try {
      const locale = explicitLocale || await this.getRecipientLocale(cellphone);
      return await this.sendWhatsAppTemplate({
        to: cellphone,
        templateName: "account_cancelled_delinquency_v1",
        languageCode: locale === "en" ? "en" : "pt_BR",
        components: [{ type: "body", parameters: [{ type: "text", text: studentName }] }],
      });
    } catch (error) {
      console.error("[CommunicationService.sendAccountCancelledDelinquencyWhatsApp] Error:", error);
    }
  }

  /**
   * Avisos ao professor sobre o aluno inadimplente.
   * - student_payment_block_teacher_v1: {{1}} professor, {{2}} aluno, {{3}} data do bloqueio;
   * - student_payment_unblock_teacher_v1: {{1}} professor, {{2}} aluno.
   */
  async sendTeacherDelinquencyWhatsApp(
    cellphone: string,
    explicitLocale: "pt" | "en",
    data:
      | { kind: "block"; teacherName: string; studentName: string; blockDate: string }
      | { kind: "unblock"; teacherName: string; studentName: string }
  ) {
    try {
      const texts = data.kind === "block"
        ? [data.teacherName, data.studentName, data.blockDate]
        : [data.teacherName, data.studentName];
      const parameters = texts.map((text) => ({ type: "text" as const, text }));
      return await this.sendWhatsAppTemplate({
        to: cellphone,
        templateName: data.kind === "block" ? "student_payment_block_teacher_v1" : "student_payment_unblock_teacher_v1",
        languageCode: explicitLocale === "en" ? "en" : "pt_BR",
        components: [{ type: "body", parameters }],
      });
    } catch (error) {
      console.error(`[CommunicationService.sendTeacherDelinquencyWhatsApp:${data.kind}] Error:`, error);
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
      const languageCode = locale === "en" ? "en" : "pt_BR";

      // Extrai o código de ação do link do Firebase
      const u = new URL(data.actionLink);
      const oobCode = u.searchParams.get("oobCode");

      // O link final que o botão do WhatsApp vai abrir
      // Nota: No dashboard da Meta, o botão deve estar configurado como URL dinâmica.
      // Ex: https://www.fluencylab.me/{{1}}
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
   * Envia confirmação de agendamento de aula para o aluno via WhatsApp.
   */
  async sendStudentClassScheduledWhatsApp(
    cellphone: string,
    explicitLocale: "pt" | "en",
    data: {
      classesStartDate: Date;
      teacherName: string;
      ruleDayName: string;
      ruleTime: string;
    }
  ) {
    try {
      const languageCode = explicitLocale === "en" ? "en" : "pt_BR";
      
      const dateStr = explicitLocale === "pt"
        ? data.classesStartDate.toLocaleDateString("pt-BR")
        : data.classesStartDate.toLocaleDateString("en-US");

      return await this.sendWhatsAppTemplate({
        to: cellphone,
        templateName: "class_scheduled_student_v1",
        languageCode,
        components: [
          {
            type: "body",
            parameters: [
              { type: "text", text: dateStr },
              { type: "text", text: data.teacherName },
              { type: "text", text: data.ruleDayName },
              { type: "text", text: data.ruleTime },
            ]
          }
        ]
      });
    } catch (error) {
      console.error("[CommunicationService.sendStudentClassScheduledWhatsApp] Error:", error);
    }
  }

  /**
   * Avisa o aluno via WhatsApp que o professor entrará em recesso.
   */
  async sendTeacherRecessStudentWhatsApp(
    cellphone: string,
    explicitLocale: "pt" | "en",
    data: {
      studentName: string;
      teacherName: string;
      startDate: Date;
      endDate: Date;
      fallbackLessonTitle: string;
    }
  ) {
    try {
      const languageCode = explicitLocale === "en" ? "en" : "pt_BR";
      const fmt = (d: Date) =>
        explicitLocale === "pt" ? d.toLocaleDateString("pt-BR") : d.toLocaleDateString("en-US");

      return await this.sendWhatsAppTemplate({
        to: cellphone,
        templateName: "teacher_recess_student_v1",
        languageCode,
        components: [
          {
            type: "body",
            parameters: [
              { type: "text", text: data.studentName },
              { type: "text", text: data.teacherName },
              { type: "text", text: fmt(data.startDate) },
              { type: "text", text: fmt(data.endDate) },
              { type: "text", text: data.fallbackLessonTitle },
            ]
          }
        ]
      });
    } catch (error) {
      console.error("[CommunicationService.sendTeacherRecessStudentWhatsApp] Error:", error);
    }
  }

  /**
   * Envia alerta de novo aluno alocado para o professor via WhatsApp.
   */
  async sendTeacherNewStudentWhatsApp(
    cellphone: string,
    explicitLocale: "pt" | "en",
    data: {
      studentName: string;
      guardianName: string;
      guardianPhone: string;
      studentPhone: string;
      firstClassDateTime: string;
      studentId: string;
    }
  ) {
    try {
      const languageCode = explicitLocale === "en" ? "en" : "pt_BR";

      return await this.sendWhatsAppTemplate({
        to: cellphone,
        templateName: "new_student_teacher_v1",
        languageCode,
        components: [
          {
            type: "body",
            parameters: [
              { type: "text", text: data.studentName },
              { type: "text", text: data.guardianName },
              { type: "text", text: data.guardianPhone },
              { type: "text", text: data.studentPhone },
              { type: "text", text: data.firstClassDateTime },
              { type: "text", text: data.studentId },
            ]
          }
        ]
      });
    } catch (error) {
      console.error("[CommunicationService.sendTeacherNewStudentWhatsApp] Error:", error);
    }
  }

  /**
   * Método base para envio de templates do WhatsApp.
   */
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

    // Tentar interpolar o conteúdo para salvar de forma amigável no banco
    let textToSave = `[Template: ${templateName}]`;
    try {
      const templates = await this.getWhatsAppTemplates();
      const template = templates.find(t => t.name === templateName && t.language === languageCode);
      if (template) {
        const bodyComp = template.components.find((c) => c.type === "BODY" || (c.type as string) === "body");
        if (bodyComp?.text) {
          let interpolated = bodyComp.text;
          const bodyParams = components?.find((c) => c.type === "body" || (c.type as string) === "BODY")?.parameters || [];
          bodyParams.forEach((param, idx: number) => {
            interpolated = interpolated.replace(new RegExp(`\\{\\{${idx + 1}\\}\\}`, 'g'), param.text || '');
          });
          textToSave = interpolated;
        }
      }
    } catch (err) {
      console.error("[sendWhatsAppTemplate] Error interpolating template text:", err);
    }

    let conversation = await communicationRepository.findConversationByWaId(formattedPhone);
    if (!conversation) {
      const user = await communicationRepository.findUserByPhone(formattedPhone);
      conversation = await communicationRepository.createConversation({
        waId: formattedPhone,
        studentId: user?.id,
        lastMessageContent: textToSave,
        lastMessageAt: new Date(),
      });
    } else {
      await communicationRepository.updateConversation(conversation.id, {
        lastMessageContent: textToSave,
        lastMessageAt: new Date(),
      });
    }

    const isSuccess = !!response?.messages?.[0]?.id;
    const msgId = isSuccess ? response!.messages[0].id : `failed_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const status = isSuccess ? "sent" : "failed";

    await communicationRepository.saveMessage({
      id: msgId,
      conversationId: conversation.id,
      content: textToSave,
      type: "template",
      direction: "outbound",
      status: status,
      metadata: { components, templateName, languageCode }, // Salva metadados
    });

    // RTDB Signal for real-time update
    try {
      await adminRtdb.ref(`whatsapp_sync_signal/messages/${conversation.id}`).set(Date.now());
      await adminRtdb.ref(`whatsapp_sync_signal/conversations`).set(Date.now());
    } catch (rtdbErr) {
      console.error("[sendWhatsAppTemplate] RTDB sync signal error:", rtdbErr);
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

    const isSuccess = !!response?.messages?.[0]?.id;
    const msgId = isSuccess ? response!.messages[0].id : `failed_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const status = isSuccess ? "sent" : "failed";

    await communicationRepository.saveMessage({
      id: msgId,
      conversationId: conversation.id,
      content: text,
      type: "text",
      direction: "outbound",
      status: status,
    });

    // RTDB Signal for real-time update
    try {
      await adminRtdb.ref(`whatsapp_sync_signal/messages/${conversation.id}`).set(Date.now());
      await adminRtdb.ref(`whatsapp_sync_signal/conversations`).set(Date.now());
    } catch (rtdbErr) {
      console.error("[sendWhatsAppTextMessage] RTDB sync signal error:", rtdbErr);
    }

    return response;
  }

  /**
   * Envia uma mensagem de mídia (imagem, áudio, vídeo, documento).
   */
  async sendWhatsAppMedia(
    to: string,
    type: "image" | "audio" | "document" | "video",
    mediaUrl: string,
    filename?: string
  ): Promise<WhatsAppResponse | null> {
    const formattedPhone = this.getCleanPhone(to);

    const body: WhatsAppRequestBody = {
      messaging_product: "whatsapp",
      to: formattedPhone,
      type,
    };

    if (type === "document") {
      body.document = { link: mediaUrl, filename };
    } else if (type === "image") {
      body.image = { link: mediaUrl };
    } else if (type === "audio") {
      body.audio = { link: mediaUrl };
    } else if (type === "video") {
      body.video = { link: mediaUrl };
    }

    const response = await this.sendWhatsAppRequest(body);

    let conversation = await communicationRepository.findConversationByWaId(formattedPhone);
    let content = "";
    if (type === "image") content = "📷 Foto";
    else if (type === "audio") content = "🎙️ Áudio";
    else if (type === "video") content = "🎥 Vídeo";
    else if (type === "document") content = filename ? `📄 ${filename}` : "📄 Documento";

    if (!conversation) {
      const user = await communicationRepository.findUserByPhone(formattedPhone);
      conversation = await communicationRepository.createConversation({
        waId: formattedPhone,
        studentId: user?.id,
        lastMessageContent: content,
        lastMessageAt: new Date(),
      });
    } else {
      await communicationRepository.updateConversation(conversation.id, {
        lastMessageContent: content,
        lastMessageAt: new Date(),
      });
    }

    const isSuccess = !!response?.messages?.[0]?.id;
    const msgId = isSuccess ? response!.messages[0].id : `failed_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const status = isSuccess ? "sent" : "failed";

    await communicationRepository.saveMessage({
      id: msgId,
      conversationId: conversation.id,
      content: content,
      type: type,
      direction: "outbound",
      status: status,
      metadata: { mediaUrl, mediaId: null, mimeType: type === "image" ? "image/jpeg" : type === "audio" ? "audio/ogg" : "application/octet-stream", filename },
    });

    // RTDB Signal for real-time update
    try {
      await adminRtdb.ref(`whatsapp_sync_signal/messages/${conversation.id}`).set(Date.now());
      await adminRtdb.ref(`whatsapp_sync_signal/conversations`).set(Date.now());
    } catch (rtdbErr) {
      console.error("[sendWhatsAppMedia] RTDB sync signal error:", rtdbErr);
    }

    return response;
  }

  /**
   * Tenta reenviar uma mensagem do WhatsApp que está com status "failed".
   */
  async resendWhatsAppMessage(messageId: string): Promise<{ success: boolean; messageId: string }> {
    const msg = await communicationRepository.findMessageById(messageId);
    if (!msg) {
      throw new Error("Mensagem não encontrada.");
    }

    if (msg.direction !== "outbound") {
      throw new Error("Apenas mensagens enviadas podem ser reenviadas.");
    }

    const conversation = await communicationRepository.findConversationByWaId(msg.conversationId);
    let waId = conversation?.waId;

    if (!waId) {
      // Tentar por ID da tabela de conversas se o waId não foi retornado diretamente
      const convRecord = await db.query.whatsappConversationsTable.findFirst({
        where: eq(whatsappConversationsTable.id, msg.conversationId),
      });
      waId = convRecord?.waId;
    }

    if (!waId) {
      throw new Error("Conversa não encontrada para este envio.");
    }

    const formattedPhone = this.getCleanPhone(waId);
    let newResponse: WhatsAppResponse | null = null;

    if (msg.type === "template" || msg.content?.startsWith("[Template:")) {
      const meta = (msg.metadata as { templateName?: string; components?: unknown[]; languageCode?: string }) || {};
      const templateName = meta.templateName || (msg.content?.match(/\[Template:\s*(.+?)\]/)?.[1]);

      if (!templateName) {
        throw new Error("Dados do template ausentes para reenvio.");
      }

      newResponse = await this.sendWhatsAppRequest({
        messaging_product: "whatsapp",
        to: formattedPhone,
        type: "template",
        template: {
          name: templateName,
          language: { code: meta.languageCode || "pt_BR" },
          //eslint-disable-next-line @typescript-eslint/no-explicit-any
          components: (meta.components as any) || []
        }
      });
    } else if (msg.type === "text") {
      newResponse = await this.sendWhatsAppRequest({
        messaging_product: "whatsapp",
        to: formattedPhone,
        type: "text",
        text: { body: msg.content || "" }
      });
    } else if (["image", "audio", "document", "video"].includes(msg.type)) {
      const meta = (msg.metadata as { mediaUrl?: string; filename?: string }) || {};
      const mediaUrl = meta.mediaUrl;

      if (!mediaUrl) {
        throw new Error("URL da mídia ausente para reenvio.");
      }

      const body: WhatsAppRequestBody = {
        messaging_product: "whatsapp",
        to: formattedPhone,
        type: msg.type as "image" | "audio" | "document" | "video",
      };

      if (msg.type === "document") body.document = { link: mediaUrl, filename: meta.filename };
      else if (msg.type === "image") body.image = { link: mediaUrl };
      else if (msg.type === "audio") body.audio = { link: mediaUrl };
      else if (msg.type === "video") body.video = { link: mediaUrl };

      newResponse = await this.sendWhatsAppRequest(body);
    } else {
      throw new Error(`Tipo de mensagem não suportado para reenvio: ${msg.type}`);
    }

    if (!newResponse?.messages?.[0]?.id) {
      // Permanece como failed
      await communicationRepository.updateMessageStatus(msg.id, "failed");
      throw new Error("Falha ao reenviar mensagem via API do WhatsApp. Verifique o saldo/pagamento da Meta.");
    }

    const newMetaId = newResponse.messages[0].id;

    // Atualiza a mensagem no banco com novo ID e status sent
    await communicationRepository.replaceMessageIdAndStatus(msg.id, newMetaId, "sent");

    // Atualiza a conversa
    await communicationRepository.updateConversation(msg.conversationId, {
      lastMessageContent: msg.content,
      lastMessageAt: new Date(),
    });

    // Dispara sinal RTDB para sincronização em tempo real nas UIs
    try {
      await adminRtdb.ref(`whatsapp_sync_signal/messages/${msg.conversationId}`).set(Date.now());
      await adminRtdb.ref(`whatsapp_sync_signal/conversations`).set(Date.now());
    } catch (rtdbErr) {
      console.error("[resendWhatsAppMessage] RTDB sync signal error:", rtdbErr);
    }

    return { success: true, messageId: newMetaId };
  }

  async getConversations(includeArchived: boolean = false, offset = 0) {
    // Primeira página maior (é a que o SWR mantém atualizada); as seguintes
    // vêm sob demanda pelo "Carregar mais conversas".
    return communicationRepository.getConversations(includeArchived, offset === 0 ? 200 : 100, offset);
  }

  async getMessages(conversationId: string, before?: Date) {
    return communicationRepository.getMessages(conversationId, 50, before);
  }

  async markAsRead(conversationId: string) {
    await communicationRepository.markAsRead(conversationId);
    // Sync signal so the sidebar unread badge updates immediately instead of
    // waiting for its own polling cycle.
    try {
      await adminRtdb.ref("whatsapp_sync_signal/conversations").set(Date.now());
    } catch (rtdbErr) {
      console.error("[CommunicationService.markAsRead] RTDB sync signal error:", rtdbErr);
    }
  }

  async updateContactName(conversationId: string, name: string) {
    return communicationRepository.updateConversation(conversationId, { contactName: name });
  }

  async updateLabels(conversationId: string, labels: unknown[]) {
    return communicationRepository.updateConversation(conversationId, { labels });
  }

  async archiveConversation(conversationId: string, isArchived: boolean) {
    return communicationRepository.updateConversation(conversationId, { isArchived });
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

  async getQuickReplies() {
    return communicationRepository.getQuickReplies();
  }

  async createQuickReply(data: { shortcut: string; title: string; content: string }) {
    return communicationRepository.createQuickReply(data);
  }

  async deleteQuickReply(id: string) {
    return communicationRepository.deleteQuickReply(id);
  }

  async updateConversation(id: string, data: Partial<typeof whatsappConversationsTable.$inferInsert>) {
    return communicationRepository.updateConversation(id, data);
  }

  async findStudentsByPhone(phone: string) {
    return communicationRepository.findStudentsByPhone(phone);
  }

  async sendAdminEmail(data: { to: string; subject: string; body: string }) {
    try {
      const student = await communicationRepository.findUserByEmail(data.to);
      const htmlContent = `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; line-height: 1.6; color: #333;">
          ${data.body.split("\n").map(p => p.trim() ? `<p>${p}</p>` : "<br>").join("")}
        </div>
      `;

      const resendRes = await resend.emails.send({
        from: this.defaultFrom,
        to: data.to,
        subject: data.subject,
        html: htmlContent,
      });

      if (resendRes.error) {
        throw new Error(resendRes.error.message || "Erro ao enviar e-mail via Resend API");
      }

      const resendId = resendRes.data?.id || null;

      // Save to database
      const emailRecord = await communicationRepository.saveEmailRecord({
        resendId,
        from: this.defaultFrom,
        to: [data.to],
        subject: data.subject,
        html: htmlContent,
        text: data.body,
        direction: "outbound",
        status: "sent",
        studentId: student?.id || null,
      });

      // Firebase Sync Signal
      try {
        await adminRtdb.ref("email_sync_signal").set(Date.now());
      } catch (err) {
        console.error("[CommunicationService.sendAdminEmail] Error setting sync signal:", err);
      }

      return { success: true, data: emailRecord };
    } catch (error) {
      console.error("[CommunicationService.sendAdminEmail] Error:", error);
      throw error;
    }
  }

  /**
   * Fallback: envia um e-mail avisando sobre uma mensagem de WhatsApp perdida
   * quando o destinatário não possui nenhuma subscription de push ativa.
   * Isso evita que uma notificação fique 100% invisível para o operador.
   */
  async sendWhatsAppMissedMessageEmail(
    to: string,
    data: { senderLabel: string; preview: string; actionUrl: string }
  ) {
    try {
      const htmlContent = `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; line-height: 1.6; color: #333;">
          <p>Você tem uma nova mensagem de WhatsApp de <strong>${data.senderLabel}</strong> que ainda não foi lida na plataforma:</p>
          <p style="background:#f5f5f5; padding:12px 16px; border-radius:8px; font-style: italic;">${data.preview}</p>
          <p><a href="${data.actionUrl}" style="color:#00a884; font-weight:bold;">Abrir conversa na plataforma</a></p>
          <p style="font-size:12px; color:#888;">Você está recebendo este e-mail porque não há um dispositivo com notificações push ativas no momento.</p>
        </div>
      `;

      await resend.emails.send({
        from: this.defaultFrom,
        to,
        subject: `Nova mensagem no WhatsApp de ${data.senderLabel}`,
        html: htmlContent,
      });
    } catch (error) {
      console.error("[CommunicationService.sendWhatsAppMissedMessageEmail] Error:", error);
    }
  }

  async getResendUsage(): Promise<import("./communication.types").ResendUsage | null> {
    try {
      const response = await fetch("https://api.resend.com/usage", {
        headers: {
          Authorization: `Bearer ${env.RESEND_API_KEY}`,
        },
        cache: "no-store",
      });

      if (response.ok) {
        return await response.json();
      }
      console.warn("[CommunicationService.getResendUsage] Usage API returned non-ok status, falling back to dynamic stats calculation.");
    } catch (error) {
      console.error("[CommunicationService.getResendUsage] Fetch error:", error);
    }

    return this.getCalculatedResendUsageFallback();
  }

  private async getCalculatedResendUsageFallback(): Promise<import("./communication.types").ResendUsage> {
    const dbEmails = await communicationRepository.getEmailsList(500);

    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOf24h = new Date(now.getTime() - 24 * 60 * 60 * 1000);

    let monthlySent = 0;
    let monthlyReceived = 0;
    let dailySent = 0;
    let dailyReceived = 0;
    const recipientSet = new Set<string>();

    for (const email of dbEmails) {
      const emailDate = new Date(email.createdAt);
      const isOutbound = email.direction === "outbound";

      if (Array.isArray(email.to)) {
        email.to.forEach(addr => { if (addr) recipientSet.add(addr); });
      } else if (email.to) {
        recipientSet.add(email.to);
      }

      if (emailDate >= startOfMonth) {
        if (isOutbound) monthlySent++;
        else monthlyReceived++;
      }

      if (emailDate >= startOf24h) {
        if (isOutbound) dailySent++;
        else dailyReceived++;
      }
    }

    const monthlyTotal = monthlySent + monthlyReceived;
    const dailyTotal = dailySent + dailyReceived;
    const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);

    return {
      object: "usage",
      generated_at: now.toISOString(),
      emails: {
        daily: {
          used: dailyTotal,
          limit: 100,
          sent: dailySent,
          received: dailyReceived,
          resets_at: new Date(now.getTime() + 24 * 60 * 60 * 1000).toISOString(),
        },
        monthly: {
          used: monthlyTotal,
          limit: 3000,
          sent: monthlySent,
          received: monthlyReceived,
          resets_at: nextMonth.toISOString(),
        },
      },
      contacts: {
        used: recipientSet.size,
        limit: 3000,
      },
      rate_limit: {
        limit: 10,
        duration: "1000ms",
      },
    };
  }

  async getEmails() {
    let apiEmails: import("./communication.types").EmailMessage[] = [];

    try {
      const resendRes = await resend.emails.list();
      // Handle resendRes.data which can be { object: 'list', data: [...] } or direct array
      const rawList = Array.isArray(resendRes.data)
        ? resendRes.data
        : (resendRes.data && Array.isArray((resendRes.data as { data?: unknown[] }).data)
          ? (resendRes.data as { data: unknown[] }).data
          : null);

      if (rawList && Array.isArray(rawList)) {
        apiEmails = await Promise.all(
          (rawList as Array<{
            id: string;
            from: string;
            to: string | string[];
            subject?: string;
            created_at: string;
            last_event?: string;
          }>).map(async (item) => {
            const recipientEmail = Array.isArray(item.to) ? item.to[0] : item.to;
            let studentName: string | null = null;
            let studentPhotoUrl: string | null = null;
            let studentId: string | null = null;

            if (recipientEmail) {
              const student = await communicationRepository.findUserByEmail(recipientEmail);
              if (student) {
                studentName = student.name;
                studentPhotoUrl = student.photoUrl || null;
                studentId = student.id;
              }
            }

            return {
              id: item.id,
              resendId: item.id,
              from: item.from,
              to: Array.isArray(item.to) ? item.to : [item.to],
              subject: item.subject || "(Sem Assunto)",
              html: null as string | null,
              text: null as string | null,
              direction: "outbound" as const,
              status: item.last_event || "sent",
              studentId,
              createdAt: new Date(item.created_at),
              updatedAt: new Date(item.created_at),
              metadata: { lastEvent: item.last_event },
              studentName,
              studentPhotoUrl,
              studentEmail: recipientEmail || null,
            };
          })
        );
      }
    } catch (error) {
      console.error("[CommunicationService.getEmails] Resend API error:", error);
    }

    const dbEmails = await communicationRepository.getEmailsList(100);

    const emailMap = new Map<string, import("./communication.types").EmailMessage>();

    // Put API emails in map first
    for (const email of apiEmails) {
      const key = email.resendId || email.id;
      emailMap.set(key, email);
    }

    // Overlay DB emails (which contain full HTML/text and inbound emails)
    for (const email of dbEmails) {
      const key = email.resendId || email.id;
      const existing = emailMap.get(key);
      if (existing) {
        emailMap.set(key, {
          ...existing,
          ...email,
          studentName: email.studentName || existing.studentName,
          studentPhotoUrl: email.studentPhotoUrl || existing.studentPhotoUrl,
          studentEmail: email.studentEmail || existing.studentEmail,
        });
      } else {
        emailMap.set(key, email);
      }
    }

    const sortedEmails = Array.from(emailMap.values()).sort((a, b) => {
      const tA = new Date(a.createdAt).getTime();
      const tB = new Date(b.createdAt).getTime();
      return tB - tA;
    });

    return sortedEmails;
  }

  async getEmailDetail(id: string) {
    try {
      const res = await resend.emails.get(id);
      if (res.data) {
        return res.data;
      }
    } catch (error) {
      console.error("[CommunicationService.getEmailDetail] Resend API error:", error);
    }

    const dbEmail = await communicationRepository.findEmailByResendId(id);
    if (dbEmail) {
      return {
        id: dbEmail.id,
        from: dbEmail.from,
        to: dbEmail.to,
        subject: dbEmail.subject,
        html: dbEmail.html,
        text: dbEmail.text,
        created_at: dbEmail.createdAt,
      };
    }

    return null;
  }


  async processInboundEmailWebhook(webhookData: { email_id: string; [key: string]: unknown }) {
    try {
      const emailId = webhookData.email_id;
      if (!emailId) {
        throw new Error("No email_id provided in webhook data");
      }

      // Fetch email contents via Receiving API
      const res = await resend.emails.receiving.get(emailId);
      if (res.error) {
        throw new Error(res.error.message || "Error fetching inbound email content");
      }

      const email = res.data;
      if (!email) {
        throw new Error("Inbound email not found in Resend");
      }

      const fromAddress = email.from;
      // Extract clean email address from "Name <email@domain>" format
      const cleanFrom = fromAddress.includes("<")
        ? fromAddress.split("<")[1].split(">")[0].trim()
        : fromAddress.trim();

      const student = await communicationRepository.findUserByEmail(cleanFrom);

      const toAddresses = Array.isArray(email.to) ? email.to : [email.to];

      // Save record in our DB
      const record = await communicationRepository.saveEmailRecord({
        resendId: emailId,
        from: fromAddress,
        to: toAddresses,
        subject: email.subject || "(Sem Assunto)",
        html: email.html || null,
        text: email.text || null,
        direction: "inbound",
        status: "received",
        studentId: student?.id || null,
        metadata: {
          headers: email.headers,
          attachments: email.attachments,
        },
      });

      // Firebase Sync Signal
      try {
        await adminRtdb.ref("email_sync_signal").set(Date.now());
      } catch (err) {
        console.error("[CommunicationService.processInboundEmailWebhook] Error setting sync signal:", err);
      }

      return { success: true, data: record };
    } catch (error) {
      console.error("[CommunicationService.processInboundEmailWebhook] Error:", error);
      throw error;
    }
  }

  async getTotalUnreadCount() {
    return communicationRepository.getTotalUnreadCount();
  }

  async getConversationStudents(conversationId: string) {
    return communicationRepository.getConversationStudents(conversationId);
  }

  async addConversationStudent(conversationId: string, studentId: string) {
    return communicationRepository.addConversationStudent(conversationId, studentId);
  }

  async removeConversationStudent(conversationId: string, studentId: string) {
    return communicationRepository.removeConversationStudent(conversationId, studentId);
  }

  async getAllowedTemplates(): Promise<string[]> {
    const settings = await settingsService.getSettings();
    if (settings && Array.isArray(settings.allowedWhatsappTemplates) && settings.allowedWhatsappTemplates.length > 0) {
      return settings.allowedWhatsappTemplates;
    }
    return [
      "payment_reminder_v4",
      "payment_reminder_v5",
      "payment_overdue_v4",
      "payment_overdue_v5",
      "welcome_first",
      "talk_to_person",
      "class_scheduled_student_v1",
    ];
  }
}


export const communicationService = new CommunicationService();
