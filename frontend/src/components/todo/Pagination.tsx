import { useT } from '../../i18n';
import styles from './Pagination.module.css';

interface Props {
  page: number;
  total: number;
  limit: number;
  onChange: (page: number) => void;
}

export function Pagination({ page, total, limit, onChange }: Props) {
  const t = useT();
  if (total <= limit) return null;
  const totalPages = Math.ceil(total / limit);
  return (
    <nav aria-label={t.page.label} className={styles.nav}>
      <button
        type="button"
        className={styles.btn}
        disabled={page <= 1}
        onClick={() => onChange(page - 1)}
      >
        {t.page.prev}
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
        {t.page.next}
      </button>
    </nav>
  );
}
