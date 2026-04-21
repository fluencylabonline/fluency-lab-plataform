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

interface ContractStatusEmailProps {
  name: string;
  contractName: string;
}

// 1. Cancelled Email
export const ContractCancelledEmail: React.FC<ContractStatusEmailProps> = ({ name, contractName }) => (
  <Html>
    <Head />
    <Body style={emailStyles.main}>
      <Container style={emailStyles.container}>
        <Section style={emailStyles.header}>
          <Img src={"https://raw.githubusercontent.com/devmatheusfernandes/fluencylab-school/refs/heads/main/public/brand/Logo.png"} alt="Fluency Lab" style={emailStyles.logo} />
        </Section>
        <Heading style={emailStyles.heading}>Contrato Cancelado 🛡️</Heading>
        <Text style={emailStyles.paragraph}>Olá, <strong>{name}</strong>!</Text>
        <Text style={emailStyles.paragraph}>O contrato <strong>{contractName}</strong> foi cancelado conforme solicitado e após a confirmação do pagamento da taxa correspondente.</Text>
        <Text style={emailStyles.paragraph}>Sentiremos sua falta! Se precisar de algo, nossa equipe está à disposição.</Text>
      </Container>
    </Body>
  </Html>
);

// 2. Expiring Email
export const ContractExpiringEmail: React.FC<ContractStatusEmailProps & { daysLeft: number }> = ({ name, contractName, daysLeft }) => (
  <Html>
    <Head />
    <Body style={emailStyles.main}>
      <Container style={emailStyles.container}>
        <Section style={emailStyles.header}>
          <Img src={"https://raw.githubusercontent.com/devmatheusfernandes/fluencylab-school/refs/heads/main/public/brand/Logo.png"} alt="Fluency Lab" style={emailStyles.logo} />
        </Section>
        <Heading style={emailStyles.heading}>Seu contrato vence em breve! ⏳</Heading>
        <Text style={emailStyles.paragraph}>Olá, <strong>{name}</strong>!</Text>
        <Text style={emailStyles.paragraph}>O contrato <strong>{contractName}</strong> vencerá em <strong>{daysLeft} dias</strong>.</Text>
        <Text style={emailStyles.paragraph}>Fique tranquilo(a): se a renovação automática estiver ativa, o processo será feito sem interrupções em suas aulas.</Text>
        <Section style={emailStyles.buttonSection}>
          <EmailButton href={`${env.NEXT_PUBLIC_APP_URL}/student`}>Ver Meus Contratos</EmailButton>
        </Section>
      </Container>
    </Body>
  </Html>
);

// 3. Renewed Email
export const ContractRenewedEmail: React.FC<ContractStatusEmailProps & { isAuto: boolean }> = ({ name, contractName, isAuto }) => (
  <Html>
    <Head />
    <Body style={emailStyles.main}>
      <Container style={emailStyles.container}>
        <Section style={emailStyles.header}>
          <Img src={"https://raw.githubusercontent.com/devmatheusfernandes/fluencylab-school/refs/heads/main/public/brand/Logo.png"} alt="Fluency Lab" style={emailStyles.logo} />
        </Section>
        <Heading style={emailStyles.heading}>Contrato Renovado! 🚀</Heading>
        <Text style={emailStyles.paragraph}>Olá, <strong>{name}</strong>!</Text>
        <Text style={emailStyles.paragraph}>O contrato <strong>{contractName}</strong> foi renovado com sucesso{isAuto ? " automaticamente" : ""}.</Text>
        <Text style={emailStyles.paragraph}>Desejamos ótimas aulas e muito progresso em sua jornada de fluência!</Text>
      </Container>
    </Body>
  </Html>
);
