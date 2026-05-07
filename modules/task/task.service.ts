import { taskRepository } from "./task.repository";
import { userRepository } from "../user/user.repository";
import { CreateTaskValues, UpdateTaskValues, CreateProjectValues, CreateStatusValues, MoveTaskValues, ReorderStatusesValues } from "./task.schema";
import { notificationService } from "../notification/notification.service";
import { addDays, addWeeks, addMonths } from "date-fns";

export const taskService = {
  async getProjects() {
    return taskRepository.findProjects();
  },

  async getProjectWithDetails(id: string) {
    return taskRepository.findProjectById(id);
  },

  async getTasksByProject(projectId: string | null) {
    return taskRepository.findTasksByProject(projectId);
  },

  async getTaskById(id: string) {
    return taskRepository.findTaskById(id);
  },

  async createProject(userId: string, values: CreateProjectValues) {
    const { statuses, ...data } = values;
    const project = await taskRepository.createProject({
      ...data,
      createdBy: userId,
    });

    if (statuses && statuses.length > 0) {
      for (let i = 0; i < statuses.length; i++) {
        await taskRepository.createStatus({
          ...statuses[i],
          projectId: project.id,
          order: i,
        });
      }
    } else {
      // Default statuses
      const defaults = [
        { name: "Pendente", color: "#94a3b8", isDefault: true, isFinal: false },
        { name: "Em progresso", color: "#3b82f6", isDefault: false, isFinal: false },
        { name: "Concluído", color: "#10b981", isDefault: false, isFinal: true },
      ];
      for (let i = 0; i < defaults.length; i++) {
        await taskRepository.createStatus({
          ...defaults[i],
          projectId: project.id,
          order: i,
        });
      }
    }

    return project;
  },

  async createStatus(data: CreateStatusValues) {
    return taskRepository.createStatus({
      ...data,
      projectId: data.projectId || null,
    });
  },

  async getStatuses(projectId: string | null) {
    return taskRepository.findStatusesByProject(projectId);
  },

  async getFinalStatus(projectId: string | null) {
    const statuses = await taskRepository.findStatusesByProject(projectId);
    return statuses.find(s => s.isFinal) || statuses[statuses.length - 1];
  },

  async reorderStatuses(data: ReorderStatusesValues) {
    return taskRepository.reorderStatuses(data.statusIds);
  },

  async createTask(userId: string, values: CreateTaskValues) {
    const { assigneeIds = [], dueDate, ...data } = values;
    
    let statusId = values.statusId;
    
    // If no statusId, find default for project
    if (!statusId) {
      const statuses = await taskRepository.findStatusesByProject(values.projectId || null);
      const defaultStatus = statuses.find(s => s.isDefault) || statuses[0];
      statusId = defaultStatus?.id;
    }

    const task = await taskRepository.createTask({
      ...data,
      statusId: statusId || null,
      dueDate: dueDate ? new Date(dueDate) : null,
      createdBy: userId,
    }, assigneeIds);

    // Notify assignees (excluding creator)
    const targetUserIds = assigneeIds.filter(id => id !== userId);
    if (targetUserIds.length > 0) {
      await notificationService.sendNotification({
        title: "Nova tarefa atribuída",
        body: `Você recebeu uma nova tarefa: ${task.title}`,
        actionUrl: `/hub/admin/tasks?task=${task.id}`,
        targetType: "specific",
        userIds: targetUserIds,
        channels: { push: true, inApp: true },
      });
    }

    return task;
  },

  async updateTask(userId: string, values: UpdateTaskValues) {
    const { id, assigneeIds, dueDate, ...data } = values;
    if (!id) throw new Error("Task ID is required");

    const existingTask = await taskRepository.findTaskById(id);
    if (!existingTask) throw new Error("Task not found");

    const task = await taskRepository.updateTask(id, {
      ...data,
      dueDate: dueDate ? new Date(dueDate) : (dueDate === null ? null : undefined),
    }, assigneeIds);

    // Notify all assignees
    const allAssignees = assigneeIds ?? await taskRepository.findAssigneeIds(id);
    if (allAssignees.length > 0) {
      await notificationService.sendNotification({
        title: "Tarefa atualizada",
        body: `A tarefa "${task.title}" foi atualizada`,
        actionUrl: `/hub/admin/tasks?task=${task.id}`,
        targetType: "specific",
        userIds: allAssignees,
        channels: { push: true, inApp: true },
      });
    }

    return task;
  },

  async moveTask(userId: string, values: MoveTaskValues) {
    const { id, statusId } = values;
    
    const task = await taskRepository.findTaskById(id);
    if (!task) throw new Error("Task not found");

    // Authorization Check
    const user = await userRepository.findById(userId);
    if (!user) throw new Error("User not found");

    const isManager = user.role === "admin" || user.role === "manager";
    const isAssignee = task.assignees.some(a => a.user.id === userId);
    const isCreator = task.createdBy === userId;

    if (!isManager && !isAssignee && !isCreator) {
      throw new Error("You don't have permission to move this task");
    }

    const targetStatus = (await taskRepository.findStatusesByProject(task.projectId))
      .find(s => s.id === statusId);
    
    if (!targetStatus) throw new Error("Target status not found");

    const updatedTask = await taskRepository.updateTaskStatus(id, statusId);

    // Logic for recurring tasks
    if (targetStatus.isFinal && task.isRecurring && task.recurringCycle) {
      let nextDueDate: Date | null = null;
      if (task.dueDate) {
        const baseDate = new Date(task.dueDate);
        switch (task.recurringCycle) {
          case "daily": nextDueDate = addDays(baseDate, 1); break;
          case "weekly": nextDueDate = addWeeks(baseDate, 1); break;
          case "biweekly": nextDueDate = addWeeks(baseDate, 2); break;
          case "monthly": nextDueDate = addMonths(baseDate, 1); break;
        }
      }

      // Create clone in first column
      const statuses = await taskRepository.findStatusesByProject(task.projectId);
      const firstStatus = statuses.find(s => s.isDefault) || statuses[0];

      if (firstStatus) {
        const assigneeIds = task.assignees.map(a => a.user.id);
        await taskRepository.createTask({
          title: task.title,
          description: task.description,
          dueDate: nextDueDate,
          statusId: firstStatus.id,
          projectId: task.projectId,
          isRecurring: true,
          recurringCycle: task.recurringCycle,
          parentTaskId: task.id,
          createdBy: task.createdBy,
        }, assigneeIds);
      }
    }

    // Notify assignees
    const assigneeIds = await taskRepository.findAssigneeIds(id);
    if (assigneeIds.length > 0) {
      await notificationService.sendNotification({
        title: "Status da tarefa atualizado",
        body: `A tarefa "${task.title}" foi movida para ${targetStatus.name}`,
        actionUrl: `/hub/admin/tasks?task=${task.id}`,
        targetType: "specific",
        userIds: assigneeIds,
        channels: { push: true, inApp: true },
      });
    }

    return updatedTask;
  },

  async deleteTask(id: string) {
    return taskRepository.deleteTask(id);
  },

  async deleteProject(id: string) {
    return taskRepository.deleteProject(id);
  },

  async getAssignableUsers() {
    const admins = await userRepository.findAllByRole("admin");
    const managers = await userRepository.findAllByRole("manager");
    return [...admins, ...managers];
  }
};
