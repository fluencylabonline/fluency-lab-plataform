import { NextRequest, NextResponse } from "next/server";
import { env } from "@/env";
import { communicationRepository } from "@/modules/communication/communication.repository";
import crypto from "node:crypto";
import { type NotificationPrefs } from "@/modules/user/user.schema";
import { userService } from "@/modules/user/user.service";
import { notificationService } from "@/modules/notification/notification.service";
import { adminRtdb } from "@/lib/firebase-admin";
import { db } from "@/lib/db";
import { eq } from "drizzle-orm";
import { usersTable } from "@/modules/user/user.schema";
import { whatsappMessagesTable } from "@/modules/communication/communication.schema";

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
  const signature = req.headers.get("x-hub-signature-256");

  if (!signature) {
    console.error("[WhatsApp Webhook] Missing x-hub-signature-256 header");
    return NextResponse.json({ error: "Missing signature" }, { status: 401 });
  }

  const rawBody = await req.text();
  const expectedSig =
    "sha256=" +
    crypto
      .createHmac("sha256", env.WHATSAPP_APP_SECRET)
      .update(rawBody)
      .digest("hex");

  const sigBuffer = Buffer.from(signature);
  const expectedBuffer = Buffer.from(expectedSig);

  if (
    sigBuffer.length !== expectedBuffer.length ||
    !crypto.timingSafeEqual(sigBuffer, expectedBuffer)
  ) {
    console.error("[WhatsApp Webhook] Invalid signature");
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }

  try {
    const body = JSON.parse(rawBody);

    // Verificação de payload da Meta
    if (body.object !== "whatsapp_business_account") {
      return NextResponse.json({ error: "Invalid object" }, { status: 400 });
    }

    const entry = body.entry?.[0];
    const change = entry?.changes?.[0];
    const value = change?.value;

    if (!value) return NextResponse.json({ success: true });

    // 1. Processar Status de Mensagens (Entregue, Lida, etc)
    if (value.statuses) {
      for (const status of value.statuses) {
        const messageId = status.id;
        const messageStatus = status.status; // sent, delivered, read, failed
        await communicationRepository.updateMessageStatus(messageId, messageStatus);
        
        // Find conversation of this message to signal update
        const message = await db.query.whatsappMessagesTable.findFirst({
          where: eq(whatsappMessagesTable.id, messageId)
        });
        if (message) {
          try {
            await adminRtdb.ref(`whatsapp_sync_signal/messages/${message.conversationId}`).set(Date.now());
            await adminRtdb.ref(`whatsapp_sync_signal/conversations`).set(Date.now());
          } catch (rtdbErr) {
            console.error("[WhatsApp Webhook] Error sending RTDB sync signal for status update:", rtdbErr);
          }
        }
      }
    }

    // 2. Processar Novas Mensagens
    if (value.messages) {
      for (const msg of value.messages) {
        const waId = msg.from;
        const messageId = msg.id;
        const timestamp = new Date(parseInt(msg.timestamp) * 1000);
        
        let content = "";
        const type = msg.type;
        let metadata: {
          mediaId: string;
          mimeType: string;
          caption?: string;
          filename?: string;
          voice?: boolean;
        } | null = null;

        if (msg.type === "text") {
          content = msg.text.body;
        } else if (msg.type === "button") {
          content = msg.button.text;
        } else if (msg.type === "interactive") {
          content = "[Mensagem Interativa]";
        } else if (msg.type === "image") {
          content = msg.image.caption ? `📷 ${msg.image.caption}` : "📷 Foto";
          metadata = {
            mediaId: msg.image.id,
            mimeType: msg.image.mime_type,
            caption: msg.image.caption,
          };
        } else if (msg.type === "audio") {
          content = msg.audio.voice ? "🎙️ Mensagem de Voz" : "🎵 Áudio";
          metadata = {
            mediaId: msg.audio.id,
            mimeType: msg.audio.mime_type,
            voice: msg.audio.voice,
          };
        } else if (msg.type === "document") {
          content = msg.document.filename ? `📄 ${msg.document.filename}` : "📄 Documento";
          metadata = {
            mediaId: msg.document.id,
            mimeType: msg.document.mime_type,
            filename: msg.document.filename,
            caption: msg.document.caption,
          };
        } else if (msg.type === "video") {
          content = msg.video.caption ? `🎥 ${msg.video.caption}` : "🎥 Vídeo";
          metadata = {
            mediaId: msg.video.id,
            mimeType: msg.video.mime_type,
            caption: msg.video.caption,
          };
        } else {
          content = `[Mídia: ${msg.type}]`;
          const genericMedia = msg[msg.type];
          if (genericMedia && genericMedia.id) {
            metadata = {
              mediaId: genericMedia.id,
              mimeType: genericMedia.mime_type,
            };
          }
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
          metadata,
          createdAt: timestamp,
        });

        // RTDB Signal for real-time update
        try {
          await adminRtdb.ref(`whatsapp_sync_signal/messages/${conversation.id}`).set(Date.now());
          await adminRtdb.ref(`whatsapp_sync_signal/conversations`).set(Date.now());
        } catch (rtdbErr) {
          console.error("[WhatsApp Webhook] Error sending RTDB sync signal for new message:", rtdbErr);
        }

        // Enviar notificações push e in-app para admins e managers
        try {
          const adminsAndManagers = await userService.getActiveAdminsAndManagers();

          const notifiedAdmins: string[] = [];
          const notifiedManagers: string[] = [];

          for (const u of adminsAndManagers) {
            // Obter preferências de notificação
            const prefs = (u.notificationPrefs as NotificationPrefs) || {};
            
            // Se desativou notificações do chat, não envia
            if (prefs.whatsapp === false) continue;
            
            // Verificar se as notificações globais de push estão habilitadas
            if (u.pushNotificationsEnabled === false) continue;

            if (u.role === "admin") {
              notifiedAdmins.push(u.id);
            } else if (u.role === "manager") {
              notifiedManagers.push(u.id);
            }
          }

          const bodyText = `${msg.from}: ${content.substring(0, 60)}${content.length > 60 ? "..." : ""}`;

          let studentPhotoUrl: string | undefined = undefined;
          if (conversation.studentId) {
            const student = await db.query.usersTable.findFirst({
              where: eq(usersTable.id, conversation.studentId),
              columns: { photoUrl: true }
            });
            if (student?.photoUrl) {
              studentPhotoUrl = student.photoUrl;
            }
          }

          if (notifiedAdmins.length > 0) {
            await notificationService.sendNotification({
              title: "Nova mensagem no WhatsApp",
              body: bodyText,
              actionUrl: `/hub/admin/conversas?convId=${conversation.id}`,
              icon: studentPhotoUrl,
              targetType: "specific",
              userIds: notifiedAdmins,
              channels: {
                push: true,
                inApp: false,
              },
            });
          }

          if (notifiedManagers.length > 0) {
            await notificationService.sendNotification({
              title: "Nova mensagem no WhatsApp",
              body: bodyText,
              actionUrl: `/hub/manager/conversas?convId=${conversation.id}`,
              icon: studentPhotoUrl,
              targetType: "specific",
              userIds: notifiedManagers,
              channels: {
                push: true,
                inApp: true,
              },
            });
          }
        } catch (pushErr) {
          console.error("[WhatsApp Webhook] Erro ao enviar notificações:", pushErr);
        }
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[WhatsApp Webhook] Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
