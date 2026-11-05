import type { TodoWithStatus } from '../../api/types';
import { formatMonthDay } from '../../lib/date';
import { StatusBadge } from '../StatusBadge';
import styles from './DayTodoList.module.css';

interface Props {
  items: TodoWithStatus[];
  categoryNames: Map<number, string>;
  onSelect: (id: number) => void;
}

export function DayTodoList({ items, categoryNames, onSelect }: Props) {
  if (items.length === 0) return <p className={styles.empty}>이 날 할일이 없습니다</p>;
  return (
    <ul className={styles.list} aria-label="일간 할일 목록">
      {items.map((t) => (
        <li key={t.id} className={styles.item}>
          <button
            type="button"
            className={`${styles.title} ${t.isCompleted ? styles.done : ''}`}
            onClick={() => onSelect(t.id)}
          >
            {t.title}
          </button>
          <span className={styles.meta}>{categoryNames.get(t.categoryId)}</span>
          <span className={styles.meta}>
            {`${formatMonthDay(t.startDate)} ~ ${formatMonthDay(t.endDate)}`}
          </span>
          <StatusBadge status={t.status} />
        </li>
      ))}
    </ul>
  );
}
