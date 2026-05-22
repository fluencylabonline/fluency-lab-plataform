import {
  Body,
  Container,
  Head,
  Heading,
  Html,
  Preview,
  Section,
  Text,
} from "@react-email/components";
import { emailStyles } from "./email-styles";
import { emailTranslations } from "./translations";

interface PaymentConfirmedEmailProps {
  studentName: string;
  amount: number;
  locale?: "pt" | "en";
}

export const PaymentConfirmedEmail = ({
  studentName,
  amount,
  locale = "pt",
}: PaymentConfirmedEmailProps) => {
  const t = emailTranslations.paymentConfirmed[locale] || emailTranslations.paymentConfirmed.pt;

  const formattedAmount = new Intl.NumberFormat(locale === "pt" ? "pt-BR" : "en-US", {
    style: "currency",
    currency: locale === "pt" ? "BRL" : "USD", // Assumindo USD para o locale en
  }).format(amount / 100);

  return (
    <Html>
      <Head />
      <Preview>{t.preview}</Preview>
      <Body style={emailStyles.main}>
        <Container style={emailStyles.container}>
          <Heading style={emailStyles.h1}>{t.heading}, {studentName}!</Heading>
          <Section style={emailStyles.section}>
            <Text style={emailStyles.text}>
              {t.body(formattedAmount)}
            </Text>
            <Text style={emailStyles.text}>
              {t.body2}
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

export default PaymentConfirmedEmail;

