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
import { ptBR } from "date-fns/locale";

interface BillingReminderEmailProps {
  studentName: string;
  amount: number;
  dueDate: Date;
  checkoutUrl: string;
}

export const BillingReminderEmail = ({
  studentName,
  amount,
  dueDate,
  checkoutUrl,
}: BillingReminderEmailProps) => {
  const formattedAmount = new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(amount / 100);

  const formattedDueDate = format(dueDate, "dd 'de' MMMM", { locale: ptBR });

  return (
    <Html>
      <Head />
      <Preview>Lembrete: Sua mensalidade vence em 2 dias! ⏳</Preview>
      <Body style={emailStyles.main}>
        <Container style={emailStyles.container}>
          <Heading style={emailStyles.h1}>Falta pouco, {studentName}!</Heading>
          <Section style={emailStyles.section}>
            <Text style={emailStyles.text}>
              Passando para lembrar que sua mensalidade no valor de <strong>{formattedAmount}</strong> vence daqui a 2 dias (<strong>{formattedDueDate}</strong>).
            </Text>
            <Text style={emailStyles.text}>
              Para evitar qualquer interrupção ou cobrança de multa, você já pode realizar o pagamento clicando no botão abaixo:
            </Text>
            <Section style={emailStyles.buttonContainer}>
              <Button style={emailStyles.button} href={checkoutUrl}>
                Pagar Agora
              </Button>
            </Section>
            <Text style={emailStyles.text}>
              Se você já realizou o pagamento, por favor desconsidere este aviso.
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

export default BillingReminderEmail;
