import type { Task, TaskFormData } from './types';

const API_BASE = import.meta.env.VITE_API_URL ?? 'http://localhost:3001';

type ApiErrorResponse = {
  error?: {
    code?: string;
    message?: string;
    fields?: Record<string, string>;
  };
};

async function handleResponse<T>(res: Response): Promise<T> {
  const body = (await res.json().catch(() => ({ error: { message: res.statusText } }))) as unknown;

  if (!res.ok) {
    const parsed = body as ApiErrorResponse;
    const msg = parsed?.error?.message ?? 'Request failed';
    const err = new Error(msg);
    (err as unknown as { payload?: unknown }).payload = body;
    throw err;
  }

  return body as T;
}

export async function fetchTasks(): Promise<Task[]> {
  const res = await fetch(`${API_BASE}/api/tasks`);
  const data = await handleResponse<{ items: Task[] }>(res);
  return data.items;
}

export async function fetchTask(id: string): Promise<Task> {
  const res = await fetch(`${API_BASE}/api/tasks/${id}`);
  const data = await handleResponse<{ item: Task }>(res);
  return data.item;
}

export async function createTask(data: TaskFormData): Promise<Task> {
  const res = await fetch(`${API_BASE}/api/tasks`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      title: data.title,
      status: data.status,
      // send '' through, backend normalizes to null
      dueDate: data.dueDate,
    }),
  });
  const out = await handleResponse<{ item: Task }>(res);
  return out.item;
}

export async function updateTask(id: string, data: TaskFormData): Promise<Task> {
  const res = await fetch(`${API_BASE}/api/tasks/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      title: data.title,
      status: data.status,
      dueDate: data.dueDate === '' ? null : data.dueDate,
    }),
  });
  const out = await handleResponse<{ item: Task }>(res);
  return out.item;
}
