import { pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";
import { createSelectSchema, createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { usersTable } from "@/modules/user/user.schema";

export const audiosTable = pgTable("audios", {
  id: uuid("id").primaryKey().defaultRandom(),
  title: text("title").notNull(),
  language: text("language").notNull(),
  level: text("level").notNull(),
  transcription: text("transcription").notNull(),
  fileUrl: text("file_url").notNull(),
  filePath: text("file_path").notNull(),
  uploadedBy: text("uploaded_by")
    .notNull()
    .references(() => usersTable.id, { onDelete: "cascade" }),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const selectAudioSchema = createSelectSchema(audiosTable);
export const insertAudioSchema = createInsertSchema(audiosTable);

export const createAudioSchema = z.object({
  title: z.string().min(1, "O título é obrigatório").max(100, "O título pode ter no máximo 100 caracteres"),
  language: z.string().min(1, "O idioma é obrigatório"),
  level: z.string().min(1, "O nível aproximado é obrigatório"),
  transcription: z.string().min(1, "A transcrição é obrigatória"),
  fileUrl: z.string().url("A URL do arquivo é inválida"),
  filePath: z.string().min(1, "O caminho do arquivo no Storage é obrigatório"),
});

export type Audio = typeof audiosTable.$inferSelect;
export type NewAudio = typeof audiosTable.$inferInsert;
export type CreateAudioValues = z.input<typeof createAudioSchema>;
