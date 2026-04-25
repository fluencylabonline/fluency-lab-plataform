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

interface BillingDueDateEmailProps {
  studentName: string;
  amount: number;
  checkoutUrl: string;
}

export const BillingDueDateEmail = ({
  studentName,
  amount,
  checkoutUrl,
}: BillingDueDateEmailProps) => {
  const formattedAmount = new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(amount / 100);

  return (
    <Html>
      <Head />
      <Preview>Atenção: Sua mensalidade vence hoje! 📅</Preview>
      <Body style={emailStyles.main}>
        <Container style={emailStyles.container}>
          <Heading style={emailStyles.h1}>Dia de vencimento, {studentName}!</Heading>
          <Section style={emailStyles.section}>
            <Text style={emailStyles.text}>
              Sua mensalidade no valor de <strong>{formattedAmount}</strong> vence hoje.
            </Text>
            <Text style={emailStyles.text}>
              Para garantir que seu acesso às aulas continue ativo sem interrupções, realize o pagamento agora clicando no botão abaixo:
            </Text>
            <Section style={emailStyles.buttonContainer}>
              <Button style={emailStyles.button} href={checkoutUrl}>
                Pagar Agora
              </Button>
            </Section>
            <Text style={emailStyles.text}>
              O acesso imediato é garantido após a confirmação do pagamento via PIX.
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

export default BillingDueDateEmail;
