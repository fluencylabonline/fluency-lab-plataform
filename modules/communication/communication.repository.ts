import { db } from "@/lib/db";
import { whatsappConversationsTable, whatsappMessagesTable } from "./communication.schema";
import { eq, desc, and } from "drizzle-orm";
import { usersTable } from "../user/user.schema";

export const communicationRepository = {
  async findConversationByWaId(waId: string) {
    return db.query.whatsappConversationsTable.findFirst({
      where: eq(whatsappConversationsTable.waId, waId),
    });
  },

  async findUserByPhone(phone: string) {
    // Tenta encontrar o usuário pelo telefone (removendo o código do país se necessário ou buscando parcial)
    // No Brasil, a Meta envia 55 + DDD + 9 + Número.
    return db.query.usersTable.findFirst({
      where: (table, { or, like }) => or(
        eq(table.cellphone, phone),
        like(table.cellphone, `%${phone.slice(2)}%`) // Busca aproximada sem o 55
      ),
    });
  },

  async createConversation(data: {
    waId: string;
    studentId?: string | null;
    lastMessageContent?: string;
    lastMessageAt?: Date;
  }) {
    const [conversation] = await db
      .insert(whatsappConversationsTable)
      .values({
        ...data,
        unreadCount: 1,
      })
      .returning();
    return conversation;
  },

  async updateConversation(id: string, data: Partial<typeof whatsappConversationsTable.$inferInsert>) {
    await db
      .update(whatsappConversationsTable)
      .set({
        ...data,
        updatedAt: new Date(),
      })
      .where(eq(whatsappConversationsTable.id, id));
  },

  async saveMessage(data: typeof whatsappMessagesTable.$inferInsert) {
    const [message] = await db.insert(whatsappMessagesTable).values(data).returning();
    return message;
  },

  async getConversations() {
    return db.query.whatsappConversationsTable.findMany({
      orderBy: [desc(whatsappConversationsTable.lastMessageAt)],
      with: {
        // Se houver relação definida no schema (precisaria adicionar relations)
      }
    });
  },

  async getMessages(conversationId: string, limit = 50) {
    return db.query.whatsappMessagesTable.findMany({
      where: eq(whatsappMessagesTable.conversationId, conversationId),
      orderBy: [desc(whatsappMessagesTable.createdAt)],
      limit,
    });
  },

  async markAsRead(conversationId: string) {
    await db
      .update(whatsappConversationsTable)
      .set({ unreadCount: 0 })
      .where(eq(whatsappConversationsTable.id, conversationId));
  }
};
