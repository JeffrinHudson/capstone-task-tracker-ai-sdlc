import { useState, useEffect } from 'react';
import type { Task, TaskFormData, Priority, Status } from '../types';

interface Props {
  task?: Task;
  onClose: () => void;
  onSave: (data: TaskFormData & { status: Status }) => Promise<void>;
}

const PRIORITIES: Priority[] = ['LOW', 'MEDIUM', 'HIGH'];
const STATUSES: Status[] = ['OPEN', 'DONE'];

export default function TaskModal({ task, onClose, onSave }: Props) {
  const [title, setTitle] = useState(task?.title ?? '');
  const [description, setDescription] = useState(task?.description ?? '');
  const [priority, setPriority] = useState<Priority>(task?.priority ?? 'MEDIUM');
  const [status, setStatus] = useState<Status>(task?.status ?? 'OPEN');
  const [dueDate, setDueDate] = useState(
    task?.dueDate ? task.dueDate.slice(0, 10) : '',
  );
  const [titleError, setTitleError] = useState('');
  const [serverError, setServerError] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setServerError('');
    if (!title.trim()) {
      setTitleError('Title is required');
      return;
    }
    setTitleError('');
    setSaving(true);
    try {
      await onSave({ title: title.trim(), description, priority, status, dueDate });
      onClose();
    } catch (err) {
      setServerError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div
      data-testid="modal-overlay"
      style={styles.overlay}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div data-testid="task-modal" style={styles.modal} role="dialog" aria-modal="true">
        <h2 style={styles.heading}>{task ? 'Edit Task' : 'New Task'}</h2>

        <form onSubmit={handleSubmit} noValidate>
          <div style={styles.field}>
            <label htmlFor="task-title" style={styles.label}>Title *</label>
            <input
              id="task-title"
              data-testid="input-title"
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              style={{ ...styles.input, ...(titleError ? styles.inputError : {}) }}
              autoFocus
            />
            {titleError && (
              <span data-testid="error-title" style={styles.errorText}>{titleError}</span>
            )}
          </div>

          <div style={styles.field}>
            <label htmlFor="task-description" style={styles.label}>Description</label>
            <textarea
              id="task-description"
              data-testid="input-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              style={{ ...styles.input, height: 72, resize: 'vertical' }}
            />
          </div>

          <div style={styles.row}>
            <div style={{ ...styles.field, flex: 1 }}>
              <label htmlFor="task-priority" style={styles.label}>Priority</label>
              <select
                id="task-priority"
                data-testid="select-priority"
                value={priority}
                onChange={(e) => setPriority(e.target.value as Priority)}
                style={styles.input}
              >
                {PRIORITIES.map((p) => (
                  <option key={p} value={p}>{p}</option>
                ))}
              </select>
            </div>

            {task && (
              <div style={{ ...styles.field, flex: 1 }}>
                <label htmlFor="task-status" style={styles.label}>Status</label>
                <select
                  id="task-status"
                  data-testid="select-status"
                  value={status}
                  onChange={(e) => setStatus(e.target.value as Status)}
                  style={styles.input}
                >
                  {STATUSES.map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>
            )}

            <div style={{ ...styles.field, flex: 1 }}>
              <label htmlFor="task-due-date" style={styles.label}>Due Date</label>
              <input
                id="task-due-date"
                data-testid="input-due-date"
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                style={styles.input}
              />
            </div>
          </div>

          {serverError && (
            <div data-testid="error-server" style={styles.serverError}>{serverError}</div>
          )}

          <div style={styles.actions}>
            <button
              type="button"
              data-testid="btn-cancel"
              onClick={onClose}
              style={styles.btnSecondary}
            >
              Cancel
            </button>
            <button
              type="submit"
              data-testid="btn-save"
              disabled={saving}
              style={styles.btnPrimary}
            >
              {saving ? 'Saving…' : 'Save'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  overlay: {
    position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)',
    display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100,
  },
  modal: {
    background: '#fff', borderRadius: 8, padding: 28, width: '100%', maxWidth: 480,
    boxShadow: '0 4px 24px rgba(0,0,0,0.18)',
  },
  heading: { margin: '0 0 20px', fontSize: 18 },
  field: { display: 'flex', flexDirection: 'column', marginBottom: 14 },
  row: { display: 'flex', gap: 12 },
  label: { fontSize: 13, fontWeight: 600, marginBottom: 4, color: '#374151' },
  input: {
    padding: '7px 10px', border: '1px solid #d1d5db', borderRadius: 5,
    fontSize: 14, outline: 'none', width: '100%', boxSizing: 'border-box',
  },
  inputError: { borderColor: '#ef4444' },
  errorText: { color: '#ef4444', fontSize: 12, marginTop: 3 },
  serverError: {
    color: '#ef4444', fontSize: 13, background: '#fef2f2',
    border: '1px solid #fecaca', borderRadius: 5, padding: '8px 12px', marginBottom: 12,
  },
  actions: { display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 20 },
  btnPrimary: {
    padding: '8px 20px', background: '#2563eb', color: '#fff', border: 'none',
    borderRadius: 5, cursor: 'pointer', fontSize: 14, fontWeight: 600,
  },
  btnSecondary: {
    padding: '8px 20px', background: '#f3f4f6', color: '#374151', border: '1px solid #d1d5db',
    borderRadius: 5, cursor: 'pointer', fontSize: 14,
  },
};
