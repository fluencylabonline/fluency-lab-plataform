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
import * as React from "react";
import { emailStyles } from "./email-styles";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface NewInvoiceEmailProps {
  studentName: string;
  amount: number;
  dueDate: Date;
  checkoutUrl: string;
}

export const NewInvoiceEmail = ({
  studentName,
  amount,
  dueDate,
  checkoutUrl,
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
              Sua próxima mensalidade no valor de <strong>{formattedAmount}</strong> já está disponível.
            </Text>
            <Text style={emailStyles.text}>
              O vencimento é dia <strong>{formattedDueDate}</strong>. Você pode realizar o pagamento via PIX ou Cartão clicando no botão abaixo:
            </Text>
            <Section style={emailStyles.buttonContainer}>
              <Button style={emailStyles.button} href={checkoutUrl}>
                Pagar Mensalidade
              </Button>
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
