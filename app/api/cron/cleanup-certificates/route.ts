import { NextResponse } from "next/server";
import { certificateRepository } from "@/modules/certificate/certificate.repository";
import { adminStorage } from "@/lib/firebase-admin";
import { subYears } from "date-fns";
import { env } from "@/env";

export async function POST(req: Request) {
  // Check for cron secret
  const authHeader = req.headers.get("authorization");
  if (authHeader !== `Bearer ${env.CRON_SECRET}`) {
    return new Response("Unauthorized", { status: 401 });
  }

  try {
    const oneYearAgo = subYears(new Date(), 1);
    const oldCertificates = await certificateRepository.findOldCertificatesWithPdf(oneYearAgo);

    console.log(`[Cron: CleanupCertificates] Found ${oldCertificates.length} certificates to clean up.`);

    const bucket = adminStorage.bucket();
    let successCount = 0;

    for (const cert of oldCertificates) {
      if (!cert.pdfUrl) continue;

      try {
        // Extract file path from URL or reconstruct it
        const filePath = `certificates/${cert.studentId}/${cert.code}.pdf`;
        const file = bucket.file(filePath);

        const [exists] = await file.exists();
        if (exists) {
          await file.delete();
          console.log(`[Cron: CleanupCertificates] Deleted PDF for certificate ${cert.code}`);
        }

        // Update DB to remove URL but keep record
        await certificateRepository.updatePdfUrl(cert.code, "");
        successCount++;
      } catch (err) {
        console.error(`[Cron: CleanupCertificates] Error deleting PDF for ${cert.code}:`, err);
      }
    }

    return NextResponse.json({ 
      success: true, 
      processed: oldCertificates.length,
      deleted: successCount
    });
  } catch (error) {
    console.error("[Cron: CleanupCertificates] Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
