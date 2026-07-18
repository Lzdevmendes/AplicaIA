import type { TaskColor, TaskStatus } from "@/lib/design/tokens";
import type { Database } from "@/lib/db/types";

export type TaskPriority = Database["public"]["Enums"]["task_priority"];

export type TaskSubtask = { id: string; text: string; done: boolean };
export type TaskActivity = {
  id: string;
  actor: "user" | "ai";
  text: string;
  created_at: string;
};

export type TaskDetail = {
  id: string;
  key: string;
  title: string;
  status: TaskStatus;
  color: TaskColor;
  label: string | null;
  priority: TaskPriority;
  due_at: string | null;
  estimate: string | null;
  description: string | null;
  sprint_name: string | null;
  linked_company: string | null;
  linked_role: string | null;
  subtasks: TaskSubtask[];
  tags: string[];
  activity: TaskActivity[];
};
