import {
  Body,
  Container,
  Head,
  Heading,
  Html,
  Preview,
  Section,
  Text,
  Hr,
} from "@react-email/components";
import { emailStyles } from "./email-styles";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface TeacherPayoutEmailProps {
  teacherName: string;
  month: number;
  year: number;
  amount: number;
  classes: Array<{
    date: Date;
    studentName: string;
    rate: number;
    status: string;
  }>;
}

export const TeacherPayoutEmail = ({
  teacherName,
  month,
  year,
  amount,
  classes,
}: TeacherPayoutEmailProps) => {
  const formattedTotal = new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(amount / 100);

  return (
    <Html>
      <Head />
      <Preview>{`Seu pagamento de ${month}/${year} foi processado! 💸`}</Preview>
      <Body style={emailStyles.main}>
        <Container style={emailStyles.container}>
          <Heading style={emailStyles.h1}>Olá, {teacherName}!</Heading>
          <Section style={emailStyles.section}>
            <Text style={emailStyles.text}>
              Seu pagamento referente ao período de <strong>{month}/{year}</strong> foi processado com sucesso via AbacatePay.
            </Text>
            <Text style={emailStyles.text}>
              Valor Total: <strong>{formattedTotal}</strong>
            </Text>
          </Section>

          <Hr style={emailStyles.hr} />

          <Heading style={emailStyles.h2}>Relatório de Aulas</Heading>
          <Section style={emailStyles.section}>
            {classes.map((cls, index) => (
              <div key={index} style={{ marginBottom: "12px", fontSize: "14px" }}>
                <Text style={{ margin: "0", fontWeight: "bold" }}>
                  {format(cls.date, "dd/MM/yyyy HH:mm", { locale: ptBR })} - {cls.studentName}
                </Text>
                <Text style={{ margin: "0", color: "#666" }}>
                  Valor: {new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(cls.rate / 100)} ({cls.status})
                </Text>
              </div>
            ))}
          </Section>

          <Hr style={emailStyles.hr} />

          <Text style={emailStyles.text}>
            O valor deve cair na sua chave PIX cadastrada em breve. Em caso de dúvidas, entre em contato com o financeiro.
          </Text>
          
          <Text style={emailStyles.footer}>
            Equipe Fluency Lab
          </Text>
        </Container>
      </Body>
    </Html>
  );
};

export default TeacherPayoutEmail;
