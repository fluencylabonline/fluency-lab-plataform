import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth-server";
import { communicationService } from "@/modules/communication/communication.service";

interface RouteParams {
  params: Promise<{
    mediaId: string;
  }>;
}

export async function GET(req: NextRequest, { params }: RouteParams) {
  try {
    // 1. Verificar autenticação e autorização (somente Admin ou Manager)
    const user = await getCurrentUser();
    if (!user || (user.role !== "admin" && user.role !== "manager")) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const { mediaId } = await params;
    if (!mediaId) {
      return NextResponse.json({ error: "Missing media ID" }, { status: 400 });
    }

    // 2. Chamar o serviço para obter os dados binários e mime-type
    const media = await communicationService.getWhatsAppMedia(mediaId);

    if (!media) {
      return NextResponse.json({ error: "Media not found or failed to retrieve" }, { status: 404 });
    }

    // 3. Responder com o buffer binário e cabeçalho de Content-Type adequado
    const response = new NextResponse(new Uint8Array(media.buffer), {
      status: 200,
      headers: {
        "Content-Type": media.mimeType,
        "Cache-Control": "public, max-age=86400, s-maxage=86400, stale-while-revalidate=43200",
      },
    });

    return response;
  } catch (error) {
    console.error("[WhatsApp Media API] Proxy Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
