import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Html,
  Preview,
  Section,
  Text,
} from "@react-email/components";
import { emailStyles } from "./email-styles";
import { format } from "date-fns";
import { ptBR, enUS } from "date-fns/locale";
import { emailTranslations } from "./translations";

interface BillingReminderEmailProps {
  studentName: string;
  amount: number;
  dueDate: Date;
  checkoutUrl: string;
  locale?: "pt" | "en";
}

export const BillingReminderEmail = ({
  studentName,
  amount,
  dueDate,
  checkoutUrl,
  locale = "pt",
}: BillingReminderEmailProps) => {
  const t = emailTranslations.billingReminder[locale] || emailTranslations.billingReminder.pt;

  const formattedAmount = new Intl.NumberFormat(locale === "pt" ? "pt-BR" : "en-US", {
    style: "currency",
    currency: locale === "pt" ? "BRL" : "USD",
  }).format(amount / 100);

  const dateLocale = locale === "pt" ? ptBR : enUS;
  const dateFormat = locale === "pt" ? "dd 'de' MMMM" : "MMMM dd";
  const formattedDueDate = format(dueDate, dateFormat, { locale: dateLocale });

  return (
    <Html>
      <Head />
      <Preview>{t.preview}</Preview>
      <Body style={emailStyles.main}>
        <Container style={emailStyles.container}>
          <Heading style={emailStyles.h1}>{t.heading}, {studentName}!</Heading>
          <Section style={emailStyles.section}>
            <Text style={emailStyles.text}>
              {t.body(formattedAmount, formattedDueDate)}
            </Text>
            <Text style={emailStyles.text}>
              {t.body2}
            </Text>
            <Section style={emailStyles.buttonContainer}>
              <Button style={emailStyles.button} href={checkoutUrl}>
                {t.button}
              </Button>
            </Section>
            <Text style={emailStyles.text}>
              {t.footerParagraph}
            </Text>
          </Section>
          <Text style={emailStyles.footer}>
            {t.footer}
          </Text>
        </Container>
      </Body>
    </Html>
  );
};

export default BillingReminderEmail;

