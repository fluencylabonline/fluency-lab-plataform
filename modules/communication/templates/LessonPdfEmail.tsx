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
import { emailStyles } from "./email-styles";

interface LessonPdfEmailProps {
  name: string;
  lessonTitle: string;
}

export const LessonPdfEmail = ({ name, lessonTitle }: LessonPdfEmailProps) => {
  return (
    <Html>
      <Head />
      <Preview>Sua lição em PDF: {lessonTitle}</Preview>
      <Body style={emailStyles.main}>
        <Container style={emailStyles.container}>
          <Heading style={emailStyles.h1}>Olá{name ? `, ${name}` : ""}! 📄</Heading>
          <Section style={emailStyles.section}>
            <Text style={emailStyles.text}>
              Como você pediu, a lição abaixo está anexada a este e-mail em PDF. Você pode imprimir ou estudar de qualquer lugar.
            </Text>
            <Section style={emailStyles.highlightSection}>
              <Text style={emailStyles.highlightText}>{lessonTitle}</Text>
            </Section>
            <Text style={{ ...emailStyles.text, color: "#666", fontSize: "14px" }}>
              O PDF traz o conteúdo, os exercícios e o gabarito no final. Bons estudos!
            </Text>
          </Section>
          <Text style={emailStyles.footer}>Equipe Fluency Lab</Text>
        </Container>
      </Body>
    </Html>
  );
};

export default LessonPdfEmail;
