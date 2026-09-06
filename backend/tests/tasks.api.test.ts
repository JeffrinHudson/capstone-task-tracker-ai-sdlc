import test from 'node:test';
import assert from 'node:assert/strict';

const BASE = process.env.API_URL ?? 'http://localhost:3001';

type Task = {
  id: string;
  title: string;
  status: 'TODO' | 'IN_PROGRESS' | 'DONE';
  priority: 'LOW' | 'MEDIUM' | 'HIGH';
  dueDate: string | null;
};

async function api<T>(path: string, init?: RequestInit): Promise<{ res: Response; body: any }> {
  const res = await fetch(`${BASE}${path}`, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...(init?.headers ?? {}),
    },
  });
  const body = await res.json().catch(() => null);
  return { res, body };
}

async function clearAllTasks(): Promise<void> {
  // Avoid blank querystrings because Express treats /api/tasks? as /api/tasks/:id in this router.
  const { res, body } = await api('/api/tasks?status=TODO');
  assert.equal(res.status, 200);
  const items = (body?.items ?? []) as Task[];
  await Promise.all(
    items.map(async (t) => {
      const del = await fetch(`${BASE}/api/tasks/${t.id}`, { method: 'DELETE' });
      assert.equal(del.status, 204);
    })
  );
}

test.beforeEach(async () => {
  await clearAllTasks();
});

test('POST /api/tasks validates title required (trimmed non-empty)', async () => {
  const { res, body } = await api('/api/tasks', {
    method: 'POST',
    body: JSON.stringify({ title: '   ' }),
  });
  assert.equal(res.status, 400);
  assert.deepEqual(body, { error: 'Title is required' });
});

test('POST /api/tasks validates title max length 120', async () => {
  const longTitle = 'a'.repeat(121);
  const { res, body } = await api('/api/tasks', {
    method: 'POST',
    body: JSON.stringify({ title: longTitle }),
  });
  assert.equal(res.status, 400);
  assert.deepEqual(body, { error: 'Title must be <= 120 characters' });
});

test('POST /api/tasks validates completed boolean when present', async () => {
  const { res, body } = await api('/api/tasks', {
    method: 'POST',
    body: JSON.stringify({ title: 'X', completed: 'nope' }),
  });
  assert.equal(res.status, 400);
  assert.deepEqual(body, { error: 'Invalid input' });
});

test('GET /api/tasks/:id validates id format', async () => {
  const { res, body } = await api('/api/tasks/0');
  assert.equal(res.status, 400);
  assert.deepEqual(body, { error: 'Invalid id' });
});

test('GET /api/tasks/:id returns 404 {error:string} for missing', async () => {
  const { res, body } = await api('/api/tasks/ck8x7qf4n000001l9d5g7h8ij');
  assert.equal(res.status, 404);
  assert.deepEqual(body, { error: 'Task not found' });
});
