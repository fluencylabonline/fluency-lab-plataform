import { NextRequest, NextResponse } from "next/server";
import { env } from "@/env";
import { communicationRepository } from "@/modules/communication/communication.repository";
import { communicationService } from "@/modules/communication/communication.service";
import crypto from "node:crypto";
import { type NotificationPrefs } from "@/modules/user/user.schema";
import { userService } from "@/modules/user/user.service";
import { notificationService } from "@/modules/notification/notification.service";
import { adminRtdb } from "@/lib/firebase-admin";
import { db } from "@/lib/db";
import { eq } from "drizzle-orm";
import { usersTable } from "@/modules/user/user.schema";
import { whatsappMessagesTable } from "@/modules/communication/communication.schema";

/** Renders a wa_id as a readable phone number, e.g. 5549936182324 → +55 (49) 93618-2324. */
function formatWaId(waId: string): string {
  const brazilian = waId.match(/^55(\d{2})(\d{4,5})(\d{4})$/);
  if (brazilian) {
    const [, areaCode, prefix, suffix] = brazilian;
    return `+55 (${areaCode}) ${prefix}-${suffix}`;
  }
  return `+${waId}`;
}

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
      // A Meta envia o nome do perfil do WhatsApp junto do payload, o que dá um
      // nome legível mesmo para números que não estão vinculados a um aluno.
      const profileNamesByWaId = new Map<string, string>();
      for (const contact of value.contacts ?? []) {
        if (contact?.wa_id && contact?.profile?.name) {
          profileNamesByWaId.set(contact.wa_id, contact.profile.name);
        }
      }

      // Resolvido uma única vez por payload: a lista de admins/managers ativos
      // não muda entre mensagens do mesmo webhook, então evitamos refazer essa
      // query a cada iteração do loop.
      const adminsAndManagers = await userService.getActiveAdminsAndManagers();
      const notifiedAdmins: { id: string; email: string | null }[] = [];
      const notifiedManagers: { id: string; email: string | null }[] = [];

      for (const u of adminsAndManagers) {
        const prefs = (u.notificationPrefs as NotificationPrefs) || {};
        if (prefs.whatsapp === false) continue;
        if (u.pushNotificationsEnabled === false) continue;

        if (u.role === "admin") {
          notifiedAdmins.push({ id: u.id, email: u.email });
        } else if (u.role === "manager") {
          notifiedManagers.push({ id: u.id, email: u.email });
        }
      }

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

        const profileName = profileNamesByWaId.get(waId);

        // Encontrar ou criar conversa
        let conversation = await communicationRepository.findConversationByWaId(waId);

        if (!conversation) {
          const user = await communicationRepository.findUserByPhone(waId);
          conversation = await communicationRepository.createConversation({
            waId,
            studentId: user?.id,
            contactName: profileName,
            lastMessageContent: content,
            lastMessageAt: timestamp,
          });
        } else {
          // Preenche o nome do contato na primeira vez que a Meta o informa, sem
          // sobrescrever um nome que o atendente tenha definido manualmente.
          if (!conversation.contactName && profileName) {
            await communicationRepository.updateContactName(conversation.id, profileName);
            conversation = { ...conversation, contactName: profileName };
          }

          // Incremento atômico no SQL: evita perder contagens de não lidas quando
          // múltiplas mensagens chegam em paralelo para a mesma conversa (o padrão
          // anterior de "ler valor -> escrever valor+1" tinha uma race condition).
          await communicationRepository.incrementUnreadCountAndTouch(conversation.id, {
            lastMessageContent: content,
            lastMessageAt: timestamp,
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
          // Sinal dedicado para mensagens realmente novas e recebidas (não sinaliza
          // envios próprios nem atualizações de status), usado para tocar o som de
          // notificação na UI independentemente da conversa selecionada.
          await adminRtdb.ref(`whatsapp_sync_signal/new_inbound_message`).set({
            timestamp: Date.now(),
            conversationId: conversation.id,
          });
        } catch (rtdbErr) {
          console.error("[WhatsApp Webhook] Error sending RTDB sync signal for new message:", rtdbErr);
        }

        // Enviar notificações push e in-app para admins e managers
        try {
          let student: { name: string; photoUrl: string | null } | undefined = undefined;
          if (conversation.studentId) {
            student = await db.query.usersTable.findFirst({
              where: eq(usersTable.id, conversation.studentId),
              columns: { name: true, photoUrl: true }
            });
          }

          // Nome mais útil disponível: o que o atendente definiu manualmente, o
          // cadastro do aluno, o perfil do WhatsApp e, por último, o telefone.
          const displayName =
            conversation.contactName || student?.name || profileName || formatWaId(waId);

          const bodyText = `${content.substring(0, 80)}${content.length > 80 ? "..." : ""}`;
          const notificationTitle = `WhatsApp · ${displayName}`;
          const studentPhotoUrl = student?.photoUrl || undefined;

          if (notifiedAdmins.length > 0) {
            await notificationService.sendNotification({
              title: notificationTitle,
              body: bodyText,
              actionUrl: `/hub/admin/conversas?convId=${conversation.id}`,
              icon: studentPhotoUrl,
              targetType: "specific",
              userIds: notifiedAdmins.map((a) => a.id),
              channels: {
                push: true,
                // Sempre registra in-app também: se o push falhar/expirar, ainda
                // sobra um registro persistente (sino de notificações) para o admin.
                inApp: true,
              },
            });
          }

          if (notifiedManagers.length > 0) {
            await notificationService.sendNotification({
              title: notificationTitle,
              body: bodyText,
              actionUrl: `/hub/manager/conversas?convId=${conversation.id}`,
              icon: studentPhotoUrl,
              targetType: "specific",
              userIds: notifiedManagers.map((m) => m.id),
              channels: {
                push: true,
                inApp: true,
              },
            });
          }

          // Fallback por e-mail: quem não tem nenhuma subscription de push ativa
          // ainda recebe um aviso, em vez de só descobrir a mensagem ao abrir a
          // plataforma manualmente.
          const allNotified = [...notifiedAdmins, ...notifiedManagers];
          if (allNotified.length > 0) {
            const idsWithoutPush = await notificationService.getUserIdsWithoutActiveSubscription(
              allNotified.map((u) => u.id)
            );
            if (idsWithoutPush.length > 0) {
              const emailTargets = allNotified.filter(
                (u) => idsWithoutPush.includes(u.id) && u.email
              );
              const actionUrl = `${env.NEXT_PUBLIC_APP_URL}/hub/admin/conversas?convId=${conversation.id}`;
              await Promise.allSettled(
                emailTargets.map((u) =>
                  communicationService.sendWhatsAppMissedMessageEmail(u.email as string, {
                    senderLabel: displayName,
                    preview: content,
                    actionUrl,
                  })
                )
              );
            }
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
