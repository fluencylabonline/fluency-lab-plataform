import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth-server";
import { certificateService } from "@/modules/certificate/certificate.service";
import { adminStorage } from "@/lib/firebase-admin";
import { communicationService } from "@/modules/communication/communication.service";
import { env } from "@/env";

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ code: string }> }
) {
  try {
    const { code } = await params;
    const user = await getCurrentUser();
    if (!user || (user.role !== "admin" && user.role !== "manager")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { pdfBase64 } = await req.json();

    if (!pdfBase64) {
      return NextResponse.json({ error: "PDF data is required" }, { status: 400 });
    }

    const certificate = await certificateService.getCertificateByCode(code);
    if (!certificate) {
      return NextResponse.json({ error: "Certificate not found" }, { status: 404 });
    }

    // 1. Upload to Firebase Storage
    const base64Data = pdfBase64.split(",")[1] || pdfBase64;
    const buffer = Buffer.from(base64Data, "base64");
    
    const bucket = adminStorage.bucket();
    const filePath = `certificates/${certificate.studentId}/${code}.pdf`;
    const file = bucket.file(filePath);

    await file.save(buffer, {
      contentType: "application/pdf",
      public: false, // Ensure it's not publicly accessible without token/auth
    });

    // Set the download token metadata explicitly
    // We use a nested metadata object because Firebase Storage expects custom metadata 
    // to be inside the 'metadata' property of the file's metadata.
    await file.setMetadata({
      metadata: {
        firebaseStorageDownloadTokens: code,
      },
    });

    // Generate public URL using the token to bypass Storage Rules
    const pdfUrl = `https://firebasestorage.googleapis.com/v0/b/${bucket.name}/o/${encodeURIComponent(filePath)}?alt=media&token=${code}`;

    // 2. Update DB
    await certificateService.savePdfUrl(code, pdfUrl);

    // 3. Send Email
    const verifyUrl = `${env.NEXT_PUBLIC_APP_URL}/certificate/${code}`;
    await communicationService.sendCertificateEmail(
      certificate.studentEmail,
      certificate.studentName,
      certificate.courseLanguage,
      verifyUrl,
      pdfBase64
    );

    return NextResponse.json({ success: true, pdfUrl });
  } catch (error) {
    console.error("[PUT /api/admin/certificates/[code]/pdf] Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
