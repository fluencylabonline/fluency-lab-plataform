import "server-only";
import { unstable_cache } from "next/cache";
import { db } from "@/lib/db";
import { systemSettingsTable, SETTINGS_CACHE_TAG } from "./settings.schema";
import { eq, sql } from "drizzle-orm";

/**
 * As configurações são uma linha única lida na landing, em todo request do
 * hub do aluno (política de inadimplência) e nos crons. Ficam no cache de
 * dados do Next até uma action de settings chamar updateTag(SETTINGS_CACHE_TAG).
 * Exceção consciente à regra "repository não conhece Next": é o único ponto
 * em que o cache e a query ficam juntos.
 */
const getOrCreateSettingsCached = unstable_cache(
  async () => {
    const existing = await db.query.systemSettingsTable.findFirst({
      where: eq(systemSettingsTable.id, "default"),
    });
    if (existing) return existing;
    const [created] = await db
      .insert(systemSettingsTable)
      .values({ id: "default" })
      .onConflictDoNothing()
      .returning();
    return (
      created ??
      (await db.query.systemSettingsTable.findFirst({ where: eq(systemSettingsTable.id, "default") }))!
    );
  },
  ["system-settings"],
  { tags: [SETTINGS_CACHE_TAG] }
);

export const settingsRepository = {
  /** Lê do cache; o JSON do cache devolve datas como string, então reconvertemos. */
  async getOrCreateSettings() {
    const row = await getOrCreateSettingsCached();
    return { ...row, createdAt: new Date(row.createdAt), updatedAt: new Date(row.updatedAt) };
  },

  async updateSettings(data: Partial<typeof systemSettingsTable.$inferInsert>) {
    const results = await db
      .update(systemSettingsTable)
      .set({
        ...data,
        updatedAt: new Date(),
      })
      .where(eq(systemSettingsTable.id, "default"))
      .returning();
    return results[0];
  },

  /**
   * Reserva a chave de uma campanha numa única instrução: só grava (e retorna true)
   * se a chave ainda não estiver na lista. Duas execuções simultâneas não passam juntas.
   */
  async claimHolidayRecessCampaign(key: string): Promise<boolean> {
    const rows = await db
      .update(systemSettingsTable)
      .set({
        holidayRecessEmailsSent: sql`${systemSettingsTable.holidayRecessEmailsSent} || ${JSON.stringify([key])}::jsonb`,
        updatedAt: new Date(),
      })
      .where(sql`${systemSettingsTable.id} = 'default' AND NOT (${systemSettingsTable.holidayRecessEmailsSent} ? ${key})`)
      .returning({ id: systemSettingsTable.id });
    return rows.length > 0;
  },

  /** Desfaz a reserva quando o envio falhou por inteiro, para o cron poder tentar de novo. */
  async releaseHolidayRecessCampaign(key: string) {
    await db
      .update(systemSettingsTable)
      .set({ holidayRecessEmailsSent: sql`${systemSettingsTable.holidayRecessEmailsSent} - ${key}` })
      .where(eq(systemSettingsTable.id, "default"));
  },
};
