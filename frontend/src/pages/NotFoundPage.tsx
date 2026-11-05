import { Link } from 'react-router';
import styles from './NotFoundPage.module.css';

// CMP-04
export function NotFoundPage() {
  return (
    <main className={styles.page}>
      <h1 className={styles.title}>요청하신 항목을 찾을 수 없습니다.</h1>
      <Link to="/todos" className={styles.button}>
        할일 목록으로
      </Link>
    </main>
  );
}
