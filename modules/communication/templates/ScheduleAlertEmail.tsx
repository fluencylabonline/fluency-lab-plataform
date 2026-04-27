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

interface ScheduleAlertEmailProps {
  teacherName: string;
  message: string;
}

export const ScheduleAlertEmail = ({
  teacherName,
  message,
}: ScheduleAlertEmailProps) => (
  <Html>
    <Head />
    <Preview>Alerta de Agenda - Fluency Lab</Preview>
    <Body style={emailStyles.main}>
      <Container style={emailStyles.container}>
        <Section style={emailStyles.section}>
          <Heading style={emailStyles.h1}>Olá, {teacherName}!</Heading>
          <Text style={emailStyles.text}>
            Gostaríamos de informar sobre uma atualização na sua agenda de aulas:
          </Text>
          <Section style={emailStyles.highlightSection}>
            <Text style={emailStyles.highlightText}>{message}</Text>
          </Section>
          <Text style={emailStyles.text}>
            Você pode conferir os detalhes no seu painel do professor.
          </Text>
        </Section>
        <Text style={emailStyles.footer}>
          Fluency Lab — Educação Personalizada
        </Text>
      </Container>
    </Body>
  </Html>
);

export default ScheduleAlertEmail;
