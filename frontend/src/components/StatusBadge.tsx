import type { TodoStatus } from '../api/types';
import { useT } from '../i18n';
import styles from './StatusBadge.module.css';

const STATUS_CLASS: Record<TodoStatus, string> = {
  NOT_STARTED: styles.notStarted,
  IN_PROGRESS: styles.inProgress,
  COMPLETED: styles.completed,
  OVERDUE: styles.overdue,
};

export function StatusBadge({ status }: { status: TodoStatus }) {
  const t = useT();
  return <span className={`${styles.badge} ${STATUS_CLASS[status]}`}>{t.status[status]}</span>;
}
