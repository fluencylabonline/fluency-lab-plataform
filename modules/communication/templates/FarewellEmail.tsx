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
import { emailTranslations } from "./translations";

interface FarewellEmailProps {
  name: string;
  locale?: "pt" | "en";
}

export const FarewellEmail: React.FC<FarewellEmailProps> = ({
  name,
  locale = "pt",
}) => {
  const t = emailTranslations.farewell[locale] || emailTranslations.farewell.pt;

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

          <Heading style={emailStyles.heading}>{t.heading}</Heading>

          <Text style={emailStyles.paragraph}>
            {locale === "pt" ? "Olá" : "Hello"}, <strong>{name}</strong>!
          </Text>
          <Text style={emailStyles.paragraph}>
            {t.body1}
          </Text>
          <Text style={emailStyles.paragraph}>
            {t.body2}
          </Text>
          <Text style={emailStyles.paragraph}>
            {t.body3}
          </Text>

          <Text style={emailStyles.footer}>
            {t.footer.split("\n").map((line, idx) => (
              <React.Fragment key={idx}>
                {line}
                {idx < t.footer.split("\n").length - 1 && <br />}
              </React.Fragment>
            ))}
          </Text>
        </Container>
      </Body>
    </Html>
  );
};

