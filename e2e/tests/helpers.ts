const API = process.env.API_URL ?? 'http://localhost:3001';

type TaskStatus = 'TODO' | 'IN_PROGRESS' | 'DONE';

export interface Task {
  id: string;
  title: string;
  status: TaskStatus;
  dueDate: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreatePayload {
  title: string;
  status?: TaskStatus;
  dueDate?: string | null;
}

export async function apiCreateTask(data: CreatePayload): Promise<Task> {
  const res = await fetch(`${API}/api/tasks`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error(`apiCreateTask failed: ${await res.text()}`);
  const out = (await res.json()) as { item: Task };
  return out.item;
}

export async function clearAllTasks(): Promise<void> {
  const res = await fetch(`${API}/api/tasks`);
  if (!res.ok) throw new Error(`clearAllTasks: GET /api/tasks failed`);
  const out = (await res.json()) as { items: Task[] };
  await Promise.all(out.items.map((t) => fetch(`${API}/api/tasks/${t.id}`, { method: 'DELETE' })));
}
