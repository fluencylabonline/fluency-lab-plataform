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
import { ptBR } from "date-fns/locale";

interface NewInvoiceEmailProps {
  studentName: string;
  amount: number;
  dueDate: Date;
  pixPayload: string;
  pixImage: string;
  description?: string;
}

export const NewInvoiceEmail = ({
  studentName,
  amount,
  dueDate,
  pixPayload,
  pixImage,
  description,
}: NewInvoiceEmailProps) => {
  const formattedAmount = new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(amount / 100);

  const formattedDueDate = format(dueDate, "dd 'de' MMMM", { locale: ptBR });

  return (
    <Html>
      <Head />
      <Preview>Sua fatura está disponível! 📄</Preview>
      <Body style={emailStyles.main}>
        <Container style={emailStyles.container}>
          <Heading style={emailStyles.h1}>Olá, {studentName}!</Heading>
          <Section style={emailStyles.section}>
            <Text style={emailStyles.text}>
              {description ? (
                <>Uma nova cobrança no valor de <strong>{formattedAmount}</strong> foi gerada referente a: <strong>{description}</strong>.</>
              ) : (
                <>Sua próxima mensalidade no valor de <strong>{formattedAmount}</strong> já está disponível.</>
              )}
            </Text>
            <Text style={emailStyles.text}>
              O vencimento é dia <strong>{formattedDueDate}</strong>. Você pode realizar o pagamento via PIX utilizando o QR Code abaixo:
            </Text>

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
              Ou utilize o código Copia e Cola abaixo:
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

            <Text style={emailStyles.text}>
              Se tiver qualquer dúvida, estamos à disposição.
            </Text>
          </Section>
          <Text style={emailStyles.footer}>
            Equipe Fluency Lab
          </Text>
        </Container>
      </Body>
    </Html>
  );
};

export default NewInvoiceEmail;
