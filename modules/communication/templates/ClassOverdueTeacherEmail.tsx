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

interface ClassOverdueTeacherEmailProps {
  teacherName: string;
  classDate: string;
}

export const ClassOverdueTeacherEmail = ({
  teacherName,
  classDate,
}: ClassOverdueTeacherEmailProps) => {
  return (
    <Html>
      <Head />
      <Preview>⚠️ Atenção: Aula não atualizada no sistema</Preview>
      <Body style={emailStyles.main}>
        <Container style={emailStyles.container}>
          <Heading style={emailStyles.h1}>Olá, {teacherName}!</Heading>
          <Section style={emailStyles.section}>
            <Text style={emailStyles.text}>
              Notamos que a sua aula do dia <strong>{classDate}</strong> ainda não foi marcada como concluída ou cancelada no sistema, mesmo após 2 horas do início previsto.
            </Text>
            <Text style={emailStyles.text}>
              Por favor, acesse o painel da Fluency Lab e atualize o status desta aula o quanto antes.
            </Text>
            <Text style={{ ...emailStyles.text, color: "#e11d48", fontWeight: "bold" }}>
              ⚠️ Atenção: Aulas não atualizadas podem resultar em inconsistências no fechamento do seu pagamento mensal.
            </Text>
            <Text style={emailStyles.text}>
              Se você teve algum problema técnico para acessar o sistema, entre em contato com o suporte ou informe ao seu gerente.
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

export default ClassOverdueTeacherEmail;
