import type { NoticeEmailContent } from "./NoticeEmail";

/**
 * Textos dos emails da política de inadimplência (pt/en).
 *
 * Linha do tempo para uma parcela que vence no mês M:
 * - lembretes de 3 em 3 dias até o fim de M;
 * - último dia de M: aviso final (aluno e professor);
 * - a partir do dia 1 de M+1: acesso bloqueado, só a página de pagamento;
 *   aulas canceladas sempre no dia anterior, sem reposição;
 * - último dia de M+1: aviso de cancelamento da conta;
 * - dia 1 de M+2: conta cancelada automaticamente, sem multa rescisória.
 */

type Locale = "pt" | "en";

const FOOTER: Record<Locale, string> = {
  pt: "Equipe Fluency Lab",
  en: "Fluency Lab Team",
};

export type DelinquencyEmail =
  | {
      kind: "studentFinalWarning";
      studentName: string;
      amount: string;
      payUrl: string;
    }
  | {
      kind: "studentBlockedReminder";
      studentName: string;
      amount: string;
      cancelDate: string;
      payUrl: string;
    }
  | {
      kind: "studentCancelWarning";
      studentName: string;
      amount: string;
      payUrl: string;
    }
  | {
      kind: "studentAccountCancelled";
      studentName: string;
      amount: string;
    }
  | {
      kind: "teacherBlockWarning";
      teacherName: string;
      studentName: string;
      blockDate: string;
    }
  | {
      kind: "teacherUnblocked";
      teacherName: string;
      studentName: string;
    }
  | {
      kind: "studentClassCancelled";
      studentName: string;
      classDateTime: string;
      payUrl: string;
    }
  | {
      kind: "teacherClassCancelled";
      teacherName: string;
      studentName: string;
      classDateTime: string;
    }
  | {
      kind: "staffClassesCancelled";
      recipientName: string;
      lines: string[];
    }
  | {
      kind: "staffAccountCancelled";
      recipientName: string;
      studentName: string;
      amount: string;
      dueMonth: string;
    }
  | {
      kind: "staffAutoCancelPreview";
      recipientName: string;
      lines: string[];
    }
  | {
      kind: "policyStudent";
      name: string;
      startDate: string;
      appUrl: string;
    }
  | {
      kind: "policyTeacher";
      name: string;
      startDate: string;
      appUrl: string;
    };

export function buildDelinquencyEmail(data: DelinquencyEmail, locale: Locale): NoticeEmailContent {
  const footer = FOOTER[locale];
  const pt = locale === "pt";

  switch (data.kind) {
    case "studentFinalWarning":
      return pt
        ? {
            subject: "🚨 Último dia para pagar sua mensalidade",
            preview: "Hoje é o último dia antes do bloqueio do seu acesso",
            heading: `Olá, ${data.studentName}`,
            paragraphs: [
              `Sua mensalidade de ${data.amount} continua em aberto e hoje é o último dia do mês.`,
              "Se o pagamento não for feito hoje, a partir de amanhã o seu acesso à plataforma fica bloqueado até a regularização.",
            ],
            highlight: [
              "Enquanto o acesso estiver bloqueado, suas aulas serão canceladas (sempre no dia anterior) e não poderão ser repostas.",
              "Se o pagamento não for feito até o fim do mês seguinte, sua matrícula é cancelada automaticamente.",
            ],
            button: { label: "Pagar agora", url: data.payUrl },
            footer,
          }
        : {
            subject: "🚨 Last day to pay your monthly fee",
            preview: "Today is the last day before your access is blocked",
            heading: `Hello, ${data.studentName}`,
            paragraphs: [
              `Your monthly fee of ${data.amount} is still unpaid and today is the last day of the month.`,
              "If the payment is not made today, starting tomorrow your access to the platform will be blocked until it is settled.",
            ],
            highlight: [
              "While your access is blocked, your classes will be cancelled (always the day before) and cannot be made up.",
              "If the payment is not made by the end of the following month, your enrollment is cancelled automatically.",
            ],
            button: { label: "Pay now", url: data.payUrl },
            footer,
          };

    case "studentBlockedReminder":
      return pt
        ? {
            subject: "🔒 Seu acesso está bloqueado por falta de pagamento",
            preview: "Regularize para voltar às aulas",
            heading: `Olá, ${data.studentName}`,
            paragraphs: [
              `Seu acesso à plataforma está bloqueado porque a mensalidade de ${data.amount} segue em aberto.`,
              "Assim que o pagamento for confirmado, tudo volta ao normal na hora.",
            ],
            highlight: [
              "Enquanto o bloqueio durar, suas aulas são canceladas no dia anterior e não podem ser repostas.",
              `Sem pagamento, sua matrícula será cancelada automaticamente em ${data.cancelDate}.`,
            ],
            button: { label: "Pagar agora", url: data.payUrl },
            footer,
          }
        : {
            subject: "🔒 Your access is blocked due to an unpaid fee",
            preview: "Settle it to get back to your classes",
            heading: `Hello, ${data.studentName}`,
            paragraphs: [
              `Your access to the platform is blocked because your monthly fee of ${data.amount} is still unpaid.`,
              "As soon as the payment is confirmed, everything goes back to normal right away.",
            ],
            highlight: [
              "While the block lasts, your classes are cancelled the day before and cannot be made up.",
              `Without payment, your enrollment will be cancelled automatically on ${data.cancelDate}.`,
            ],
            button: { label: "Pay now", url: data.payUrl },
            footer,
          };

    case "studentCancelWarning":
      return pt
        ? {
            subject: "⚠️ Sua matrícula será cancelada amanhã",
            preview: "Último dia para regularizar e manter sua matrícula",
            heading: `Olá, ${data.studentName}`,
            paragraphs: [
              `Sua mensalidade de ${data.amount} segue em aberto desde o mês passado e seu acesso continua bloqueado.`,
              "Hoje é o último dia para regularizar. Sem o pagamento, amanhã sua matrícula e seu contrato serão cancelados automaticamente.",
            ],
            button: { label: "Pagar agora", url: data.payUrl },
            footer,
          }
        : {
            subject: "⚠️ Your enrollment will be cancelled tomorrow",
            preview: "Last day to settle and keep your enrollment",
            heading: `Hello, ${data.studentName}`,
            paragraphs: [
              `Your monthly fee of ${data.amount} has been unpaid since last month and your access is still blocked.`,
              "Today is the last day to settle it. Without payment, tomorrow your enrollment and contract will be cancelled automatically.",
            ],
            button: { label: "Pay now", url: data.payUrl },
            footer,
          };

    case "studentAccountCancelled":
      return pt
        ? {
            subject: "Sua matrícula foi cancelada",
            preview: "Cancelamento por falta de pagamento",
            heading: `Olá, ${data.studentName}`,
            paragraphs: [
              "Como a mensalidade não foi paga até o fim do mês de bloqueio, sua matrícula e seu contrato foram cancelados automaticamente.",
              "Não há cobrança de multa rescisória neste cancelamento.",
              `O valor em aberto de ${data.amount} continua devido. Para regularizar ou voltar a estudar com a gente, é só responder este email.`,
            ],
            footer,
          }
        : {
            subject: "Your enrollment has been cancelled",
            preview: "Cancellation due to non-payment",
            heading: `Hello, ${data.studentName}`,
            paragraphs: [
              "Since the monthly fee was not paid by the end of the blocked month, your enrollment and contract were cancelled automatically.",
              "No cancellation fee is charged in this case.",
              `The outstanding amount of ${data.amount} is still due. To settle it or to come back, just reply to this email.`,
            ],
            footer,
          };

    case "teacherBlockWarning":
      return pt
        ? {
            subject: `Aviso: ${data.studentName} pode ficar sem aulas a partir de amanhã`,
            preview: "Aluno com mensalidade em atraso",
            heading: `Olá, ${data.teacherName}`,
            paragraphs: [
              `O aluno ${data.studentName} está com a mensalidade em atraso. Se não regularizar hoje, o acesso dele à plataforma será bloqueado a partir de ${data.blockDate}.`,
              "Enquanto estiver bloqueado, as aulas dele serão canceladas sempre no dia anterior, e você receberá um aviso a cada cancelamento.",
            ],
            highlight: ["As aulas perdidas durante o bloqueio não poderão ser repostas."],
            footer,
          }
        : {
            subject: `Notice: ${data.studentName} may have no classes starting tomorrow`,
            preview: "Student with an overdue monthly fee",
            heading: `Hello, ${data.teacherName}`,
            paragraphs: [
              `Your student ${data.studentName} has an overdue monthly fee. If it is not settled today, their access to the platform will be blocked starting ${data.blockDate}.`,
              "While blocked, their classes will be cancelled always the day before, and you will be notified of each cancellation.",
            ],
            highlight: ["Classes missed during the block cannot be made up."],
            footer,
          };

    case "teacherUnblocked":
      return pt
        ? {
            subject: `${data.studentName} regularizou o pagamento`,
            preview: "Aluno volta às aulas normalmente",
            heading: `Olá, ${data.teacherName}`,
            paragraphs: [
              `O aluno ${data.studentName} regularizou o pagamento e o acesso foi liberado.`,
              "As próximas aulas seguem normalmente. As aulas canceladas durante o bloqueio não são repostas.",
            ],
            footer,
          }
        : {
            subject: `${data.studentName} has settled the payment`,
            preview: "Student is back to classes",
            heading: `Hello, ${data.teacherName}`,
            paragraphs: [
              `Your student ${data.studentName} has settled the payment and their access is unblocked.`,
              "Upcoming classes continue as usual. Classes cancelled during the block are not made up.",
            ],
            footer,
          };

    case "studentClassCancelled":
      return pt
        ? {
            subject: `Aula de ${data.classDateTime} cancelada`,
            preview: "Aula cancelada por falta de pagamento",
            heading: `Olá, ${data.studentName}`,
            paragraphs: [
              `Sua aula de ${data.classDateTime} foi cancelada porque seu acesso está bloqueado por falta de pagamento.`,
              "Essa aula não pode ser reposta. Regularize o pagamento para que as próximas aulas não sejam canceladas.",
            ],
            button: { label: "Pagar agora", url: data.payUrl },
            footer,
          }
        : {
            subject: `Class on ${data.classDateTime} cancelled`,
            preview: "Class cancelled due to an unpaid fee",
            heading: `Hello, ${data.studentName}`,
            paragraphs: [
              `Your class on ${data.classDateTime} was cancelled because your access is blocked due to an unpaid fee.`,
              "This class cannot be made up. Settle the payment so your next classes are not cancelled.",
            ],
            button: { label: "Pay now", url: data.payUrl },
            footer,
          };

    case "teacherClassCancelled":
      return pt
        ? {
            subject: `Aula cancelada: ${data.studentName} (${data.classDateTime})`,
            preview: "Aula cancelada por inadimplência do aluno",
            heading: `Olá, ${data.teacherName}`,
            paragraphs: [
              `A aula de ${data.classDateTime} com ${data.studentName} foi cancelada porque o acesso do aluno está bloqueado por falta de pagamento.`,
              "Não haverá reposição dessa aula. Você continuará sendo avisado no dia anterior de cada aula cancelada, até o aluno regularizar.",
            ],
            footer,
          }
        : {
            subject: `Class cancelled: ${data.studentName} (${data.classDateTime})`,
            preview: "Class cancelled due to the student's unpaid fee",
            heading: `Hello, ${data.teacherName}`,
            paragraphs: [
              `The class on ${data.classDateTime} with ${data.studentName} was cancelled because the student's access is blocked due to an unpaid fee.`,
              "This class will not be made up. You will keep being notified the day before each cancelled class until the student settles the payment.",
            ],
            footer,
          };

    case "staffClassesCancelled":
      return pt
        ? {
            subject: `Aulas canceladas por inadimplência (${data.lines.length})`,
            preview: "Resumo dos cancelamentos de amanhã",
            heading: `Olá, ${data.recipientName}`,
            paragraphs: ["As aulas abaixo, de amanhã, foram canceladas porque os alunos estão com o acesso bloqueado por falta de pagamento:"],
            highlight: data.lines,
            footer,
          }
        : {
            subject: `Classes cancelled due to non-payment (${data.lines.length})`,
            preview: "Summary of tomorrow's cancellations",
            heading: `Hello, ${data.recipientName}`,
            paragraphs: ["The classes below, scheduled for tomorrow, were cancelled because the students' access is blocked due to non-payment:"],
            highlight: data.lines,
            footer,
          };

    case "staffAccountCancelled":
      return pt
        ? {
            subject: `Matrícula cancelada por inadimplência: ${data.studentName}`,
            preview: "Cancelamento automático sem multa",
            heading: `Olá, ${data.recipientName}`,
            paragraphs: [
              `A matrícula de ${data.studentName} foi cancelada automaticamente: a mensalidade de ${data.amount} (${data.dueMonth}) não foi paga até o fim do mês de bloqueio.`,
              "O cancelamento foi feito sem multa rescisória. As aulas futuras foram canceladas e o acesso do aluno foi desativado. O valor em aberto continua registrado.",
            ],
            footer,
          }
        : {
            subject: `Enrollment cancelled due to non-payment: ${data.studentName}`,
            preview: "Automatic cancellation without fee",
            heading: `Hello, ${data.recipientName}`,
            paragraphs: [
              `${data.studentName}'s enrollment was cancelled automatically: the monthly fee of ${data.amount} (${data.dueMonth}) was not paid by the end of the blocked month.`,
              "No cancellation fee was charged. Future classes were cancelled and the student's access was deactivated. The outstanding amount remains on record.",
            ],
            footer,
          };

    case "staffAutoCancelPreview":
      return pt
        ? {
            subject: `Cancelamento automático desligado: ${data.lines.length} aluno(s) seriam cancelados`,
            preview: "Revise antes de ligar o cancelamento automático",
            heading: `Olá, ${data.recipientName}`,
            paragraphs: [
              "O cancelamento automático por inadimplência está desligado em Configurações → Políticas. Nada foi cancelado.",
              "Se estivesse ligado, estes alunos teriam a matrícula cancelada hoje:",
            ],
            highlight: data.lines,
            footer,
          }
        : {
            subject: `Automatic cancellation is off: ${data.lines.length} student(s) would be cancelled`,
            preview: "Review before turning automatic cancellation on",
            heading: `Hello, ${data.recipientName}`,
            paragraphs: [
              "Automatic cancellation for non-payment is turned off in Settings → Policies. Nothing was cancelled.",
              "If it were on, these students would have their enrollment cancelled today:",
            ],
            highlight: data.lines,
            footer,
          };

    case "policyStudent":
      return pt
        ? {
            subject: "Novas regras de pagamento das mensalidades",
            preview: "Lembretes, bloqueio de acesso e cancelamento por falta de pagamento",
            heading: `Olá, ${data.name}`,
            paragraphs: [
              `A partir das mensalidades com vencimento em ${data.startDate}, passam a valer as regras abaixo para pagamentos em atraso. Queremos que todos saibam com antecedência como funciona:`,
            ],
            highlight: [
              "1. Lembretes: depois do vencimento, você recebe lembretes de 3 em 3 dias por email, WhatsApp e notificação, até o fim do mês.",
              "2. Último dia do mês: você recebe um aviso final. Se o pagamento não for feito nesse dia, o acesso será bloqueado.",
              "3. Bloqueio: a partir do dia 1 do mês seguinte, ao entrar na plataforma você verá apenas a página de pagamento. Pagou, o acesso volta na hora.",
              "4. Aulas durante o bloqueio: são canceladas sempre no dia anterior e não podem ser repostas. Seu professor também é avisado.",
              "5. Cancelamento: se o mês de bloqueio terminar sem pagamento, a matrícula e o contrato são cancelados automaticamente, sem multa rescisória. O valor em aberto continua devido.",
            ],
            button: { label: "Ver minhas mensalidades", url: `${data.appUrl}/hub/student/payments` },
            footer,
          }
        : {
            subject: "New rules for monthly payments",
            preview: "Reminders, access block and cancellation for non-payment",
            heading: `Hello, ${data.name}`,
            paragraphs: [
              `Starting with monthly fees due on ${data.startDate}, the rules below apply to late payments. We want everyone to know in advance how it works:`,
            ],
            highlight: [
              "1. Reminders: after the due date, you get reminders every 3 days by email, WhatsApp and notification, until the end of the month.",
              "2. Last day of the month: you get a final notice. If the payment is not made that day, your access will be blocked.",
              "3. Block: starting on the 1st of the following month, you will only see the payment page when you log in. Once paid, access is restored right away.",
              "4. Classes during the block: they are cancelled always the day before and cannot be made up. Your teacher is notified too.",
              "5. Cancellation: if the blocked month ends without payment, your enrollment and contract are cancelled automatically, with no cancellation fee. The outstanding amount is still due.",
            ],
            button: { label: "See my payments", url: `${data.appUrl}/hub/student/payments` },
            footer,
          };

    case "policyTeacher":
      return pt
        ? {
            subject: "Novas regras para alunos com mensalidade em atraso",
            preview: "Como ficam as aulas de alunos bloqueados por falta de pagamento",
            heading: `Olá, ${data.name}`,
            paragraphs: [
              `A partir das mensalidades com vencimento em ${data.startDate}, alunos inadimplentes seguem as regras abaixo. Veja o que muda para você:`,
            ],
            highlight: [
              "1. No último dia do mês, se o aluno ainda não pagou, você recebe um aviso por email, WhatsApp e notificação de que ele pode ficar sem aulas.",
              "2. A partir do dia 1 do mês seguinte, o acesso do aluno fica bloqueado até ele pagar.",
              "3. Enquanto o bloqueio durar, cada aula do aluno é cancelada no dia anterior, para não atrapalhar a sua agenda. Você é avisado a cada cancelamento.",
              "4. Essas aulas não são repostas.",
              "5. Quando o aluno pagar, você recebe um aviso de que ele voltou às aulas.",
              "6. Se o mês de bloqueio terminar sem pagamento, a matrícula do aluno é cancelada automaticamente.",
            ],
            button: { label: "Abrir a plataforma", url: `${data.appUrl}/hub` },
            footer,
          }
        : {
            subject: "New rules for students with overdue fees",
            preview: "How classes work for students blocked for non-payment",
            heading: `Hello, ${data.name}`,
            paragraphs: [
              `Starting with monthly fees due on ${data.startDate}, students with overdue fees follow the rules below. Here is what changes for you:`,
            ],
            highlight: [
              "1. On the last day of the month, if the student still has not paid, you get a notice by email, WhatsApp and notification that they may have no classes.",
              "2. Starting on the 1st of the following month, the student's access is blocked until they pay.",
              "3. While the block lasts, each of the student's classes is cancelled the day before, so your schedule is not disrupted. You are notified of each cancellation.",
              "4. These classes are not made up.",
              "5. When the student pays, you get a notice that they are back to classes.",
              "6. If the blocked month ends without payment, the student's enrollment is cancelled automatically.",
            ],
            button: { label: "Open the platform", url: `${data.appUrl}/hub` },
            footer,
          };
  }
}
