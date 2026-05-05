import { certificateRepository } from "./certificate.repository";
import { schedulingRepository } from "../scheduling/scheduling.repository";
import { placementRepository } from "../placement/placement.repository";
import { userRepository } from "../user/user.repository";
import { BADGES_CONFIG } from "@/lib/badges-config";
import { CertificateData, IssueCertificateValues } from "./certificate.types";

export const certificateService = {
  async generateCertificateData(studentId: string, language: string): Promise<CertificateData> {
    const student = await userRepository.findById(studentId);
    if (!student) throw new Error("Student not found");

    // 1. Calculate hours from completed classes
    const completedClasses = await schedulingRepository.findCompletedByStudent(studentId);
    const totalHours = completedClasses.length; // 1 hour per class
    const lastClassDate = completedClasses.length > 0 ? completedClasses[0].startAt : null;

    // 2. Get current level from placement tests
    // We might need to map language string to languageId if needed, 
    // but typically we can search for the last completed test.
    const lastTest = await placementRepository.getLastCompletedTest(studentId);
    
    let levelCode = "A1";
    let levelLabel = "Beginner";
    let levelDescription = "";

    if (lastTest) {
      // Logic to determine level from test if needed, or use cefr_level from questions if available.
      // For now, let's assume we can get it from the test score or a specific field.
      // If placement test doesn't store CEFR, we might need to calculate it.
      // Looking at placement.schema, finalEloScore is there.
      
      // Basic mapping for ELO to CEFR (example)
      const score = lastTest.finalEloScore || 600;
      if (score < 800) levelCode = "A1";
      else if (score < 1000) levelCode = "A2";
      else if (score < 1200) levelCode = "B1";
      else if (score < 1400) levelCode = "B2";
      else if (score < 1600) levelCode = "C1";
      else levelCode = "C2";
    }

    // Get description from BADGES_CONFIG
    // We need a dummy translation function since BADGES_CONFIG.levelsInfo expects one.
    const t = (key: string) => key; // Fallback or use a real translation if possible in service
    const langConfig = BADGES_CONFIG[language] || BADGES_CONFIG["en"];
    const levelInfo = langConfig.levelsInfo(t).find(l => l.code === levelCode);

    if (levelInfo) {
      levelLabel = levelInfo.label;
      levelDescription = levelInfo.description;
    }

    return {
      studentName: student.name,
      studentEmail: student.email,
      courseLanguage: language,
      totalHours,
      levelCode,
      levelLabel,
      levelDescription,
      startDate: student.classesStartDate,
      endDate: lastClassDate,
    };
  },

  async issueCertificate(issuedById: string, input: IssueCertificateValues) {
    const data = await this.generateCertificateData(input.studentId, input.language);
    
    const code = `FL-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;

    const certificate = await certificateRepository.create({
      code,
      studentId: input.studentId,
      studentName: data.studentName,
      studentEmail: data.studentEmail,
      courseLanguage: data.courseLanguage,
      hours: data.totalHours,
      levelCode: data.levelCode,
      levelDescription: data.levelDescription,
      startDate: data.startDate,
      endDate: data.endDate,
      issuedAt: input.issuedAt ? new Date(input.issuedAt) : new Date(),
      issuedBy: issuedById,
    });

    return certificate;
  },

  async getCertificateByCode(code: string) {
    return certificateRepository.findByCode(code);
  },

  async getStudentCertificates(studentId: string) {
    return certificateRepository.findByStudent(studentId);
  },

  async savePdfUrl(code: string, pdfUrl: string) {
    return certificateRepository.updatePdfUrl(code, pdfUrl);
  }
};
