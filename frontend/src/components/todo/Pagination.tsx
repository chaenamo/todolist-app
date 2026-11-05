import styles from './Pagination.module.css';

interface Props {
  page: number;
  total: number;
  limit: number;
  onChange: (page: number) => void;
}

export function Pagination({ page, total, limit, onChange }: Props) {
  if (total <= limit) return null;
  const totalPages = Math.ceil(total / limit);
  return (
    <nav aria-label="페이지" className={styles.nav}>
      <button
        type="button"
        className={styles.btn}
        disabled={page <= 1}
        onClick={() => onChange(page - 1)}
      >
        이전
      </button>
      {Array.from({ length: totalPages }, (_, i) => i + 1).map((n) => (
        <button
          key={n}
          type="button"
          className={`${styles.btn} ${styles.num}`}
          aria-current={n === page ? 'page' : undefined}
          onClick={() => onChange(n)}
        >
          {n}
        </button>
      ))}
      <span className={styles.summary}>
        {page} / {totalPages}
      </span>
      <button
        type="button"
        className={styles.btn}
        disabled={page >= totalPages}
        onClick={() => onChange(page + 1)}
      >
        다음
      </button>
    </nav>
  );
}
