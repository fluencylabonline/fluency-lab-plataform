import { z } from "zod";

export const issueCertificateSchema = z.object({
  studentId: z.string(),
  language: z.string(),
  message: z.string().optional(),
  issuedAt: z.string().optional(), // ISO string
});

export type IssueCertificateValues = z.infer<typeof issueCertificateSchema>;

export type CertificateData = {
  studentName: string;
  studentEmail: string;
  courseLanguage: string;
  totalHours: number;
  levelCode: string;
  levelLabel: string;
  levelDescription: string;
  startDate: Date | null;
  endDate: Date | null;
};
