import styles from './PlaceholderPage.module.css';

// 임시 화면: 각 화면 Task(FE-04~FE-12)에서 실제 페이지로 교체한다
export function PlaceholderPage({ title }: { title: string }) {
  return (
    <main className={styles.page}>
      <h1 className={styles.title}>{title}</h1>
    </main>
  );
}
