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
import { emailStyles } from "./email-styles";

interface FarewellEmailProps {
  name: string;
}

export const FarewellEmail: React.FC<FarewellEmailProps> = ({ name }) => {
  return (
    <Html>
      <Head />
      <Body style={emailStyles.main}>
        <Container style={emailStyles.container}>
          <Section style={emailStyles.header}>
            <Img
              src="https://raw.githubusercontent.com/devmatheusfernandes/fluencylab-school/refs/heads/main/public/brand/Logo.png"
              alt="Fluency Lab"
              style={emailStyles.logo}
            />
          </Section>

          <Heading style={emailStyles.heading}>Sentiremos sua falta! 👋</Heading>

          <Text style={emailStyles.paragraph}>
            Olá, <strong>{name}</strong>!
          </Text>
          <Text style={emailStyles.paragraph}>
            Confirmamos o cancelamento da sua conta na Fluency Lab conforme solicitado.
          </Text>
          <Text style={emailStyles.paragraph}>
            Foi um prazer ter você conosco durante essa jornada. Lembre-se que as portas estarão sempre abertas caso decida voltar a estudar conosco no futuro.
          </Text>
          <Text style={emailStyles.paragraph}>
            Desejamos muito sucesso em seus próximos passos!
          </Text>

          <Text style={emailStyles.footer}>
            Abraços,<br />
            Equipe Fluency Lab
          </Text>
        </Container>
      </Body>
    </Html>
  );
};
