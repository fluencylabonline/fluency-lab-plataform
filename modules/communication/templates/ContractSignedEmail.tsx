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
import { env } from "@/env";

interface ContractSignedEmailProps {
  name: string;
  contractName: string;
}

export const ContractSignedEmail: React.FC<ContractSignedEmailProps> = ({
  name,
  contractName,
}) => {
  const dashboardLink = `${env.NEXT_PUBLIC_APP_URL}/student`;

  return (
    <Html>
      <Head />
      <Body style={emailStyles.main}>
        <Container style={emailStyles.container}>
          <Section style={emailStyles.header}>
            <Img
              src={"https://raw.githubusercontent.com/devmatheusfernandes/fluencylab-school/refs/heads/main/public/brand/Logo.png"}
              alt="Fluency Lab"
              style={emailStyles.logo}
            />
          </Section>

          <Heading style={emailStyles.heading}>Contrato Assinado com Sucesso! 🖋️</Heading>

          <Text style={emailStyles.paragraph}>
            Olá, <strong>{name}</strong>!
          </Text>
          <Text style={emailStyles.paragraph}>
            Confirmamos a assinatura do contrato: <strong>{contractName}</strong>. 
            Uma cópia em PDF foi anexada a este e-mail para seus arquivos.
          </Text>

          <Text style={emailStyles.paragraph}>
            Você também pode visualizar seus contratos ativos a qualquer momento em seu painel:
          </Text>

          <Section style={emailStyles.buttonSection}>
            <EmailButton href={dashboardLink}>Acessar Meu Painel</EmailButton>
          </Section>
        </Container>
      </Body>
    </Html>
  );
};
