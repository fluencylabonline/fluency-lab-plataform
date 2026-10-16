"use client";

import { useStudentCallListener } from "@/hooks/data/use-student-call-listener";

/**
 * Casca do listener de chamadas do aluno. Existe só para ser carregada sob
 * demanda pelo GlobalVideoCall: assim o Firestore não entra no bundle de quem
 * não é aluno (nem das páginas públicas).
 */
export default function StudentCallListener({ userId }: { userId: string }) {
  useStudentCallListener(userId, true);
  return null;
}
