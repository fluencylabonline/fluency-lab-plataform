import {
  Body,
  Container,
  Head,
  Heading,
  Html,
  Img,
  Preview,
  Section,
  Text,
} from "@react-email/components";
import { emailStyles } from "./email-styles";
import { format } from "date-fns";
import { ptBR, enUS } from "date-fns/locale";
import { emailTranslations } from "./translations";

interface NewInvoiceEmailProps {
  studentName: string;
  amount: number;
  dueDate: Date;
  pixPayload: string;
  pixImage: string;
  description?: string;
  locale?: "pt" | "en";
}

export const NewInvoiceEmail = ({
  studentName,
  amount,
  dueDate,
  pixPayload,
  pixImage,
  description,
  locale = "pt",
}: NewInvoiceEmailProps) => {
  const t = emailTranslations.newInvoice[locale] || emailTranslations.newInvoice.pt;

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
          <Heading style={emailStyles.h1}>{t.hello}, {studentName}!</Heading>
          <Section style={emailStyles.section}>
            <Text style={emailStyles.text}>
              {description ? (
                t.description(formattedAmount, description)
              ) : (
                t.noDescription(formattedAmount)
              )}
            </Text>
            <Text style={emailStyles.text}>
              {t.dueDateText(formattedDueDate)}
            </Text>

            {pixImage ? (
              <>
                <Section style={{ textAlign: "center", margin: "24px 0" }}>
                  <Img
                    src={pixImage}
                    alt="QR Code PIX"
                    width="200"
                    height="200"
                    style={{ margin: "0 auto", display: "block" }}
                  />
                </Section>

                <Text style={{ ...emailStyles.text, textAlign: "center", fontSize: "14px", color: "#666" }}>
                  {t.copyPasteText}
                </Text>

                <Section style={{
                  backgroundColor: "#f4f4f4",
                  padding: "16px",
                  borderRadius: "8px",
                  margin: "16px 0",
                  wordBreak: "break-all",
                  fontFamily: "monospace",
                  fontSize: "12px",
                  color: "#333",
                  border: "1px solid #ddd"
                }}>
                  {pixPayload}
                </Section>
              </>
            ) : (
              <Section style={{ textAlign: "center", margin: "24px 0" }}>
                <a
                  href={pixPayload}
                  style={{
                    display: "inline-block",
                    backgroundColor: "#7f5af0",
                    color: "#fffffe",
                    padding: "12px 24px",
                    borderRadius: "6px",
                    textDecoration: "none",
                    fontWeight: "bold",
                    fontSize: "16px",
                  }}
                >
                  {locale === "pt" ? "Pagar com Cartão de Crédito" : "Pay with Credit Card"}
                </a>
              </Section>
            )}

            <Text style={emailStyles.text}>
              {t.questions}
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

export default NewInvoiceEmail;

