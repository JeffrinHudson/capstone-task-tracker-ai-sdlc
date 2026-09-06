export type TaskStatus = 'TODO' | 'IN_PROGRESS' | 'DONE';
export type TaskPriority = 'LOW' | 'MEDIUM' | 'HIGH';

export interface Task {
  id: string;
  title: string;
  status: TaskStatus;
  priority: TaskPriority;
  dueDate: string | null; // YYYY-MM-DD
  createdAt: string;
  updatedAt: string;
}

export interface TaskFormData {
  title: string;
  status: TaskStatus;
  priority: TaskPriority;
  dueDate: string; // '' allowed in UI; normalized to null on API
}

export type TaskListQuery = {
  q?: string;
  status?: TaskStatus[];
  priority?: TaskPriority[];
  dueBefore?: string;
  dueAfter?: string;
};
