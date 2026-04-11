import * as React from "react";
import {
  Html,
  Head,
  Body,
  Container,
  Heading,
  Text,
  Section,
  Img,
} from "@react-email/components";
import { EmailButton } from "./components/EmailButton";
import { emailStyles } from "./email-styles";

interface WelcomeEmailProps {
  name: string;
  actionLink: string;
  studentInfo?: string;
}

export const WelcomeEmail: React.FC<WelcomeEmailProps> = ({
  name,
  actionLink,
  studentInfo,
}) => {
  return (
    <Html>
      <Head />
      <Body style={emailStyles.main}>
        <Container style={emailStyles.container}>
          <Section style={emailStyles.header}>
            <Img
              src={
                "https://raw.githubusercontent.com/devmatheusfernandes/fluencylab-school/refs/heads/main/public/brand/Logo.png"
              }
              alt="Fluency Lab"
              style={emailStyles.logo}
            />
          </Section>

          <Heading style={emailStyles.heading}>Bem-vindo(a) à Fluency Lab! 🎉</Heading>

          <Text style={emailStyles.paragraph}>
            Olá, <strong>{name}</strong>!
          </Text>
          <Text style={emailStyles.paragraph}>
            {studentInfo
              ? `Uma conta foi criada para o aluno(a) ${name}. Você já pode acessar a plataforma para gerenciar as aulas.`
              : `Sua conta foi criada com sucesso! Estamos muito felizes em ter você conosco.`}
          </Text>

          <Text style={emailStyles.paragraph}>
            Para começar, defina sua senha segura clicando abaixo:
          </Text>

          <Section style={emailStyles.buttonSection}>
            <EmailButton href={actionLink}>Definir Minha Senha</EmailButton>
          </Section>
        </Container>
      </Body>
    </Html>
  );
};
