import { useT } from '../i18n';
import { useToastStore } from '../stores/toastStore';
import styles from './Toast.module.css';

export function Toaster() {
  const toasts = useToastStore((s) => s.toasts);
  const dismissToast = useToastStore((s) => s.dismissToast);
  const t = useT();

  return (
    <div className={styles.container}>
      {toasts.map((toast) => (
        <div
          key={toast.id}
          role={toast.kind === 'success' ? 'status' : 'alert'}
          className={`${styles.toast} ${toast.kind === 'success' ? styles.success : styles.error}`}
        >
          <span>{toast.message}</span>
          <button
            type="button"
            aria-label={t.toast.close}
            className={styles.close}
            onClick={() => dismissToast(toast.id)}
          >
            ×
          </button>
        </div>
      ))}
    </div>
  );
}
