import { useCallback, useEffect, useMemo, useState } from 'react';
import type { Task, TaskFormData, TaskStatus } from './types';
import { createTask, fetchTasks, updateTask } from './api';

const STATUSES: TaskStatus[] = ['TODO', 'IN_PROGRESS', 'DONE'];

type ApiErrorResponse = {
  error?: {
    code?: string;
    message?: string;
    fields?: Record<string, string>;
  };
};

function formatDueDate(value: string | null): string {
  return value ?? '—';
}

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

export default function App() {
  const [items, setItems] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');

  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Task | null>(null);

  const [form, setForm] = useState<TaskFormData>({
    title: '',
    status: 'TODO',
    dueDate: '',
  });
  const [saving, setSaving] = useState(false);

  const [formError, setFormError] = useState('');
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const load = useCallback(async () => {
    setLoading(true);
    setLoadError('');
    try {
      const data = await fetchTasks();
      setItems(data);
    } catch (e) {
      setLoadError(e instanceof Error ? e.message : 'Failed to load');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const formTitle = useMemo(() => (editing ? 'Edit Task' : 'New Task'), [editing]);

  function openCreate() {
    setEditing(null);
    setForm({ title: '', status: 'TODO', dueDate: '' });
    setFormError('');
    setFieldErrors({});
    setShowForm(true);
  }

  function openEdit(t: Task) {
    setEditing(t);
    setForm({ title: t.title, status: t.status, dueDate: t.dueDate ?? '' });
    setFormError('');
    setFieldErrors({});
    setShowForm(true);
  }

  function closeForm() {
    setShowForm(false);
  }

  async function submit() {
    setSaving(true);
    setFormError('');
    setFieldErrors({});

    try {
      const saved = editing ? await updateTask(editing.id, form) : await createTask(form);

      if (editing) {
        setItems((prev) => prev.map((x) => (x.id === saved.id ? saved : x)));
      } else {
        setItems((prev) => [saved, ...prev]);
      }
      setShowForm(false);
    } catch (e: unknown) {
      const err = e as Error & { payload?: unknown };
      const payload = err.payload;
      if (isObject(payload)) {
        const fields = (payload as ApiErrorResponse)?.error?.fields;
        if (fields && typeof fields === 'object') {
          setFieldErrors(fields);
        }
      }
      setFormError(err.message || 'Save failed');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div data-testid="tasks-list-page" style={styles.page}>
      <header style={styles.header}>
        <h1 style={styles.h1}>Tasks</h1>
        <button data-testid="tasks-new-btn" onClick={openCreate} style={styles.primaryBtn}>
          New Task
        </button>
      </header>

      {loadError && (
        <div data-testid="tasks-load-error" style={styles.errorBanner}>
          {loadError}{' '}
          <button onClick={load} style={styles.linkBtn}>
            Retry
          </button>
        </div>
      )}

      {loading ? (
        <div style={{ padding: 12 }}>Loading…</div>
      ) : items.length === 0 ? (
        <div data-testid="tasks-empty" style={styles.empty}>
          <div style={{ marginBottom: 12 }}>No tasks yet</div>
          <button data-testid="tasks-new-btn" onClick={openCreate} style={styles.primaryBtn}>
            New Task
          </button>
        </div>
      ) : (
        <table data-testid="tasks-table" style={styles.table}>
          <thead>
            <tr>
              <th style={styles.th}>Title</th>
              <th style={styles.th}>Status</th>
              <th style={styles.th}>Due Date</th>
              <th style={styles.th}></th>
            </tr>
          </thead>
          <tbody>
            {items.map((t) => (
              <tr key={t.id} data-testid={`task-row-${t.id}`}>
                <td data-testid={`task-title-${t.id}`} style={styles.td}>
                  {t.title}
                </td>
                <td data-testid={`task-status-${t.id}`} style={styles.td}>
                  <span style={styles.badge}>{t.status}</span>
                </td>
                <td data-testid={`task-dueDate-${t.id}`} style={styles.td}>
                  {formatDueDate(t.dueDate)}
                </td>
                <td style={{ ...styles.td, textAlign: 'right' }}>
                  <button
                    data-testid={`task-edit-${t.id}`}
                    onClick={() => openEdit(t)}
                    style={styles.linkBtn}
                  >
                    Edit
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {showForm && (
        <div style={styles.overlay}>
          <div data-testid="task-form-page" style={styles.modal}>
            <h2 style={{ marginTop: 0 }}>{formTitle}</h2>

            {formError && (
              <div data-testid="task-form-error" style={styles.errorBanner}>
                {formError}
              </div>
            )}

            <div style={styles.field}>
              <label style={styles.label} htmlFor="task-title">
                Title
              </label>
              <input
                id="task-title"
                data-testid="task-title-input"
                value={form.title}
                onChange={(ev) => setForm((p) => ({ ...p, title: ev.target.value }))}
              />
              {fieldErrors.title && (
                <div data-testid="error-title" style={styles.fieldError}>
                  {fieldErrors.title}
                </div>
              )}
            </div>

            <div style={styles.field}>
              <label style={styles.label} htmlFor="task-status">
                Status
              </label>
              <select
                id="task-status"
                data-testid="task-status-select"
                value={form.status}
                onChange={(ev) =>
                  setForm((p) => ({
                    ...p,
                    status: ev.target.value as TaskStatus,
                  }))
                }
              >
                {STATUSES.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
              {fieldErrors.status && (
                <div data-testid="error-status" style={styles.fieldError}>
                  {fieldErrors.status}
                </div>
              )}
            </div>

            <div style={styles.field}>
              <label style={styles.label} htmlFor="task-dueDate">
                Due Date
              </label>
              <input
                id="task-dueDate"
                type="date"
                data-testid="task-dueDate-input"
                value={form.dueDate}
                onChange={(ev) => setForm((p) => ({ ...p, dueDate: ev.target.value }))}
              />
              {fieldErrors.dueDate && (
                <div data-testid="error-dueDate" style={styles.fieldError}>
                  {fieldErrors.dueDate}
                </div>
              )}
            </div>

            <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
              <button data-testid="task-cancel-btn" onClick={closeForm} disabled={saving}>
                Cancel
              </button>
              <button data-testid="task-save-btn" onClick={submit} disabled={saving}>
                {saving ? 'Saving…' : 'Save'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  page: {
    maxWidth: 900,
    margin: '0 auto',
    padding: 24,
    fontFamily: 'system-ui, sans-serif',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  h1: { margin: 0 },
  table: { width: '100%', borderCollapse: 'collapse' },
  th: {
    textAlign: 'left',
    borderBottom: '1px solid #e5e7eb',
    padding: 8,
    color: '#6b7280',
  },
  td: { borderBottom: '1px solid #f3f4f6', padding: 8 },
  badge: { padding: '2px 6px', borderRadius: 4, background: '#eef2ff' },
  primaryBtn: {
    padding: '8px 12px',
    background: '#2563eb',
    color: '#fff',
    border: 'none',
    borderRadius: 6,
    cursor: 'pointer',
  },
  linkBtn: {
    background: 'none',
    border: 'none',
    color: '#2563eb',
    cursor: 'pointer',
    padding: 0,
    font: 'inherit',
  },
  empty: { border: '1px dashed #d1d5db', padding: 18, borderRadius: 8 },
  errorBanner: {
    background: '#fef2f2',
    border: '1px solid #fecaca',
    color: '#b91c1c',
    padding: 10,
    borderRadius: 6,
    marginBottom: 12,
  },
  overlay: {
    position: 'fixed',
    inset: 0,
    background: 'rgba(0,0,0,0.45)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modal: {
    background: '#fff',
    padding: 18,
    borderRadius: 8,
    width: '100%',
    maxWidth: 480,
  },
  field: { display: 'flex', flexDirection: 'column', gap: 4, marginBottom: 12 },
  label: { fontSize: 12, fontWeight: 600, color: '#374151' },
  fieldError: { fontSize: 12, color: '#b91c1c' },
};
