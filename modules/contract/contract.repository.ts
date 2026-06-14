import { db } from "@/lib/db";
import { 
  contractTemplatesTable, 
  contractInstancesTable, 
  contractSignaturesMetadataTable,
  schoolSettingsTable 
} from "./contract.schema";
import { eq, and, desc } from "drizzle-orm";

/**
 * Repositório de Contratos (FluencyLab)
 * 
 * Comunicação pura com o banco de dados via Drizzle.
 */
export const contractRepository = {
  // --- Templates ---
  async findTemplateById(id: string) {
    return db.query.contractTemplatesTable.findFirst({
      where: eq(contractTemplatesTable.id, id),
    });
  },

  async findActiveTemplateByType(type: "student" | "teacher", region: "BR" | "US") {
    return db.query.contractTemplatesTable.findFirst({
      where: and(
        eq(contractTemplatesTable.type, type),
        eq(contractTemplatesTable.region, region),
        eq(contractTemplatesTable.isActive, true)
      ),
      orderBy: [desc(contractTemplatesTable.createdAt)],
    });
  },

  async findLastTemplateVersion(name: string, region: "BR" | "US") {
    return db.query.contractTemplatesTable.findFirst({
      where: and(
        eq(contractTemplatesTable.name, name),
        eq(contractTemplatesTable.region, region)
      ),
      orderBy: [desc(contractTemplatesTable.version)],
    });
  },

  async insertTemplate(data: typeof contractTemplatesTable.$inferInsert) {
    const [inserted] = await db.insert(contractTemplatesTable).values(data).returning();
    return inserted;
  },

  async deactivateTemplatesByName(name: string, region: "BR" | "US") {
    return db.update(contractTemplatesTable)
      .set({ isActive: false })
      .where(and(
        eq(contractTemplatesTable.name, name),
        eq(contractTemplatesTable.region, region)
      ));
  },

  async deactivateTemplatesByTypeAndRegion(type: "student" | "teacher", region: "BR" | "US") {
    return db.update(contractTemplatesTable)
      .set({ isActive: false })
      .where(and(
        eq(contractTemplatesTable.type, type),
        eq(contractTemplatesTable.region, region)
      ));
  },

  async activateTemplate(id: string, type: "student" | "teacher", region: "BR" | "US") {
    return db.transaction(async (tx) => {
      await tx.update(contractTemplatesTable)
        .set({ isActive: false })
        .where(and(
          eq(contractTemplatesTable.type, type),
          eq(contractTemplatesTable.region, region)
        ));
      const [updated] = await tx.update(contractTemplatesTable)
        .set({ isActive: true })
        .where(eq(contractTemplatesTable.id, id))
        .returning();
      return updated;
    });
  },

  async countTemplateInstances(templateId: string) {
    const instances = await db.query.contractInstancesTable.findMany({
      where: eq(contractInstancesTable.templateId, templateId),
      columns: { id: true },
    });
    return instances.length;
  },

  async deleteTemplate(id: string) {
    const [deleted] = await db.delete(contractTemplatesTable)
      .where(eq(contractTemplatesTable.id, id))
      .returning();
    return deleted;
  },

  // --- Instâncias ---
  async findInstanceById(id: string) {
    return db.query.contractInstancesTable.findFirst({
      where: eq(contractInstancesTable.id, id),
      with: {
        template: true,
        user: true,
      },
    });
  },

  async findUserInstances(userId: string) {
    return db.query.contractInstancesTable.findMany({
      where: eq(contractInstancesTable.userId, userId),
      orderBy: [desc(contractInstancesTable.createdAt)],
    });
  },

  async findInstanceBySubscriptionId(subscriptionId: string) {
    return db.query.contractInstancesTable.findFirst({
      where: eq(contractInstancesTable.subscriptionId, subscriptionId),
      orderBy: [desc(contractInstancesTable.createdAt)],
      with: {
        user: true,
        template: true,
      },
    });
  },

  async findInstanceByIntegrityHash(hash: string) {
    return db.query.contractInstancesTable.findFirst({
      where: eq(contractInstancesTable.integrityHash, hash),
      with: {
        user: true,
        template: true,
        signaturesMetadata: true,
      },
    });
  },

  async insertInstance(data: typeof contractInstancesTable.$inferInsert) {
    const [inserted] = await db.insert(contractInstancesTable).values(data).returning();
    return inserted;
  },

  async updateInstance(id: string, data: Partial<typeof contractInstancesTable.$inferSelect>) {
    const [updated] = await db
      .update(contractInstancesTable)
      .set(data)
      .where(eq(contractInstancesTable.id, id))
      .returning();
    return updated;
  },

  async findPendingOnboardingInstance(userId: string) {
    return db.query.contractInstancesTable.findFirst({
      where: and(
        eq(contractInstancesTable.userId, userId),
        eq(contractInstancesTable.status, "pending")
      ),
      with: {
        template: true
      }
    });
  },

  // --- Metadados e Auditoria ---
  async saveSignatureMetadata(data: typeof contractSignaturesMetadataTable.$inferInsert) {
    return db.insert(contractSignaturesMetadataTable).values(data);
  },

  // --- Configurações da Escola ---
  async getSchoolSettings() {
    return db.query.schoolSettingsTable.findFirst();
  },

  async updateSchoolSettings(id: string, data: Partial<typeof schoolSettingsTable.$inferSelect>) {
    const [updated] = await db
      .update(schoolSettingsTable)
      .set(data)
      .where(eq(schoolSettingsTable.id, id))
      .returning();
    return updated;
  },

  async insertSchoolSettings(data: typeof schoolSettingsTable.$inferInsert) {
    const [inserted] = await db
      .insert(schoolSettingsTable)
      .values(data)
      .returning();
    return inserted;
  },

  async findActiveContractByUserId(userId: string) {
    return db.query.contractInstancesTable.findFirst({
      where: and(
        eq(contractInstancesTable.userId, userId),
        eq(contractInstancesTable.status, "signed")
      ),
      orderBy: [desc(contractInstancesTable.createdAt)],
      with: {
        template: true,
      },
    });
  },

  async findAllTemplates() {
    return db.query.contractTemplatesTable.findMany({
      orderBy: [desc(contractTemplatesTable.createdAt)],
    });
  },

  async findAllInstances() {
    return db.query.contractInstancesTable.findMany({
      orderBy: [desc(contractInstancesTable.createdAt)],
      with: {
        template: true,
        user: true,
      },
    });
  },
};


