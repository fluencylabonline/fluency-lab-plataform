import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Html,
  Preview,
  Section,
  Text,
} from "@react-email/components";
import { emailStyles } from "./email-styles";

/**
 * Email de aviso genérico: título, parágrafos, um destaque opcional e um
 * botão opcional. Usado pelos avisos da política de inadimplência, cujos
 * textos vivem em `delinquency-translations.ts`.
 */
export interface NoticeEmailContent {
  subject: string;
  preview: string;
  heading: string;
  paragraphs: string[];
  highlight?: string[];
  button?: { label: string; url: string };
  footer: string;
}

export const NoticeEmail = ({ preview, heading, paragraphs, highlight, button, footer }: NoticeEmailContent) => (
  <Html>
    <Head />
    <Preview>{preview}</Preview>
    <Body style={emailStyles.main}>
      <Container style={emailStyles.container}>
        <Heading style={emailStyles.h1}>{heading}</Heading>
        <Section style={emailStyles.section}>
          {paragraphs.map((p, i) => (
            <Text key={i} style={emailStyles.text}>
              {p}
            </Text>
          ))}
          {highlight && highlight.length > 0 && (
            <Section style={emailStyles.highlightSection}>
              {highlight.map((line, i) => (
                <Text key={i} style={{ ...emailStyles.highlightText, fontStyle: "normal", margin: "4px 0" }}>
                  {line}
                </Text>
              ))}
            </Section>
          )}
          {button && (
            <Section style={emailStyles.buttonContainer}>
              <Button style={emailStyles.button} href={button.url}>
                {button.label}
              </Button>
            </Section>
          )}
        </Section>
        <Text style={emailStyles.footer}>{footer}</Text>
      </Container>
    </Body>
  </Html>
);

export default NoticeEmail;
