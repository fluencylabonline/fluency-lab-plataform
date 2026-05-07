"use server";

import { z } from "zod";
import { managerAction, protectedAction } from "@/lib/safe-action";
import { 
  createTaskSchema, 
  updateTaskSchema, 
  moveTaskSchema, 
  deleteTaskSchema,
  createProjectSchema,
  deleteProjectSchema,
  createStatusSchema,
  reorderStatusesSchema,
  Task,
  TaskProject,
  TaskStatus
} from "./task.schema";
import { TaskProjectWithStatuses, TaskWithAssignees } from "./task.types";
import { User } from "../user/user.schema";
import { taskService } from "./task.service";
import { revalidatePath } from "next/cache";

// Projects
export const getProjectsAction = protectedAction.action(async () => {
  const projects = await taskService.getProjects();
  return { success: true, data: projects } as { success: boolean; data: TaskProjectWithStatuses[]; error?: string };
});

export const getAssignableUsersAction = protectedAction.action(async () => {
  const users = await taskService.getAssignableUsers();
  return { success: true, data: users } as { success: boolean; data: User[]; error?: string };
});

export const createProjectAction = managerAction
  .schema(createProjectSchema)
  .action(async ({ parsedInput, ctx }) => {
    const project = await taskService.createProject(ctx.user.id, parsedInput);
    revalidatePath("/hub/admin/tasks");
    revalidatePath("/hub/manager/tasks");
    return { success: true, data: project } as { success: boolean; data: TaskProject; error?: string };
  });

export const deleteProjectAction = managerAction
  .schema(deleteProjectSchema)
  .action(async ({ parsedInput }) => {
    await taskService.deleteProject(parsedInput.id);
    revalidatePath("/hub/admin/tasks");
    revalidatePath("/hub/manager/tasks");
    return { success: true } as { success: boolean; error?: string };
  });

// Statuses
export const createStatusAction = managerAction
  .schema(createStatusSchema)
  .action(async ({ parsedInput }) => {
    const status = await taskService.createStatus(parsedInput);
    revalidatePath("/hub/admin/tasks");
    revalidatePath("/hub/manager/tasks");
    return { success: true, data: status } as { success: boolean; data: TaskStatus; error?: string };
  });

export const getStatusesAction = protectedAction
  .schema(z.object({ projectId: z.string().uuid().nullable() }))
  .action(async ({ parsedInput }) => {
    const statuses = await taskService.getStatuses(parsedInput.projectId);
    return { success: true, data: statuses } as { success: boolean; data: TaskStatus[]; error?: string };
  });

export const reorderStatusesAction = managerAction
  .schema(reorderStatusesSchema)
  .action(async ({ parsedInput }) => {
    await taskService.reorderStatuses(parsedInput);
    revalidatePath("/hub/admin/tasks");
    revalidatePath("/hub/manager/tasks");
    return { success: true } as { success: boolean; error?: string };
  });

// Tasks
export const getTasksByProjectAction = protectedAction
  .schema(z.object({ projectId: z.string().uuid().nullable() }))
  .action(async ({ parsedInput }) => {
    const tasks = await taskService.getTasksByProject(parsedInput.projectId);
    return { success: true, data: tasks } as { success: boolean; data: TaskWithAssignees[]; error?: string };
  });

export const createTaskAction = managerAction
  .schema(createTaskSchema)
  .action(async ({ parsedInput, ctx }) => {
    const task = await taskService.createTask(ctx.user.id, parsedInput);
    revalidatePath("/hub/admin/tasks");
    revalidatePath("/hub/manager/tasks");
    return { success: true, data: task } as { success: boolean; data: Task; error?: string };
  });

export const updateTaskAction = managerAction
  .schema(updateTaskSchema)
  .action(async ({ parsedInput, ctx }) => {
    const task = await taskService.updateTask(ctx.user.id, parsedInput);
    revalidatePath("/hub/admin/tasks");
    revalidatePath("/hub/manager/tasks");
    return { success: true, data: task } as { success: boolean; data: Task; error?: string };
  });

export const moveTaskAction = protectedAction
  .schema(moveTaskSchema)
  .action(async ({ parsedInput, ctx }) => {
    const task = await taskService.moveTask(ctx.user.id, parsedInput);
    revalidatePath("/hub/admin/tasks");
    revalidatePath("/hub/manager/tasks");
    return { success: true, data: task } as { success: boolean; data: Task; error?: string };
  });

export const completeTaskAction = protectedAction
  .schema(z.object({ id: z.string().uuid() }))
  .action(async ({ parsedInput, ctx }) => {
    const task = await taskService.getTaskById(parsedInput.id);
    if (!task) throw new Error("Task not found");
    
    const finalStatus = await taskService.getFinalStatus(task.projectId);
    if (!finalStatus) throw new Error("Final status not found");

    const updatedTask = await taskService.moveTask(ctx.user.id, { 
      id: parsedInput.id, 
      statusId: finalStatus.id 
    });
    
    revalidatePath("/hub/admin/tasks");
    revalidatePath("/hub/manager/tasks");
    
    return { success: true, data: updatedTask } as { success: boolean; data: Task; error?: string };
  });

export const deleteTaskAction = managerAction
  .schema(deleteTaskSchema)
  .action(async ({ parsedInput }) => {
    await taskService.deleteTask(parsedInput.id);
    revalidatePath("/hub/admin/tasks");
    revalidatePath("/hub/manager/tasks");
    return { success: true } as { success: boolean; error?: string };
  });
