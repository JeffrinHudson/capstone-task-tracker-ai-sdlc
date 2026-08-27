export type TaskStatus = 'TODO' | 'IN_PROGRESS' | 'DONE';

export interface Task {
  id: string;
  title: string;
  status: TaskStatus;
  dueDate: string | null; // YYYY-MM-DD
  createdAt: string;
  updatedAt: string;
}

export interface TaskFormData {
  title: string;
  status: TaskStatus;
  dueDate: string; // '' allowed in UI; normalized to null on API
}
