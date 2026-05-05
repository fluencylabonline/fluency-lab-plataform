import * as React from "react";
import {
  Body,
  Container,
  Head,
  Heading,
  Html,
  Preview,
  Section,
  Text,
  Link,
} from "@react-email/components";
import { emailStyles } from "./email-styles";

interface CertificateEmailProps {
  name: string;
  courseLanguage: string;
  verifyUrl: string;
}

export const CertificateEmail = ({
  name,
  courseLanguage,
  verifyUrl,
}: CertificateEmailProps) => {
  return (
    <Html>
      <Head />
      <Preview>Seu certificado de {courseLanguage} chegou! 🎓</Preview>
      <Body style={emailStyles.main}>
        <Container style={emailStyles.container}>
          <Section style={emailStyles.section}>
            <Heading style={emailStyles.heading}>Parabéns, {name}! 🎓</Heading>
            <Text style={emailStyles.text}>
              É com muita alegria que entregamos o seu certificado de conclusão do curso de <strong>{courseLanguage}</strong> na Fluency Lab.
            </Text>
            <Text style={emailStyles.text}>
              Sua dedicação e esforço valeram a pena. O certificado está em anexo neste e-mail.
            </Text>
            <Section style={{ textAlign: "center" as const, margin: "32px 0" }}>
              <Link href={verifyUrl} style={emailStyles.button}>
                Verificar Autenticidade
              </Link>
            </Section>
            <Text style={emailStyles.text}>
              Continue sua jornada de aprendizado conosco!
            </Text>
            <Text style={emailStyles.footer}>
              Equipe Fluency Lab
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
};

export default CertificateEmail;
