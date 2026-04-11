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

interface ResendInviteEmailProps {
  name: string;
  actionLink: string;
}

export const ResendInviteEmail: React.FC<ResendInviteEmailProps> = ({
  name,
  actionLink,
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

          <Heading style={emailStyles.heading}>Novo link de acesso disponível! 🚀</Heading>

          <Text style={emailStyles.paragraph}>
            Olá, <strong>{name}</strong>!
          </Text>
          <Text style={emailStyles.paragraph}>
            Conforme solicitado, estamos enviando um novo link para você definir sua senha e acessar sua conta na Fluency Lab.
          </Text>

          <Text style={emailStyles.paragraph}>
            Este link é temporário. Clique no botão abaixo para criar sua senha:
          </Text>

          <Section style={emailStyles.buttonSection}>
            <EmailButton href={actionLink}>Definir Minha Senha</EmailButton>
          </Section>

          <Text style={emailStyles.footerParagraph}>
            Se você não solicitou este link, pode ignorar este e-mail com segurança.
          </Text>
        </Container>
      </Body>
    </Html>
  );
};
