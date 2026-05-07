import { db } from "@/lib/db";
import { 
  taskProjectsTable, 
  taskStatusesTable, 
  tasksTable, 
  taskAssigneesTable 
} from "./task.schema";
import { eq, asc, isNull } from "drizzle-orm";

export const taskRepository = {
  async findProjects() {
    return db.query.taskProjectsTable.findMany({
      with: {
        statuses: {
          orderBy: [asc(taskStatusesTable.order)],
        },
      },
      orderBy: [asc(taskProjectsTable.name)],
    });
  },

  async findProjectById(id: string) {
    return db.query.taskProjectsTable.findFirst({
      where: eq(taskProjectsTable.id, id),
      with: {
        statuses: {
          orderBy: [asc(taskStatusesTable.order)],
        },
      },
    });
  },

  async findStatusesByProject(projectId: string | null) {
    return db.query.taskStatusesTable.findMany({
      where: projectId ? eq(taskStatusesTable.projectId, projectId) : isNull(taskStatusesTable.projectId),
      orderBy: [asc(taskStatusesTable.order)],
    });
  },

  async findTasksByProject(projectId: string | null) {
    return db.query.tasksTable.findMany({
      where: projectId ? eq(tasksTable.projectId, projectId) : isNull(tasksTable.projectId),
      with: {
        status: true,
        assignees: {
          with: {
            user: {
              columns: {
                id: true,
                name: true,
                photoUrl: true,
              },
            },
          },
        },
      },
      orderBy: [asc(tasksTable.createdAt)],
    });
  },

  async findTaskById(id: string) {
    return db.query.tasksTable.findFirst({
      where: eq(tasksTable.id, id),
      with: {
        status: true,
        assignees: {
          with: {
            user: {
              columns: {
                id: true,
                name: true,
                photoUrl: true,
              },
            },
          },
        },
      },
    });
  },

  async createProject(data: typeof taskProjectsTable.$inferInsert) {
    const [project] = await db.insert(taskProjectsTable).values(data).returning();
    return project;
  },

  async updateProject(id: string, data: Partial<typeof taskProjectsTable.$inferInsert>) {
    const [project] = await db.update(taskProjectsTable).set(data).where(eq(taskProjectsTable.id, id)).returning();
    return project;
  },

  async deleteProject(id: string) {
    await db.delete(taskProjectsTable).where(eq(taskProjectsTable.id, id));
  },

  async createStatus(data: typeof taskStatusesTable.$inferInsert) {
    const [status] = await db.insert(taskStatusesTable).values(data).returning();
    return status;
  },

  async updateStatus(id: string, data: Partial<typeof taskStatusesTable.$inferInsert>) {
    const [status] = await db.update(taskStatusesTable).set(data).where(eq(taskStatusesTable.id, id)).returning();
    return status;
  },

  async deleteStatus(id: string) {
    await db.delete(taskStatusesTable).where(eq(taskStatusesTable.id, id));
  },

  async reorderStatuses(statusIds: string[]) {
    for (let i = 0; i < statusIds.length; i++) {
      await db.update(taskStatusesTable).set({ order: i }).where(eq(taskStatusesTable.id, statusIds[i]));
    }
  },

  async createTask(data: typeof tasksTable.$inferInsert, assigneeIds: string[]) {
    const [task] = await db.insert(tasksTable).values(data).returning();
    
    if (assigneeIds.length > 0) {
      await db.insert(taskAssigneesTable).values(
        assigneeIds.map(userId => ({
          taskId: task.id,
          userId,
        }))
      );
    }
    
    return task;
  },

  async updateTask(id: string, data: Partial<typeof tasksTable.$inferInsert>, assigneeIds?: string[]) {
    const [task] = await db.update(tasksTable).set(data).where(eq(tasksTable.id, id)).returning();
    
    if (assigneeIds) {
      await db.delete(taskAssigneesTable).where(eq(taskAssigneesTable.taskId, id));
      if (assigneeIds.length > 0) {
        await db.insert(taskAssigneesTable).values(
          assigneeIds.map(userId => ({
            taskId: id,
            userId,
          }))
        );
      }
    }
    
    return task;
  },

  async updateTaskStatus(id: string, statusId: string) {
    const [task] = await db.update(tasksTable).set({ statusId }).where(eq(tasksTable.id, id)).returning();
    return task;
  },

  async deleteTask(id: string) {
    await db.delete(tasksTable).where(eq(tasksTable.id, id));
  },

  async findAssigneeIds(taskId: string) {
    const assignees = await db.query.taskAssigneesTable.findMany({
      where: eq(taskAssigneesTable.taskId, taskId),
    });
    return assignees.map(a => a.userId);
  }
};
