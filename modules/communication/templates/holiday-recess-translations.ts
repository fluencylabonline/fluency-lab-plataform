import type { NoticeEmailContent } from "./NoticeEmail";

/**
 * Textos dos emails do recesso de fim de ano (pt/en).
 *
 * - 01/12 e 15/12: aviso de que não há aulas ao vivo no período
 *   (alunos recebem o link das aulas gravadas; professores, só o aviso);
 * - 01/01 e 10/01: lembrete de que as aulas ao vivo voltam
 *   (alunos recebem a data e o horário da próxima aula, quando existe).
 *
 * As datas chegam já formatadas no idioma do destinatário (ex.: "18 de dezembro").
 */

type Locale = "pt" | "en";

const FOOTER: Record<Locale, string> = {
  pt: "Equipe Fluency Lab",
  en: "Fluency Lab Team",
};

export type HolidayRecessEmail =
  | {
      kind: "studentStart";
      name: string;
      firstDayOff: string;
      lastDayOff: string;
      returnDay: string;
      classesUrl: string;
      reminder: boolean;
    }
  | {
      kind: "teacherStart";
      name: string;
      firstDayOff: string;
      lastDayOff: string;
      returnDay: string;
      reminder: boolean;
    }
  | {
      kind: "studentReturn";
      name: string;
      returnDay: string;
      nextClass: { dateTime: string; teacherName: string | null } | null;
      scheduleUrl: string;
    }
  | {
      kind: "teacherReturn";
      name: string;
      returnDay: string;
      scheduleUrl: string;
    };

const firstName = (name: string) => name.trim().split(/\s+/)[0] || name;

export function buildHolidayRecessEmail(data: HolidayRecessEmail, locale: Locale): NoticeEmailContent {
  const pt = locale === "pt";
  const hi = pt ? `Olá, ${firstName(data.name)}!` : `Hi, ${firstName(data.name)}!`;
  const footer = FOOTER[locale];

  switch (data.kind) {
    case "studentStart":
      return {
        subject: pt
          ? `${data.reminder ? "Lembrete: " : ""}recesso de fim de ano, sem aulas ao vivo de ${data.firstDayOff} a ${data.lastDayOff}`
          : `${data.reminder ? "Reminder: " : ""}year-end break, no live classes from ${data.firstDayOff} to ${data.lastDayOff}`,
        preview: pt ? "Aulas gravadas disponíveis para você continuar estudando." : "Recorded classes are available so you can keep studying.",
        heading: hi,
        paragraphs: pt
          ? [
              `No recesso de fim de ano não teremos aulas ao vivo. As aulas param em ${data.firstDayOff} e voltam em ${data.returnDay}.`,
              "Para você não perder o ritmo, preparamos aulas de recesso gravadas, com vídeos, textos e materiais para baixar. Elas ficam disponíveis na plataforma e você pode assistir quando quiser.",
            ]
          : [
              `There are no live classes during the year-end break. Classes stop on ${data.firstDayOff} and come back on ${data.returnDay}.`,
              "So you don't lose momentum, we prepared recorded holiday classes with videos, texts and materials to download. They are available on the platform and you can watch them whenever you like.",
            ],
        highlight: [pt ? `Sem aulas ao vivo: ${data.firstDayOff} a ${data.lastDayOff}` : `No live classes: ${data.firstDayOff} to ${data.lastDayOff}`],
        button: { label: pt ? "Ver aulas de recesso" : "See holiday classes", url: data.classesUrl },
        footer,
      };

    case "teacherStart":
      return {
        subject: pt
          ? `${data.reminder ? "Lembrete: " : ""}sem aulas ao vivo de ${data.firstDayOff} a ${data.lastDayOff}`
          : `${data.reminder ? "Reminder: " : ""}no live classes from ${data.firstDayOff} to ${data.lastDayOff}`,
        preview: pt ? "Recesso de fim de ano da escola." : "The school's year-end break.",
        heading: hi,
        paragraphs: pt
          ? [
              `Lembrando que no recesso de fim de ano não teremos aulas ao vivo. As aulas param em ${data.firstDayOff} e voltam normalmente em ${data.returnDay}.`,
              "Durante esse período os alunos terão acesso às aulas de recesso gravadas. Boas festas e bom descanso!",
            ]
          : [
              `A reminder that there are no live classes during the year-end break. Classes stop on ${data.firstDayOff} and resume as usual on ${data.returnDay}.`,
              "During this period students will have access to the recorded holiday classes. Happy holidays and enjoy the rest!",
            ],
        highlight: [pt ? `Sem aulas ao vivo: ${data.firstDayOff} a ${data.lastDayOff}` : `No live classes: ${data.firstDayOff} to ${data.lastDayOff}`],
        footer,
      };

    case "studentReturn": {
      const next = data.nextClass;
      const nextLine = next
        ? pt
          ? `Sua próxima aula: ${next.dateTime}${next.teacherName ? ` com ${next.teacherName}` : ""}.`
          : `Your next class: ${next.dateTime}${next.teacherName ? ` with ${next.teacherName}` : ""}.`
        : pt
          ? "Ainda não encontramos uma aula marcada para você. Confira sua agenda ou fale com a secretaria."
          : "We couldn't find a scheduled class for you yet. Check your schedule or contact the school office.";
      return {
        subject: pt ? `As aulas ao vivo voltam em ${data.returnDay}` : `Live classes are back on ${data.returnDay}`,
        preview: nextLine,
        heading: hi,
        paragraphs: pt
          ? [
              `O recesso está acabando: as aulas ao vivo voltam em ${data.returnDay}.`,
              "Se ainda não terminou, aproveite os últimos dias para assistir às aulas de recesso gravadas.",
            ]
          : [
              `The break is ending: live classes are back on ${data.returnDay}.`,
              "If you haven't finished yet, use the last few days to watch the recorded holiday classes.",
            ],
        highlight: [nextLine],
        button: { label: pt ? "Ver minha agenda" : "See my schedule", url: data.scheduleUrl },
        footer,
      };
    }

    case "teacherReturn":
      return {
        subject: pt ? `As aulas ao vivo voltam em ${data.returnDay}` : `Live classes are back on ${data.returnDay}`,
        preview: pt ? "Fim do recesso de fim de ano." : "End of the year-end break.",
        heading: hi,
        paragraphs: pt
          ? [
              `O recesso está acabando: as aulas ao vivo voltam em ${data.returnDay}.`,
              "Confira sua agenda para ver as aulas da volta. Bom retorno!",
            ]
          : [
              `The break is ending: live classes are back on ${data.returnDay}.`,
              "Check your schedule to see your classes for the return. Welcome back!",
            ],
        highlight: [pt ? `Volta das aulas: ${data.returnDay}` : `Classes resume: ${data.returnDay}`],
        button: { label: pt ? "Ver minha agenda" : "See my schedule", url: data.scheduleUrl },
        footer,
      };
  }
}
