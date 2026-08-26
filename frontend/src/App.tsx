import { useState, useEffect, useCallback, useRef } from 'react';
import type { Task, Status, TaskFormData } from './types';
import { fetchTasks, createTask, updateTask, patchTaskStatus, deleteTask } from './api';
import TaskModal from './components/TaskModal';
import TaskRow from './components/TaskRow';

type StatusFilter = 'ALL' | Status;
type SortDir = 'asc' | 'desc';

export default function App() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('ALL');
  const [sortDir, setSortDir] = useState<SortDir>('asc');

  const [showCreate, setShowCreate] = useState(false);
  const [editTask, setEditTask] = useState<Task | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Task | null>(null);
  const [deleteError, setDeleteError] = useState('');

  // Debounce search input to avoid hammering the API on every keystroke
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [debouncedSearch, setDebouncedSearch] = useState('');

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => setDebouncedSearch(search), 300);
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [search]);

  const loadTasks = useCallback(async () => {
    setLoading(true);
    setLoadError('');
    try {
      const data = await fetchTasks({
        q: debouncedSearch || undefined,
        status: statusFilter !== 'ALL' ? statusFilter : undefined,
        sortBy: 'dueDate',
        sortDir,
      });
      setTasks(data);
    } catch (err) {
      setLoadError(err instanceof Error ? err.message : 'Failed to load tasks');
    } finally {
      setLoading(false);
    }
  }, [debouncedSearch, statusFilter, sortDir]);

  useEffect(() => { loadTasks(); }, [loadTasks]);

  async function handleCreate(data: TaskFormData & { status: Status }) {
    const task = await createTask(data);
    setTasks((prev) => [task, ...prev]);
  }

  async function handleUpdate(data: TaskFormData & { status: Status }) {
    if (!editTask) return;
    const updated = await updateTask(editTask.id, data);
    setTasks((prev) => prev.map((t) => (t.id === updated.id ? updated : t)));
  }

  async function handleToggleStatus(task: Task) {
    const next: Status = task.status === 'OPEN' ? 'DONE' : 'OPEN';
    try {
      const updated = await patchTaskStatus(task.id, next);
      setTasks((prev) => prev.map((t) => (t.id === updated.id ? updated : t)));
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to update status');
    }
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    setDeleteError('');
    try {
      await deleteTask(deleteTarget.id);
      setTasks((prev) => prev.filter((t) => t.id !== deleteTarget.id));
      setDeleteTarget(null);
    } catch (err) {
      setDeleteError(err instanceof Error ? err.message : 'Failed to delete task');
    }
  }

  return (
    <div style={styles.page}>
      <header style={styles.header}>
        <h1 style={styles.heading} data-testid="app-title">Task Tracker</h1>
        <button
          data-testid="btn-new-task"
          onClick={() => setShowCreate(true)}
          style={styles.btnPrimary}
        >
          + New Task
        </button>
      </header>

      {/* Controls */}
      <div style={styles.controls}>
        <input
          type="search"
          data-testid="input-search"
          placeholder="Search tasks…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{ ...styles.input, width: 220 }}
        />

        <div style={styles.controlGroup}>
          <label htmlFor="status-filter" style={styles.controlLabel}>Status</label>
          <select
            id="status-filter"
            data-testid="select-status-filter"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as StatusFilter)}
            style={styles.input}
          >
            <option value="ALL">All</option>
            <option value="OPEN">Open</option>
            <option value="DONE">Done</option>
          </select>
        </div>

        <div style={styles.controlGroup}>
          <label htmlFor="sort-dir" style={styles.controlLabel}>Due Date</label>
          <select
            id="sort-dir"
            data-testid="select-sort"
            value={sortDir}
            onChange={(e) => setSortDir(e.target.value as SortDir)}
            style={styles.input}
          >
            <option value="asc">Asc</option>
            <option value="desc">Desc</option>
          </select>
        </div>
      </div>

      {/* Task table */}
      {loadError && (
        <div data-testid="load-error" style={styles.alertError}>{loadError}</div>
      )}

      {loading ? (
        <p data-testid="loading-indicator" style={styles.muted}>Loading…</p>
      ) : (
        <div style={styles.tableWrapper}>
          <table data-testid="task-table" style={styles.table}>
            <thead>
              <tr style={{ borderBottom: '2px solid #e5e7eb' }}>
                <th style={styles.th}></th>
                <th style={styles.th}>Title</th>
                <th style={styles.th}>Priority</th>
                <th style={styles.th}>Status</th>
                <th style={styles.th}>Due Date</th>
                <th style={styles.th}>Last Updated</th>
                <th style={styles.th}></th>
              </tr>
            </thead>
            <tbody>
              {tasks.length === 0 ? (
                <tr>
                  <td colSpan={7} style={{ ...styles.th, textAlign: 'center', color: '#9ca3af' }}>
                    <span data-testid="empty-state">No tasks found</span>
                  </td>
                </tr>
              ) : (
                tasks.map((task) => (
                  <TaskRow
                    key={task.id}
                    task={task}
                    onEdit={setEditTask}
                    onToggleStatus={handleToggleStatus}
                    onDelete={setDeleteTarget}
                  />
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Create modal */}
      {showCreate && (
        <TaskModal
          onClose={() => setShowCreate(false)}
          onSave={handleCreate}
        />
      )}

      {/* Edit modal */}
      {editTask && (
        <TaskModal
          task={editTask}
          onClose={() => setEditTask(null)}
          onSave={handleUpdate}
        />
      )}

      {/* Delete confirm dialog */}
      {deleteTarget && (
        <div
          data-testid="delete-overlay"
          style={{ ...styles.overlay }}
          onClick={(e) => { if (e.target === e.currentTarget) setDeleteTarget(null); }}
        >
          <div data-testid="delete-dialog" style={styles.dialog} role="alertdialog" aria-modal="true">
            <h3 style={{ margin: '0 0 10px' }}>Delete Task</h3>
            <p style={{ margin: '0 0 16px', color: '#374151', fontSize: 14 }}>
              Are you sure you want to delete <strong>"{deleteTarget.title}"</strong>? This cannot be undone.
            </p>
            {deleteError && (
              <div data-testid="delete-error" style={styles.alertError}>{deleteError}</div>
            )}
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
              <button
                data-testid="btn-delete-cancel"
                onClick={() => { setDeleteTarget(null); setDeleteError(''); }}
                style={styles.btnSecondary}
              >
                Cancel
              </button>
              <button
                data-testid="btn-delete-confirm"
                onClick={handleDelete}
                style={{ ...styles.btnPrimary, background: '#ef4444' }}
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  page: { maxWidth: 900, margin: '0 auto', padding: '24px 16px', fontFamily: 'system-ui, sans-serif' },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  heading: { margin: 0, fontSize: 22, fontWeight: 700 },
  controls: { display: 'flex', gap: 12, alignItems: 'flex-end', marginBottom: 16, flexWrap: 'wrap' },
  controlGroup: { display: 'flex', flexDirection: 'column', gap: 3 },
  controlLabel: { fontSize: 12, fontWeight: 600, color: '#6b7280' },
  input: {
    padding: '7px 10px', border: '1px solid #d1d5db', borderRadius: 5,
    fontSize: 14, outline: 'none', boxSizing: 'border-box',
  },
  tableWrapper: { overflowX: 'auto' },
  table: { width: '100%', borderCollapse: 'collapse', background: '#fff' },
  th: { padding: '10px 12px', textAlign: 'left', fontSize: 13, fontWeight: 600, color: '#6b7280' },
  muted: { color: '#9ca3af', margin: '32px 0', textAlign: 'center' },
  alertError: {
    color: '#b91c1c', background: '#fef2f2', border: '1px solid #fecaca',
    borderRadius: 5, padding: '8px 12px', marginBottom: 12, fontSize: 14,
  },
  overlay: {
    position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)',
    display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100,
  },
  dialog: {
    background: '#fff', borderRadius: 8, padding: 24, width: '100%', maxWidth: 400,
    boxShadow: '0 4px 24px rgba(0,0,0,0.18)',
  },
  btnPrimary: {
    padding: '8px 20px', background: '#2563eb', color: '#fff', border: 'none',
    borderRadius: 5, cursor: 'pointer', fontSize: 14, fontWeight: 600,
  },
  btnSecondary: {
    padding: '8px 20px', background: '#f3f4f6', color: '#374151', border: '1px solid #d1d5db',
    borderRadius: 5, cursor: 'pointer', fontSize: 14,
  },
};

