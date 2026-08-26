const API = process.env.API_URL ?? 'http://localhost:3000';

export interface Task {
  id: string;
  title: string;
  status: 'OPEN' | 'DONE';
  priority: 'LOW' | 'MEDIUM' | 'HIGH';
  dueDate: string | null;
}

export interface CreatePayload {
  title: string;
  description?: string;
  priority?: 'LOW' | 'MEDIUM' | 'HIGH';
  dueDate?: string;
}

export async function apiCreateTask(data: CreatePayload): Promise<Task> {
  const res = await fetch(`${API}/api/tasks`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error(`apiCreateTask failed: ${await res.text()}`);
  return res.json() as Promise<Task>;
}

export async function apiPatchStatus(id: string, status: 'OPEN' | 'DONE'): Promise<Task> {
  const res = await fetch(`${API}/api/tasks/${id}/status`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ status }),
  });
  if (!res.ok) throw new Error(`apiPatchStatus failed: ${await res.text()}`);
  return res.json() as Promise<Task>;
}

export async function clearAllTasks(): Promise<void> {
  const res = await fetch(`${API}/api/tasks`);
  if (!res.ok) throw new Error(`clearAllTasks: GET /api/tasks failed`);
  const tasks = (await res.json()) as Task[];
  await Promise.all(
    tasks.map((t) =>
      fetch(`${API}/api/tasks/${t.id}`, { method: 'DELETE' }),
    ),
  );
}
