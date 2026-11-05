import { Link } from 'react-router';
import { useT } from '../i18n';
import styles from './NotFoundPage.module.css';

// CMP-04
export function NotFoundPage() {
  const t = useT();
  return (
    <main className={styles.page}>
      <h1 className={styles.title}>{t.notFound.title}</h1>
      <Link to="/todos" className={styles.button}>
        {t.notFound.back}
      </Link>
    </main>
  );
}
