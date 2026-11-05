import type { TodoStatus } from '../api/types';
import styles from './StatusBadge.module.css';

export const STATUS_LABEL: Record<TodoStatus, string> = {
  NOT_STARTED: '시작 전',
  IN_PROGRESS: '진행 중',
  COMPLETED: '완료',
  OVERDUE: '기한 초과',
};

const STATUS_CLASS: Record<TodoStatus, string> = {
  NOT_STARTED: styles.notStarted,
  IN_PROGRESS: styles.inProgress,
  COMPLETED: styles.completed,
  OVERDUE: styles.overdue,
};

export function StatusBadge({ status }: { status: TodoStatus }) {
  return <span className={`${styles.badge} ${STATUS_CLASS[status]}`}>{STATUS_LABEL[status]}</span>;
}
