import { User } from "../user/user.schema";
import { Task, TaskProject, TaskStatus } from "./task.schema";
export type { TaskStatus };

export type TaskProjectWithStatuses = TaskProject & {
  statuses: TaskStatus[];
};

export type TaskWithAssignees = Task & {
  status: TaskStatus | null;
  assignees: {
    user: Pick<User, "id" | "name" | "photoUrl">;
  }[];
};
