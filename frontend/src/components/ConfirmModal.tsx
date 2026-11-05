import { useEffect, useId, useRef } from 'react';
import { useT } from '../i18n';
import styles from './ConfirmModal.module.css';

interface ConfirmModalProps {
  open: boolean;
  title: string;
  message: string;
  confirmLabel: string;
  cancelLabel?: string;
  danger?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export function ConfirmModal({
  open,
  title,
  message,
  confirmLabel,
  cancelLabel,
  danger = false,
  onConfirm,
  onCancel,
}: ConfirmModalProps) {
  const t = useT();
  const titleId = useId();
  const messageId = useId();
  const cancelRef = useRef<HTMLButtonElement>(null);
  // 호출 측이 매 렌더 새 onCancel을 넘겨도 리스너 재등록·포커스 이동이 없도록 ref로 최신값만 읽는다
  const onCancelRef = useRef(onCancel);
  useEffect(() => {
    onCancelRef.current = onCancel;
  });

  useEffect(() => {
    if (!open) return;
    cancelRef.current?.focus(); // 삭제 오조작 방지 (SG-15)
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onCancelRef.current();
    };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [open]);

  if (!open) return null;

  return (
    // 오버레이 클릭은 처리하지 않는다 (WF: 바깥은 막는다)
    <div className={styles.overlay}>
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={messageId}
        className={styles.box}
      >
        <h2 id={titleId} className={styles.title}>
          {title}
        </h2>
        <p id={messageId} className={styles.message}>
          {message}
        </p>
        <div className={styles.actions}>
          <button
            type="button"
            ref={cancelRef}
            className={`${styles.button} ${styles.secondary}`}
            onClick={onCancel}
          >
            {cancelLabel ?? t.common.cancel}
          </button>
          <button
            type="button"
            className={`${styles.button} ${danger ? styles.danger : styles.primary}`}
            onClick={onConfirm}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
