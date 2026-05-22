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
import { emailTranslations } from "./translations";

interface BillingOverdueEmailProps {
  studentName: string;
  amount: number;
  checkoutUrl: string;
  locale?: "pt" | "en";
}

export const BillingOverdueEmail = ({
  studentName,
  amount,
  checkoutUrl,
  locale = "pt",
}: BillingOverdueEmailProps) => {
  const t = emailTranslations.billingOverdue[locale] || emailTranslations.billingOverdue.pt;

  const formattedAmount = new Intl.NumberFormat(locale === "pt" ? "pt-BR" : "en-US", {
    style: "currency",
    currency: locale === "pt" ? "BRL" : "USD",
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

export default BillingOverdueEmail;

