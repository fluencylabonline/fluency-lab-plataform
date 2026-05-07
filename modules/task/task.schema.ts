import { pgTable, text, timestamp, boolean, pgEnum, integer, uuid } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { usersTable } from "../user/user.schema";
import { z } from "zod";

export const recurringCycleEnum = pgEnum("recurring_cycle", ["daily", "weekly", "biweekly", "monthly"]);

export const taskProjectsTable = pgTable("task_projects", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  color: text("color"),
  icon: text("icon"),
  createdBy: text("created_by")
    .notNull()
    .references(() => usersTable.id),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at")
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
});

export const taskStatusesTable = pgTable("task_statuses", {
  id: uuid("id").primaryKey().defaultRandom(),
  projectId: uuid("project_id").references(() => taskProjectsTable.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  color: text("color"),
  order: integer("order").notNull().default(0),
  isDefault: boolean("is_default").notNull().default(false),
  isFinal: boolean("is_final").notNull().default(false),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at")
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
});

export const tasksTable = pgTable("tasks", {
  id: uuid("id").primaryKey().defaultRandom(),
  title: text("title").notNull(),
  description: text("description"),
  dueDate: timestamp("due_date"),
  statusId: uuid("status_id").references(() => taskStatusesTable.id),
  projectId: uuid("project_id").references(() => taskProjectsTable.id, { onDelete: "cascade" }),
  isRecurring: boolean("is_recurring").notNull().default(false),
  recurringCycle: recurringCycleEnum("recurring_cycle"),
  parentTaskId: uuid("parent_task_id"), // Self-reference for recurring tasks history
  createdBy: text("created_by")
    .notNull()
    .references(() => usersTable.id),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at")
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
});

export const taskAssigneesTable = pgTable("task_assignees", {
  taskId: uuid("task_id")
    .notNull()
    .references(() => tasksTable.id, { onDelete: "cascade" }),
  userId: text("user_id")
    .notNull()
    .references(() => usersTable.id, { onDelete: "cascade" }),
}, (t) => ({
  pk: [t.taskId, t.userId],
}));

// Relations
export const taskProjectsRelations = relations(taskProjectsTable, ({ many }) => ({
  statuses: many(taskStatusesTable),
  tasks: many(tasksTable),
}));

export const taskStatusesRelations = relations(taskStatusesTable, ({ one, many }) => ({
  project: one(taskProjectsTable, {
    fields: [taskStatusesTable.projectId],
    references: [taskProjectsTable.id],
  }),
  tasks: many(tasksTable),
}));

export const tasksRelations = relations(tasksTable, ({ one, many }) => ({
  project: one(taskProjectsTable, {
    fields: [tasksTable.projectId],
    references: [taskProjectsTable.id],
  }),
  status: one(taskStatusesTable, {
    fields: [tasksTable.statusId],
    references: [taskStatusesTable.id],
  }),
  assignees: many(taskAssigneesTable),
}));

export const taskAssigneesRelations = relations(taskAssigneesTable, ({ one }) => ({
  task: one(tasksTable, {
    fields: [taskAssigneesTable.taskId],
    references: [tasksTable.id],
  }),
  user: one(usersTable, {
    fields: [taskAssigneesTable.userId],
    references: [usersTable.id],
  }),
}));

// Zod Schemas
export const createProjectSchema = z.object({
  name: z.string().min(1, "Tasks.validation.projectNameRequired"),
  color: z.string().optional(),
  icon: z.string().optional(),
  statuses: z.array(z.object({
    name: z.string().min(1),
    color: z.string().optional(),
    isDefault: z.boolean().default(false),
    isFinal: z.boolean().default(false),
  })).optional(),
});

export const createStatusSchema = z.object({
  projectId: z.string().uuid().optional().nullable(),
  name: z.string().min(1, "Tasks.validation.statusNameRequired"),
  color: z.string().optional(),
  order: z.number().int().default(0),
  isDefault: z.boolean().default(false),
  isFinal: z.boolean().default(false),
});

export const createTaskSchema = z.object({
  title: z.string().min(1, "Tasks.validation.titleRequired"),
  description: z.string().optional(),
  dueDate: z.string().optional().nullable(), // ISO string from form
  statusId: z.string().uuid().optional().nullable(),
  projectId: z.string().uuid().optional().nullable(),
  isRecurring: z.boolean().default(false),
  recurringCycle: z.enum(["daily", "weekly", "biweekly", "monthly"]).optional().nullable(),
  assigneeIds: z.array(z.string()).default([]),
});

export const updateTaskSchema = createTaskSchema.partial().extend({ id: z.string().uuid() });
export const moveTaskSchema = z.object({ id: z.string().uuid(), statusId: z.string().uuid() });
export const deleteTaskSchema = z.object({ id: z.string().uuid() });
export const deleteProjectSchema = z.object({ id: z.string().uuid() });
export const reorderStatusesSchema = z.object({
  projectId: z.string().uuid().optional().nullable(),
  statusIds: z.array(z.string().uuid()),
});

// Types
export type CreateTaskValues = z.input<typeof createTaskSchema>;
export type UpdateTaskValues = z.input<typeof updateTaskSchema>;
export type CreateProjectValues = z.input<typeof createProjectSchema>;
export type CreateStatusValues = z.input<typeof createStatusSchema>;
export type MoveTaskValues = z.input<typeof moveTaskSchema>;
export type ReorderStatusesValues = z.input<typeof reorderStatusesSchema>;

export type TaskProject = typeof taskProjectsTable.$inferSelect;
export type TaskStatus = typeof taskStatusesTable.$inferSelect;
export type Task = typeof tasksTable.$inferSelect;
export type TaskAssignee = typeof taskAssigneesTable.$inferSelect;
