import {
  Body,
  Container,
  Head,
  Heading,
  Html,
  Preview,
  Section,
  Text,
  Button,
} from "@react-email/components";
import { emailStyles } from "./email-styles";

interface ClassCancelledWithConvertEmailProps {
  teacherName: string;
  studentName: string;
  classDate: string;
  classTime: string;
  convertUrl: string;
}

export const ClassCancelledWithConvertEmail = ({
  teacherName,
  studentName,
  classDate,
  classTime,
  convertUrl,
}: ClassCancelledWithConvertEmailProps) => {
  return (
    <Html>
      <Head />
      <Preview>Aviso: O aluno {studentName} cancelou a aula de {classDate}</Preview>
      <Body style={emailStyles.main}>
        <Container style={emailStyles.container}>
          <Heading style={emailStyles.h1}>Olá, {teacherName}!</Heading>
          <Section style={emailStyles.section}>
            <Text style={emailStyles.text}>
              O aluno <strong>{studentName}</strong> cancelou a aula agendada para o dia <strong>{classDate}</strong> às <strong>{classTime}</strong>.
            </Text>
            <Text style={emailStyles.text}>
              Como o cancelamento foi feito pelo aluno, você pode optar por disponibilizar este horário para outros alunos (Aula de Reposição) ou simplesmente manter o horário livre.
            </Text>
            
            <Section style={emailStyles.buttonContainer}>
              <Button style={emailStyles.button} href={convertUrl}>
                Disponibilizar Horário
              </Button>
            </Section>

            <Text style={emailStyles.text}>
              Ao clicar no botão acima, você será direcionado para uma página onde poderá confirmar a abertura deste horário em sua agenda como &quot;Disponível&quot;.
            </Text>
            
            <Text style={{ ...emailStyles.text, color: "#666", fontSize: "14px" }}>
              Caso você não queira disponibilizar o horário, nenhuma ação é necessária.
            </Text>
          </Section>
          <Text style={emailStyles.footer}>
            Equipe Fluency Lab
          </Text>
        </Container>
      </Body>
    </Html>
  );
};

export default ClassCancelledWithConvertEmail;
