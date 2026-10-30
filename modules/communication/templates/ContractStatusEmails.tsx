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
import { env } from "@/env/client";

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
export const ContractRenewedEmail: React.FC<ContractStatusEmailProps & {
  isAuto: boolean;
  locale?: "pt" | "en";
  changedContractUrl?: string | null;
}> = ({ name, contractName, isAuto, locale = "pt", changedContractUrl }) => (
  <Html>
    <Head />
    <Body style={emailStyles.main}>
      <Container style={emailStyles.container}>
        <Section style={emailStyles.header}>
          <Img src={"https://raw.githubusercontent.com/devmatheusfernandes/fluencylab-school/refs/heads/main/public/brand/Logo.png"} alt="Fluency Lab" style={emailStyles.logo} />
        </Section>
        {locale === "en" ? (
          <>
            <Heading style={emailStyles.heading}>Agreement Renewed! 🚀</Heading>
            <Text style={emailStyles.paragraph}>Hi, <strong>{name}</strong>!</Text>
            <Text style={emailStyles.paragraph}>Your agreement <strong>{contractName}</strong> has been successfully renewed{isAuto ? " automatically" : ""}.</Text>
            {changedContractUrl && (
              <>
                <Text style={emailStyles.paragraph}>
                  <strong>Important:</strong> this renewal uses the latest version of the agreement, which includes changes from the version you previously signed. Please review the updated terms on the platform.
                </Text>
                <Section style={emailStyles.buttonSection}>
                  <EmailButton href={changedContractUrl}>View Agreement</EmailButton>
                </Section>
              </>
            )}
            <Text style={emailStyles.paragraph}>We wish you great classes and lots of progress on your fluency journey!</Text>
          </>
        ) : (
          <>
            <Heading style={emailStyles.heading}>Contrato Renovado! 🚀</Heading>
            <Text style={emailStyles.paragraph}>Olá, <strong>{name}</strong>!</Text>
            <Text style={emailStyles.paragraph}>O contrato <strong>{contractName}</strong> foi renovado com sucesso{isAuto ? " automaticamente" : ""}.</Text>
            {changedContractUrl && (
              <>
                <Text style={emailStyles.paragraph}>
                  <strong>Atenção:</strong> esta renovação usa a versão mais recente do contrato, que teve mudanças em relação à versão que você assinou anteriormente. Confira os termos atualizados na plataforma.
                </Text>
                <Section style={emailStyles.buttonSection}>
                  <EmailButton href={changedContractUrl}>Ver Contrato</EmailButton>
                </Section>
              </>
            )}
            <Text style={emailStyles.paragraph}>Desejamos ótimas aulas e muito progresso em sua jornada de fluência!</Text>
          </>
        )}
      </Container>
    </Body>
  </Html>
);

// 4. Plan Price Adjustment Email (Global Reajuste)
interface PlanPriceAdjustmentEmailProps {
  name: string;
  planName: string;
  newAmount: number;
}

export const PlanPriceAdjustmentEmail: React.FC<PlanPriceAdjustmentEmailProps> = ({ name, planName, newAmount }) => {
  const formattedAmount = new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(newAmount / 100);

  return (
    <Html>
      <Head />
      <Body style={emailStyles.main}>
        <Container style={emailStyles.container}>
          <Section style={emailStyles.header}>
            <Img src={"https://raw.githubusercontent.com/devmatheusfernandes/fluencylab-school/refs/heads/main/public/brand/Logo.png"} alt="Fluency Lab" style={emailStyles.logo} />
          </Section>
          <Heading style={emailStyles.heading}>Aviso de Reajuste de Mensalidade 🖋️</Heading>
          <Text style={emailStyles.paragraph}>Olá, <strong>{name}</strong>!</Text>
          <Text style={emailStyles.paragraph}>
            Gostaríamos de comunicar que o valor do seu plano de estudos <strong>{planName}</strong> foi reajustado para <strong>{formattedAmount}</strong> por mês.
          </Text>
          <Text style={emailStyles.paragraph}>
            Este ajuste está previsto em seu contrato de prestação de serviços e será aplicado automaticamente às suas próximas mensalidades pendentes.
          </Text>
          <Text style={emailStyles.paragraph}>
            Agradecemos a sua parceria contínua e seguimos dedicados a entregar a melhor experiência na sua jornada rumo à fluência!
          </Text>
        </Container>
      </Body>
    </Html>
  );
};

// 5. Plan Changed Email (Individual Transfer)
interface PlanChangedEmailProps {
  name: string;
  oldPlanName: string;
  newPlanName: string;
  newAmount: number;
  classesPerWeek: number;
}

export const PlanChangedEmail: React.FC<PlanChangedEmailProps> = ({ name, newPlanName, newAmount, classesPerWeek }) => {
  const formattedAmount = new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(newAmount / 100);

  return (
    <Html>
      <Head />
      <Body style={emailStyles.main}>
        <Container style={emailStyles.container}>
          <Section style={emailStyles.header}>
            <Img src={"https://raw.githubusercontent.com/devmatheusfernandes/fluencylab-school/refs/heads/main/public/brand/Logo.png"} alt="Fluency Lab" style={emailStyles.logo} />
          </Section>
          <Heading style={emailStyles.heading}>Seu Plano de Estudos foi Atualizado! 🚀</Heading>
          <Text style={emailStyles.paragraph}>Olá, <strong>{name}</strong>!</Text>
          <Text style={emailStyles.paragraph}>
            Informamos que o seu plano de estudos foi atualizado com sucesso no nosso sistema pelo administrador.
          </Text>
          <Text style={emailStyles.paragraph}>
            <strong>Novas Condições:</strong>
          </Text>
          <ul style={{ color: "#333", fontSize: "14px", lineHeight: "24px" }}>
            <li><strong>Novo Plano:</strong> {newPlanName}</li>
            <li><strong>Nova Mensalidade:</strong> {formattedAmount}</li>
            <li><strong>Frequência de Aulas:</strong> {classesPerWeek}x por semana</li>
          </ul>
          <Text style={emailStyles.paragraph}>
            Essas novas condições serão válidas para todas as suas parcelas futuras. Além disso, informamos que **este mesmo plano e valor serão mantidos automaticamente quando o seu contrato for renovado** ao final da vigência atual.
          </Text>
          <Text style={emailStyles.paragraph}>
            Desejamos ótimas aulas e muito progresso nos seus estudos!
          </Text>
        </Container>
      </Body>
    </Html>
  );
};
