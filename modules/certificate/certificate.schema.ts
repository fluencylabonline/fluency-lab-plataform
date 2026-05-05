import { pgTable, text, timestamp, integer, uuid, varchar } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { usersTable } from "../user/user.schema";

export const certificatesTable = pgTable("certificates", {
  id: uuid("id").primaryKey().defaultRandom(),
  code: varchar("code", { length: 20 }).notNull().unique(),
  studentId: text("student_id").references(() => usersTable.id, { onDelete: "cascade" }).notNull(),
  studentName: text("student_name").notNull(),
  studentEmail: text("student_email").notNull(),
  courseLanguage: text("course_language").notNull(),
  hours: integer("hours").notNull(),
  levelCode: text("level_code").notNull(), // A1, A2, etc.
  levelDescription: text("level_description").notNull(),
  startDate: timestamp("start_date"),
  endDate: timestamp("end_date"),
  issuedAt: timestamp("issued_at").defaultNow().notNull(),
  issuedBy: text("issued_by").references(() => usersTable.id).notNull(),
  pdfUrl: text("pdf_url"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const certificatesRelations = relations(certificatesTable, ({ one }) => ({
  student: one(usersTable, {
    fields: [certificatesTable.studentId],
    references: [usersTable.id],
    relationName: "student_certificates",
  }),
  issuer: one(usersTable, {
    fields: [certificatesTable.issuedBy],
    references: [usersTable.id],
    relationName: "issued_certificates",
  }),
}));

export type Certificate = typeof certificatesTable.$inferSelect;
export type NewCertificate = typeof certificatesTable.$inferInsert;
