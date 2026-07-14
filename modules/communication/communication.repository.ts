import { db } from "@/lib/db";
import { whatsappConversationsTable, whatsappMessagesTable, whatsappQuickRepliesTable, emailsTable } from "./communication.schema";
import { usersTable } from "../user/user.schema";
import { eq, desc } from "drizzle-orm";
import { EmailMessage } from "./communication.types";


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

  async getConversations(includeArchived: boolean = false) {
    let query = db
      .select({
        id: whatsappConversationsTable.id,
        waId: whatsappConversationsTable.waId,
        studentId: whatsappConversationsTable.studentId,
        contactName: whatsappConversationsTable.contactName,
        labels: whatsappConversationsTable.labels,
        lastMessageContent: whatsappConversationsTable.lastMessageContent,
        lastMessageAt: whatsappConversationsTable.lastMessageAt,
        unreadCount: whatsappConversationsTable.unreadCount,
        isArchived: whatsappConversationsTable.isArchived,
        createdAt: whatsappConversationsTable.createdAt,
        updatedAt: whatsappConversationsTable.updatedAt,
        studentName: usersTable.name,
        photoUrl: usersTable.photoUrl,
      })
      .from(whatsappConversationsTable)
      .leftJoin(usersTable, eq(whatsappConversationsTable.studentId, usersTable.id))
      .$dynamic();
      
    query = query.where(eq(whatsappConversationsTable.isArchived, includeArchived));

    return query.orderBy(desc(whatsappConversationsTable.lastMessageAt));
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
  },

  async updateMessageStatus(messageId: string, status: "sent" | "delivered" | "read" | "failed") {
    await db
      .update(whatsappMessagesTable)
      .set({ status })
      .where(eq(whatsappMessagesTable.id, messageId));
  },

  async updateContactName(conversationId: string, contactName: string) {
    await db
      .update(whatsappConversationsTable)
      .set({ contactName, updatedAt: new Date() })
      .where(eq(whatsappConversationsTable.id, conversationId));
  },

  async findStudentsByPhone(phone: string) {
    // Busca todos os estudantes com o telefone (removendo código do país se necessário)
    return db.query.usersTable.findMany({
      where: (table, { or, eq, like }) => or(
        eq(table.cellphone, phone),
        like(table.cellphone, `%${phone.slice(2)}%`)
      ),
    });
  },

  async getQuickReplies() {
    return db.query.whatsappQuickRepliesTable.findMany({
      orderBy: (table, { asc }) => [asc(table.shortcut)],
    });
  },

  async createQuickReply(data: typeof whatsappQuickRepliesTable.$inferInsert) {
    const [reply] = await db.insert(whatsappQuickRepliesTable).values(data).returning();
    return reply;
  },

  async deleteQuickReply(id: string) {
    await db.delete(whatsappQuickRepliesTable).where(eq(whatsappQuickRepliesTable.id, id));
  },

  async saveEmailRecord(data: typeof emailsTable.$inferInsert) {
    const [record] = await db.insert(emailsTable).values(data).returning();
    return record;
  },

  async getEmailsList(limit = 50): Promise<EmailMessage[]> {
    const list = await db
      .select({
        id: emailsTable.id,
        resendId: emailsTable.resendId,
        from: emailsTable.from,
        to: emailsTable.to,
        subject: emailsTable.subject,
        html: emailsTable.html,
        text: emailsTable.text,
        direction: emailsTable.direction,
        status: emailsTable.status,
        studentId: emailsTable.studentId,
        createdAt: emailsTable.createdAt,
        updatedAt: emailsTable.updatedAt,
        metadata: emailsTable.metadata,
        studentName: usersTable.name,
        studentPhotoUrl: usersTable.photoUrl,
        studentEmail: usersTable.email,
      })
      .from(emailsTable)
      .leftJoin(usersTable, eq(emailsTable.studentId, usersTable.id))
      .orderBy(desc(emailsTable.createdAt))
      .limit(limit);

    return list as unknown as EmailMessage[];
  },

  async findEmailByResendId(resendId: string) {
    return db.query.emailsTable.findFirst({
      where: eq(emailsTable.resendId, resendId),
    });
  },

  async updateEmailStatus(resendId: string, status: string, metadata?: unknown) {
    await db
      .update(emailsTable)
      .set({
        status,
        ...(metadata ? { metadata } : {}),
        updatedAt: new Date(),
      })
      .where(eq(emailsTable.resendId, resendId));
  },

  async getTotalUnreadCount() {
    const list = await db.query.whatsappConversationsTable.findMany({
      columns: {
        unreadCount: true,
      },
      where: (table, { eq }) => eq(table.isArchived, false),
    });
    return list.reduce((sum, item) => sum + item.unreadCount, 0);
  }
};

