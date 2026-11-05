import { STATUS_LABEL } from '../StatusBadge';
import type { Category, TodoStatus } from '../../api/types';
import styles from './FilterBar.module.css';

const STATUS_ORDER: TodoStatus[] = ['NOT_STARTED', 'IN_PROGRESS', 'COMPLETED', 'OVERDUE'];

interface Props {
  categories: Category[];
  categoryId: number | null;
  statuses: TodoStatus[];
  onCategoryChange: (id: number | null) => void;
  onStatusesChange: (s: TodoStatus[]) => void;
  onReset: () => void;
}

export function FilterBar({
  categories,
  categoryId,
  statuses,
  onCategoryChange,
  onStatusesChange,
  onReset,
}: Props) {
  function toggle(s: TodoStatus, checked: boolean) {
    // 선택 순서와 무관하게 고정 순서로 서버에 보낸다
    onStatusesChange(STATUS_ORDER.filter((x) => (x === s ? checked : statuses.includes(x))));
  }

  return (
    <div className={styles.bar}>
      <div className={styles.controls}>
        <div className={styles.field}>
          <label htmlFor="filter-category" className={styles.label}>
            카테고리
          </label>
          <select
            id="filter-category"
            className={styles.select}
            value={categoryId ?? ''}
            onChange={(e) =>
              onCategoryChange(e.target.value === '' ? null : Number(e.target.value))
            }
          >
            <option value="">전체</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>
        <fieldset className={styles.statuses}>
          <legend className={styles.label}>상태</legend>
          <div className={styles.checks}>
            {STATUS_ORDER.map((s) => (
              <label key={s} className={styles.check}>
                <input
                  type="checkbox"
                  checked={statuses.includes(s)}
                  onChange={(e) => toggle(s, e.target.checked)}
                />
                {STATUS_LABEL[s]}
              </label>
            ))}
          </div>
        </fieldset>
        <button type="button" className={styles.reset} onClick={onReset}>
          필터 초기화
        </button>
      </div>
      <small className={styles.sort}>정렬: 종료일자 오름차순</small>
    </div>
  );
}
