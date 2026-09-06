import type { Task, TaskFormData, TaskListQuery } from './types';

const API_BASE = import.meta.env.VITE_API_URL ?? '/api';

type ApiErrorResponse = {
  error?: string;
};

async function handleResponse<T>(res: Response): Promise<T> {
  const body = (await res.json().catch(() => ({ error: res.statusText }))) as unknown;

  if (!res.ok) {
    const parsed = body as ApiErrorResponse;
    const msg = parsed?.error ?? 'Request failed';
    const err = new Error(msg);
    (err as unknown as { payload?: unknown }).payload = body;
    throw err;
  }

  return body as T;
}

function toQueryString(query?: TaskListQuery): string {
  if (!query) return '';
  const params = new URLSearchParams();

  if (query.q) params.set('q', query.q);
  if (query.status?.length) params.set('status', query.status.join(','));
  if (query.priority?.length) params.set('priority', query.priority.join(','));
  if (query.dueBefore) params.set('dueBefore', query.dueBefore);
  if (query.dueAfter) params.set('dueAfter', query.dueAfter);

  const s = params.toString();
  return s ? `?${s}` : '';
}

export async function fetchTasks(query?: TaskListQuery): Promise<Task[]> {
  const res = await fetch(`${API_BASE}/tasks${toQueryString(query)}`);
  const data = await handleResponse<{ items: Task[] }>(res);
  return data.items;
}

export async function fetchTask(id: string): Promise<Task> {
  const res = await fetch(`${API_BASE}/tasks/${id}`);
  const data = await handleResponse<{ item: Task }>(res);
  return data.item;
}

export async function createTask(data: TaskFormData): Promise<Task> {
  const res = await fetch(`${API_BASE}/tasks`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      title: data.title,
      status: data.status,
      priority: data.priority,
      // send '' through, backend normalizes to null
      dueDate: data.dueDate,
    }),
  });
  const out = await handleResponse<{ item: Task }>(res);
  return out.item;
}

export async function updateTask(id: string, data: TaskFormData): Promise<Task> {
  const res = await fetch(`${API_BASE}/tasks/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      title: data.title,
      status: data.status,
      priority: data.priority,
      dueDate: data.dueDate === '' ? null : data.dueDate,
    }),
  });
  const out = await handleResponse<{ item: Task }>(res);
  return out.item;
}

export async function updateTaskStatus(id: string, status: Task['status']): Promise<Task> {
  const res = await fetch(`${API_BASE}/tasks/${id}/status`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ status }),
  });
  const out = await handleResponse<{ item: Task }>(res);
  return out.item;
}

export async function updateTaskPriority(id: string, priority: Task['priority']): Promise<Task> {
  const res = await fetch(`${API_BASE}/tasks/${id}/priority`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ priority }),
  });
  const out = await handleResponse<{ item: Task }>(res);
  return out.item;
}
