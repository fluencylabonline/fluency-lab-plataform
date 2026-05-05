import { db } from "@/lib/db";
import { certificatesTable, NewCertificate } from "./certificate.schema";
import { eq, desc } from "drizzle-orm";

export const certificateRepository = {
  async create(data: NewCertificate) {
    const [certificate] = await db.insert(certificatesTable).values(data).returning();
    return certificate;
  },

  async findByCode(code: string) {
    return db.query.certificatesTable.findFirst({
      where: eq(certificatesTable.code, code),
    });
  },

  async findByStudent(studentId: string) {
    return db.query.certificatesTable.findMany({
      where: eq(certificatesTable.studentId, studentId),
      orderBy: [desc(certificatesTable.issuedAt)],
    });
  },

  async updatePdfUrl(code: string, pdfUrl: string) {
    return db.update(certificatesTable)
      .set({ pdfUrl })
      .where(eq(certificatesTable.code, code))
      .returning();
  },

  async findOldCertificatesWithPdf(threshold: Date) {
    // This will be used by the cron job to find PDFs to delete
    // Note: We keep the DB record, but we'll null out the pdfUrl in DB after deleting from Storage
    return db.query.certificatesTable.findMany({
      where: (certificates, { lt, isNotNull, and }) => 
        and(
          lt(certificates.issuedAt, threshold),
          isNotNull(certificates.pdfUrl)
        )
    });
  }
};
