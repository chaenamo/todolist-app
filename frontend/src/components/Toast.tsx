import { useToastStore } from '../stores/toastStore';
import styles from './Toast.module.css';

export function Toaster() {
  const toasts = useToastStore((s) => s.toasts);
  const dismissToast = useToastStore((s) => s.dismissToast);

  return (
    <div className={styles.container}>
      {toasts.map((t) => (
        <div
          key={t.id}
          role={t.kind === 'success' ? 'status' : 'alert'}
          className={`${styles.toast} ${t.kind === 'success' ? styles.success : styles.error}`}
        >
          <span>{t.message}</span>
          <button
            type="button"
            aria-label="알림 닫기"
            className={styles.close}
            onClick={() => dismissToast(t.id)}
          >
            ×
          </button>
        </div>
      ))}
    </div>
  );
}
