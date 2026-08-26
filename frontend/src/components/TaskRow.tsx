import type { Task } from '../types';

interface Props {
  task: Task;
  onEdit: (task: Task) => void;
  onToggleStatus: (task: Task) => void;
  onDelete: (task: Task) => void;
}

const PRIORITY_COLORS: Record<string, string> = {
  HIGH: '#ef4444',
  MEDIUM: '#f59e0b',
  LOW: '#6b7280',
};

function formatDate(iso: string | null): string {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString(undefined, {
    year: 'numeric', month: 'short', day: 'numeric',
  });
}

export default function TaskRow({ task, onEdit, onToggleStatus, onDelete }: Props) {
  const done = task.status === 'DONE';

  return (
    <tr data-testid="task-row" data-task-id={task.id} style={styles.row}>
      <td style={styles.cell}>
        <input
          type="checkbox"
          data-testid="toggle-status"
          checked={done}
          onChange={() => onToggleStatus(task)}
          title={done ? 'Mark as Open' : 'Mark as Done'}
          style={{ cursor: 'pointer' }}
        />
      </td>

      <td style={styles.cell}>
        <span
          data-testid="task-title"
          style={{ ...styles.title, ...(done ? styles.titleDone : {}) }}
        >
          {task.title}
        </span>
      </td>

      <td style={styles.cell}>
        <span
          data-testid="task-priority"
          style={{ ...styles.badge, color: PRIORITY_COLORS[task.priority] ?? '#374151' }}
        >
          {task.priority}
        </span>
      </td>

      <td style={styles.cell}>
        <span
          data-testid="task-status"
          style={{ ...styles.badge, ...(done ? styles.badgeDone : styles.badgeOpen) }}
        >
          {task.status}
        </span>
      </td>

      <td data-testid="task-due-date" style={styles.cell}>{formatDate(task.dueDate)}</td>

      <td data-testid="task-updated-at" style={{ ...styles.cell, color: '#9ca3af', fontSize: 12 }}>
        {formatDate(task.updatedAt)}
      </td>

      <td style={{ ...styles.cell, textAlign: 'right' }}>
        <button
          data-testid="btn-edit"
          onClick={() => onEdit(task)}
          style={styles.btnAction}
          title="Edit"
        >
          Edit
        </button>
        <button
          data-testid="btn-delete"
          onClick={() => onDelete(task)}
          style={{ ...styles.btnAction, color: '#ef4444' }}
          title="Delete"
        >
          Delete
        </button>
      </td>
    </tr>
  );
}

const styles: Record<string, React.CSSProperties> = {
  row: { borderBottom: '1px solid #f3f4f6' },
  cell: { padding: '10px 12px', verticalAlign: 'middle', fontSize: 14 },
  title: { fontWeight: 500 },
  titleDone: { textDecoration: 'line-through', color: '#9ca3af' },
  badge: { fontSize: 12, fontWeight: 600, padding: '2px 6px', borderRadius: 4 },
  badgeOpen: { background: '#eff6ff', color: '#2563eb' },
  badgeDone: { background: '#f0fdf4', color: '#16a34a' },
  btnAction: {
    background: 'none', border: 'none', cursor: 'pointer', fontSize: 13,
    color: '#374151', padding: '4px 8px', borderRadius: 4,
  },
};
