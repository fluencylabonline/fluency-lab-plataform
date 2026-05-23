import { db } from "@/lib/db";
import { whatsappConversationsTable, whatsappMessagesTable } from "./communication.schema";
import { usersTable } from "../user/user.schema";
import { eq, desc } from "drizzle-orm";

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

  async findUserByEmail(email: string) {
    return db.query.usersTable.findFirst({
      where: (table, { eq }) => eq(table.email, email),
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
    return db
      .select({
        id: whatsappConversationsTable.id,
        waId: whatsappConversationsTable.waId,
        studentId: whatsappConversationsTable.studentId,
        contactName: whatsappConversationsTable.contactName,
        labels: whatsappConversationsTable.labels,
        lastMessageContent: whatsappConversationsTable.lastMessageContent,
        lastMessageAt: whatsappConversationsTable.lastMessageAt,
        unreadCount: whatsappConversationsTable.unreadCount,
        createdAt: whatsappConversationsTable.createdAt,
        updatedAt: whatsappConversationsTable.updatedAt,
        studentName: usersTable.name,
      })
      .from(whatsappConversationsTable)
      .leftJoin(usersTable, eq(whatsappConversationsTable.studentId, usersTable.id))
      .orderBy(desc(whatsappConversationsTable.lastMessageAt));
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
