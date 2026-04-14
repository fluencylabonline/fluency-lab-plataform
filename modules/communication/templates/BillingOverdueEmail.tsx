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

interface BillingOverdueEmailProps {
  studentName: string;
  amount: number;
  checkoutUrl: string;
}

export const BillingOverdueEmail = ({
  studentName,
  amount,
  checkoutUrl,
}: BillingOverdueEmailProps) => {
  const formattedAmount = new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(amount / 100);

  return (
    <Html>
      <Head />
      <Preview>⚠️ Sua mensalidade está atrasada</Preview>
      <Body style={emailStyles.main}>
        <Container style={emailStyles.container}>
          <Heading style={emailStyles.h1}>Fatura em atraso, {studentName}!</Heading>
          <Section style={emailStyles.section}>
            <Text style={emailStyles.text}>
              Notamos que o pagamento da sua mensalidade no valor de <strong>{formattedAmount}</strong> ainda não foi identificado.
            </Text>
            <Text style={emailStyles.text}>
              A sua conta poderá ser suspensa em breve se o pagamento não for regularizado. Por favor, utilize o botão abaixo para quitar seu débito agora via PIX ou Cartão:
            </Text>
            <Section style={emailStyles.buttonContainer}>
              <Button style={emailStyles.button} href={checkoutUrl}>
                Regularizar Pagamento
              </Button>
            </Section>
            <Text style={emailStyles.text}>
              Caso já tenha realizado o pagamento, favor ignorar este e-mail. A compensação do boleto ou cartão pode levar até 48h (PIX é instantâneo).
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

export default BillingOverdueEmail;
