import { NextRequest, NextResponse } from "next/server";
import { env } from "@/env";
import { communicationRepository } from "@/modules/communication/communication.repository";

export async function GET(req: NextRequest) {
  const searchParams = req.nextUrl.searchParams;
  const mode = searchParams.get("hub.mode");
  const token = searchParams.get("hub.verify_token");
  const challenge = searchParams.get("hub.challenge");

  if (mode === "subscribe" && token === env.WHATSAPP_VERIFY_TOKEN) {
    console.log("[WhatsApp Webhook] Verification successful");
    return new NextResponse(challenge);
  }

  return new NextResponse("Forbidden", { status: 403 });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    // Verificação de payload da Meta
    if (body.object !== "whatsapp_business_account") {
      return NextResponse.json({ error: "Invalid object" }, { status: 400 });
    }

    const entry = body.entry?.[0];
    const change = entry?.changes?.[0];
    const value = change?.value;

    if (!value) return NextResponse.json({ success: true });

    // 1. Processar Status de Mensagens (Entregue, Lida, etc)
    /* if (value.statuses) {
      for (const _status of value.statuses) {
        // TODO: Atualizar status no banco se necessário
        // communicationRepository.updateMessageStatus(status.id, status.status);
      }
    } */

    // 2. Processar Novas Mensagens
    if (value.messages) {
      for (const msg of value.messages) {
        const waId = msg.from;
        const messageId = msg.id;
        const timestamp = new Date(parseInt(msg.timestamp) * 1000);
        
        let content = "";
        const type = msg.type;

        if (msg.type === "text") {
          content = msg.text.body;
        } else if (msg.type === "button") {
          content = msg.button.text;
        } else if (msg.type === "interactive") {
           // Handle interactive messages if needed
           content = "[Mensagem Interativa]";
        } else {
          content = `[Mídia: ${msg.type}]`;
        }

        // Encontrar ou criar conversa
        let conversation = await communicationRepository.findConversationByWaId(waId);

        if (!conversation) {
          const user = await communicationRepository.findUserByPhone(waId);
          conversation = await communicationRepository.createConversation({
            waId,
            studentId: user?.id,
            lastMessageContent: content,
            lastMessageAt: timestamp,
          });
        } else {
          await communicationRepository.updateConversation(conversation.id, {
            lastMessageContent: content,
            lastMessageAt: timestamp,
            unreadCount: conversation.unreadCount + 1,
          });
        }

        // Salvar mensagem
        await communicationRepository.saveMessage({
          id: messageId,
          conversationId: conversation.id,
          content,
          type,
          direction: "inbound",
          status: "delivered",
          createdAt: timestamp,
        });
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[WhatsApp Webhook] Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
