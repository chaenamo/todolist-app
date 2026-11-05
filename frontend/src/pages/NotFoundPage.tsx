import styles from './NotFoundPage.module.css';

// 임시 화면. 문구·이동 링크는 이후 Task(CMP-04)에서 정한다
export function NotFoundPage() {
  return (
    <main className={styles.page}>
      <h1 className={styles.title}>페이지를 찾을 수 없습니다</h1>
      <p className={styles.message}>주소를 확인해 주세요.</p>
    </main>
  );
}
