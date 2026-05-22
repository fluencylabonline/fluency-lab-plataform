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
import { emailTranslations } from "./translations";

interface WelcomeEmailProps {
  name: string;
  actionLink: string;
  studentInfo?: string;
  locale?: "pt" | "en";
}

export const WelcomeEmail: React.FC<WelcomeEmailProps> = ({
  name,
  actionLink,
  studentInfo,
  locale = "pt",
}) => {
  const t = emailTranslations.welcome[locale] || emailTranslations.welcome.pt;

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

          <Heading style={emailStyles.heading}>{t.heading}</Heading>

          <Text style={emailStyles.paragraph}>
            {locale === "pt" ? "Olá" : "Hello"}, <strong>{name}</strong>!
          </Text>
          <Text style={emailStyles.paragraph}>
            {studentInfo
              ? t.studentInfo(name)
              : t.success}
          </Text>

          <Text style={emailStyles.paragraph}>
            {t.instruction}
          </Text>

          <Section style={emailStyles.buttonSection}>
            <EmailButton href={actionLink}>{t.button}</EmailButton>
          </Section>
        </Container>
      </Body>
    </Html>
  );
};

