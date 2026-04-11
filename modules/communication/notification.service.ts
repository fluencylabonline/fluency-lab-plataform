// import webpush from "web-push";
// import { Announcement, AnnouncementType } from "@/types/communication/announcements";
// import { UserRoles } from "@/types/users/userRoles";
// import { UserAdminRepository } from "@/repositories/admin/userAdminRepository";
// import { AnnouncementRepository } from "@/repositories/communication/announcementRepository";
// import {
//   PushSubscriptionRepository,
//   StoredSubscription,
// } from "@/repositories/communication/pushSubscriptionRepository";

// // --- Configuração Web Push ---
// function configureWebPush() {
//   const publicKey = process.env.VAPID_PUBLIC_KEY || process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
//   const privateKey = process.env.VAPID_PRIVATE_KEY;
//   const envSubject = process.env.VAPID_SUBJECT;
//   const appUrl = process.env.NEXT_PUBLIC_APP_URL;
//   const nextAuthUrl = process.env.NEXTAUTH_URL;

//   const pickSubject = (): string => {
//     if (envSubject && (envSubject.startsWith("https://") || envSubject.startsWith("mailto:"))) return envSubject;
//     if (appUrl && appUrl.startsWith("https://")) return appUrl;
//     if (nextAuthUrl && nextAuthUrl.startsWith("https://")) return nextAuthUrl;
//     return "mailto:push@fluencylab.me";
//   };

//   if (publicKey && privateKey) {
//     webpush.setVapidDetails(pickSubject(), publicKey, privateKey);
//   }
// }
// configureWebPush();

// // --- Instâncias dos Repositórios ---
// const userRepo = new UserAdminRepository();
// const subRepo = new PushSubscriptionRepository();
// const announcementRepo = new AnnouncementRepository();

// // --- Tipagem da Nova API Unificada ---
// export interface SendNotificationOptions {
//   title: string;
//   message: string;
//   type?: AnnouncementType; // default: 'info'
//   recipients: 
//     | { type: "role"; roles: UserRoles[] }
//     | { type: "specific"; userIds: string[] };
//   link?: string;
//   createdBy?: string; // default: 'SYSTEM'
//   channels?: {
//     inApp?: boolean; // default: true (Salva no banco como Announcement)
//     push?: boolean;  // default: true (Envia notificação via browser)
//   };
// }

// export class NotificationService {
//   /**
//    * Método unificado e amigável para enviar notificações.
//    * Funciona como um "Toast", onde você decide os canais de envio (inApp, push).
//    */
//   async send(options: SendNotificationOptions): Promise<Announcement | null> {
//     const {
//       title,
//       message,
//       type = "info",
//       recipients,
//       link,
//       createdBy = "SYSTEM",
//       channels = { inApp: true, push: true },
//     } = options;

//     let announcement: Announcement | null = null;

//     // 1. Canal In-App (Salvar no banco)
//     if (channels.inApp) {
//       announcement = await announcementRepo.create({
//         title,
//         message,
//         type,
//         createdBy,
//         recipients,
//         link,
//         isActive: true,
//       });
//     }

//     // 2. Canal Push (Enviar para o navegador)
//     if (channels.push) {
//       // Evita travar a thread principal caso o push falhe
//       this.executePushStrategy(options).catch((err) => {
//         console.error("[NotificationService] Falha ao enviar Push:", err);
//       });
//     }

//     return announcement;
//   }

//   /**
//    * Helper rápido para enviar uma mensagem do sistema diretamente para usuários específicos
//    */
//   async sendSystemAlert(
//     title: string,
//     message: string,
//     userIds: string | string[],
//     channels?: SendNotificationOptions["channels"]
//   ) {
//     return this.send({
//       title,
//       message,
//       type: "info",
//       recipients: {
//         type: "specific",
//         userIds: Array.isArray(userIds) ? userIds : [userIds],
//       },
//       channels,
//     });
//   }

//   // ==========================================
//   // LÓGICA PRIVADA DE PUSH
//   // ==========================================

//   private async executePushStrategy(options: SendNotificationOptions): Promise<void> {
//     const resolvedUserIds = await this.resolveRecipients(options.recipients);
//     if (resolvedUserIds.length === 0) return;

//     const items = await subRepo.getForUsers(resolvedUserIds);
//     const payload = {
//       title: options.title,
//       body: options.message,
//       type: options.type || "info",
//       url: options.link || process.env.NEXT_PUBLIC_APP_URL || "/",
//     };

//     await Promise.all(
//       items.flatMap((item) =>
//         item.subscriptions.map((sub) => this.sendToSubscription(sub, payload))
//       )
//     );
//   }

//   private async resolveRecipients(recipients: SendNotificationOptions["recipients"]): Promise<string[]> {
//     if (recipients.type === "specific") {
//       return recipients.userIds;
//     }
//     if (recipients.type === "role") {
//       const allIds = new Set<string>();
//       for (const role of recipients.roles) {
//         const users = await userRepo.findUsersByRole(role);
//         users.forEach((u) => allIds.add(u.id));
//       }
//       return Array.from(allIds);
//     }
//     return [];
//   }

//   private async sendToSubscription(subscription: StoredSubscription, payload: any) {
//     const sub = {
//       endpoint: subscription.endpoint,
//       keys: subscription.keys,
//     };
    
//     try {
//       await webpush.sendNotification(sub, JSON.stringify(payload));
//     } catch (err: any) {
//       if (err?.statusCode === 410 || err?.statusCode === 404) {
//         // Inscrição expirou, limpa do banco
//         const matches = await this.findUserByEndpoint(subscription.endpoint);
//         if (matches) {
//           await subRepo.remove(matches.userId, subscription.endpoint);
//         }
//       }
//     }
//   }

//   private async findUserByEndpoint(endpoint: string): Promise<{ userId: string } | null> {
//     // TODO: implementar busca via Drizzle usando o endpoint
//     return null;
//   }

//   // ==========================================
//   // MÉTODOS DE LEITURA (IN-APP)
//   // ==========================================

//   async getAll(): Promise<Announcement[]> {
//     return await announcementRepo.findAll();
//   }

//   async getById(id: string): Promise<Announcement | null> {
//     return await announcementRepo.findById(id);
//   }

//   async getForUser(userId: string, userRole: UserRoles): Promise<Announcement[]> {
//     return await announcementRepo.getAnnouncementsForUser(userId, userRole);
//   }

//   async markAsRead(announcementId: string, userId: string): Promise<void> {
//     await announcementRepo.markAsRead(announcementId, userId);
//   }

//   async getUnreadCount(userId: string, userRole: UserRoles): Promise<number> {
//     return await announcementRepo.getUnreadCountForUser(userId, userRole);
//   }

//   async delete(id: string): Promise<void> {
//     return await announcementRepo.delete(id);
//   }
// }

// export const notificationService = new NotificationService();

/*
Como ficou fácil de usar agora:
Agora, de qualquer lugar da sua API ou Action do Next.js, você pode disparar notificações de forma super declarativa, parecido com o Sonner/Toaster que vimos antes.

1. Mandar para ambos (Banco de dados + Notificação no Celular/PC):

TypeScript
await notificationService.send({
  title: "Nova Aula Disponível",
  message: "Sua aula de inglês com o teacher João já começou!",
  link: "/class/xyz",
  recipients: { type: "specific", userIds: ["user_123"] }
  // Não precisa passar 'channels', o padrão é os dois ativos.
});
2. Mandar APENAS Push Notification (ex: Lembrete rápido que não precisa ficar no painel de sininho):

TypeScript
await notificationService.send({
  title: "Atenção!",
  message: "Sua sessão expira em 5 minutos.",
  recipients: { type: "specific", userIds: ["user_123"] },
  channels: { inApp: false, push: true } // Desliga o inApp
});
3. Mandar APENAS para o banco (ex: Aviso silencioso na plataforma para todos os estudantes):

TypeScript
await notificationService.send({
  title: "Manutenção programada",
  message: "O sistema ficará offline à meia-noite.",
  recipients: { type: "role", roles: ["student"] },
  channels: { inApp: true, push: false } // Não apita o celular de ninguém
});
4. Atalho para alertas de sistema:

TypeScript
await notificationService.sendSystemAlert(
  "Bem-vindo à Fluency Lab",
  "Explore sua trilha de aprendizado.",
  "user_123",
  { inApp: true, push: false } // Opcional
);
Dessa forma, o serviço não só ficou unificado, como também não vai dar "crash" na criação in-app caso a chave do Vapid falhe, já que coloquei o Push rodando de forma independente no catch.
*/