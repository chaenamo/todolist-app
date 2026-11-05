import { Link } from 'react-router';
import type { TodoWithStatus } from '../../api/types';
import { formatMonthDay } from '../../lib/date';
import { StatusBadge } from '../StatusBadge';
import styles from './TodoRow.module.css';

interface TodoRowProps {
  todo: TodoWithStatus;
  categoryName: string;
  toggling: boolean;
  onToggle: (isCompleted: boolean) => void;
  onDelete: () => void;
}

export function TodoRow({ todo, categoryName, toggling, onToggle, onDelete }: TodoRowProps) {
  return (
    <li className={styles.row}>
      <input
        type="checkbox"
        className={styles.check}
        aria-label={`${todo.title} 완료`}
        checked={todo.isCompleted}
        disabled={toggling}
        onChange={(e) => onToggle(e.target.checked)}
      />
      <Link
        to={`/todos/${todo.id}/edit`}
        state={{ from: '/todos' }}
        className={`${styles.title} ${todo.isCompleted ? styles.done : ''}`}
      >
        {todo.title}
      </Link>
      <span className={styles.meta}>
        <span>{categoryName}</span>
        <span className={styles.sep} aria-hidden="true">
          {' · '}
        </span>
        <span className={styles.period}>
          {formatMonthDay(todo.startDate)} ~ {formatMonthDay(todo.endDate)}
        </span>
      </span>
      <span className={styles.badge}>
        <StatusBadge status={todo.status} />
      </span>
      <Link
        to={`/todos/${todo.id}/edit`}
        state={{ from: '/todos' }}
        className={`${styles.btn} ${styles.edit}`}
        aria-label={`${todo.title} 수정`}
      >
        수정
      </Link>
      <button
        type="button"
        className={`${styles.btn} ${styles.delete}`}
        aria-label={`${todo.title} 삭제`}
        onClick={onDelete}
      >
        삭제
      </button>
    </li>
  );
}
