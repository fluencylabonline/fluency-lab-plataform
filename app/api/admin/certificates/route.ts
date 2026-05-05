import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth-server";
import { certificateService } from "@/modules/certificate/certificate.service";
import { issueCertificateSchema } from "@/modules/certificate/certificate.types";

export async function POST(req: Request) {
  try {
    const user = await getCurrentUser();
    if (!user || (user.role !== "admin" && user.role !== "manager")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const validated = issueCertificateSchema.safeParse(body);

    if (!validated.success) {
      return NextResponse.json({ error: "Invalid input" }, { status: 400 });
    }

    const certificate = await certificateService.issueCertificate(user.id, validated.data);

    return NextResponse.json({ success: true, code: certificate.code });
  } catch (error) {
    console.error("[POST /api/admin/certificates] Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
