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
import * as React from "react";
import { emailStyles } from "./email-styles";

interface PaymentConfirmedEmailProps {
  studentName: string;
  amount: number;
}

export const PaymentConfirmedEmail = ({
  studentName,
  amount,
}: PaymentConfirmedEmailProps) => {
  const formattedAmount = new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(amount / 100);

  return (
    <Html>
      <Head />
      <Preview>Pagamento confirmado! 🚀</Preview>
      <Body style={emailStyles.main}>
        <Container style={emailStyles.container}>
          <Heading style={emailStyles.h1}>Olá, {studentName}!</Heading>
          <Section style={emailStyles.section}>
            <Text style={emailStyles.text}>
              Ótimas notícias! Seu pagamento de <strong>{formattedAmount}</strong> foi recebido com sucesso.
            </Text>
            <Text style={emailStyles.text}>
              Sua assinatura continua ativa e você pode continuar focando nos seus estudos.
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

export default PaymentConfirmedEmail;
