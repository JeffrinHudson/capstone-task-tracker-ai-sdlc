import type { Task, TaskFormData } from './types';

const BASE = (import.meta.env.VITE_API_URL ?? 'http://localhost:3000') + '/api/tasks';

async function handleResponse<T>(res: Response): Promise<T> {
  if (res.status === 204) return undefined as T;
  const body = await res.json().catch(() => ({ message: res.statusText }));
  if (!res.ok) throw new Error(body?.message ?? 'Request failed');
  return body as T;
}

export async function fetchTasks(params: {
  q?: string;
  status?: string;
  sortBy?: string;
  sortDir?: string;
}): Promise<Task[]> {
  const search = new URLSearchParams();
  if (params.q) search.set('q', params.q);
  if (params.status && params.status !== 'ALL') search.set('status', params.status);
  if (params.sortBy) search.set('sortBy', params.sortBy);
  if (params.sortDir) search.set('sortDir', params.sortDir);
  const qs = search.toString();
  const res = await fetch(`${BASE}${qs ? '?' + qs : ''}`);
  return handleResponse<Task[]>(res);
}

export async function createTask(data: TaskFormData): Promise<Task> {
  const res = await fetch(BASE, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      title: data.title,
      description: data.description || undefined,
      priority: data.priority,
      dueDate: data.dueDate || undefined,
    }),
  });
  return handleResponse<Task>(res);
}

export async function updateTask(id: string, data: TaskFormData & { status: string }): Promise<Task> {
  const res = await fetch(`${BASE}/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      title: data.title,
      description: data.description || undefined,
      status: data.status,
      priority: data.priority,
      dueDate: data.dueDate || undefined,
    }),
  });
  return handleResponse<Task>(res);
}

export async function patchTaskStatus(id: string, status: 'OPEN' | 'DONE'): Promise<Task> {
  const res = await fetch(`${BASE}/${id}/status`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ status }),
  });
  return handleResponse<Task>(res);
}

export async function deleteTask(id: string): Promise<void> {
  const res = await fetch(`${BASE}/${id}`, { method: 'DELETE' });
  return handleResponse<void>(res);
}
