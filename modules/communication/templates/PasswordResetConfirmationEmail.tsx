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
  Hr,
} from "@react-email/components";
import { emailStyles } from "./email-styles";
import { emailTranslations } from "./translations";

interface PasswordResetConfirmationEmailProps {
  name: string;
  locale?: "pt" | "en";
}

export const PasswordResetConfirmationEmail: React.FC<PasswordResetConfirmationEmailProps> = ({
  name,
  locale = "pt",
}) => {
  const t = emailTranslations.passwordResetConfirmation[locale] || emailTranslations.passwordResetConfirmation.pt;

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
            {t.body}
          </Text>
          <Text style={emailStyles.paragraph}>
            {t.instruction}
          </Text>

          <Hr style={emailStyles.hr} />

          <Section style={emailStyles.highlightSection}>
            <Text style={emailStyles.highlightText}>
              <strong>{locale === "pt" ? "Atenção:" : "Warning:"}</strong> {t.warning}
            </Text>
          </Section>

          <Text style={emailStyles.paragraph}>
            {t.footer.split("\n").map((line, i) => (
              <React.Fragment key={i}>
                {line}
                <br />
              </React.Fragment>
            ))}
          </Text>
        </Container>
      </Body>
    </Html>
  );
};
