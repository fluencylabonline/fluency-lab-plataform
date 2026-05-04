import { pgTable, text, timestamp, uuid, integer } from "drizzle-orm/pg-core";
import { createSelectSchema, createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { usersTable } from "@/modules/user/user.schema";

// --- Tables ---

export const notebooksTable = pgTable("notebooks", {
  id: uuid("id").primaryKey().defaultRandom(),
  title: text("title").notNull(),

  // Ownership
  studentId: text("student_id")
    .notNull()
    .references(() => usersTable.id, { onDelete: "cascade" }),
  teacherId: text("teacher_id")
    .notNull()
    .references(() => usersTable.id, { onDelete: "cascade" }),

  content: text("content"),

  // Audit
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at")
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
});

export const notebookSessionsTable = pgTable("notebook_sessions", {
  id: uuid("id").primaryKey().defaultRandom(),
  notebookId: uuid("notebook_id")
    .notNull()
    .references(() => notebooksTable.id, { onDelete: "cascade" }),
  userId: text("user_id")
    .notNull()
    .references(() => usersTable.id, { onDelete: "cascade" }),
  
  startedAt: timestamp("started_at").notNull().defaultNow(),
  lastHeartbeatAt: timestamp("last_heartbeat_at").notNull().defaultNow(),
  endedAt: timestamp("ended_at"),
  
  durationSeconds: integer("duration_seconds").default(0),
});

/**
 * Tracks assets (images) uploaded to notebooks for storage management.
 */
export const notebookAssetsTable = pgTable("notebook_assets", {
  id: uuid("id").primaryKey().defaultRandom(),
  notebookId: uuid("notebook_id")
    .notNull()
    .references(() => notebooksTable.id, { onDelete: "cascade" }),
  filePath: text("file_path").notNull().unique(), // The path in Firebase Storage (e.g., 'notebooks/abc/image.png')
  fileName: text("file_name").notNull(),
  contentType: text("content_type").notNull(),
  sizeBytes: integer("size_bytes").notNull(),
  uploadedBy: text("uploaded_by").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  deletedAt: timestamp("deleted_at"), // If set, it's marked for cleanup
});

// --- Drizzle-Zod base schemas ---
export const selectNotebookSchema = createSelectSchema(notebooksTable);
export const insertNotebookSchema = createInsertSchema(notebooksTable);
export const selectNotebookSessionSchema = createSelectSchema(notebookSessionsTable);

// --- Validation Schemas ---
export const createNotebookSchema = z.object({
  title: z.string().min(1, "Notebook.validation.titleRequired").max(100),
  studentId: z.string().min(1),
});

// --- Types ---
export type Notebook = typeof notebooksTable.$inferSelect;
export type NewNotebook = typeof notebooksTable.$inferInsert;
export type CreateNotebookValues = z.input<typeof createNotebookSchema>;

export type NotebookSession = typeof notebookSessionsTable.$inferSelect;
export type NewNotebookSession = typeof notebookSessionsTable.$inferInsert;
