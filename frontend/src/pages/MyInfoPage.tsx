import { useState, type FormEvent } from 'react';
import { ApiError } from '../api/client';
import { useChangePassword, useMe, useUpdateName } from '../hooks/useMe';
import { useToastStore } from '../stores/toastStore';
import styles from './MyInfoPage.module.css';

interface FieldProps {
  id: string;
  label: string;
  type?: string;
  autoComplete?: string;
  value: string;
  onChange: (v: string) => void;
  error?: string;
  hint?: string;
}

function Field({
  id,
  label,
  type = 'text',
  autoComplete,
  value,
  onChange,
  error,
  hint,
}: FieldProps) {
  const describedBy = [hint && `${id}-hint`, error && `${id}-error`].filter(Boolean).join(' ');
  return (
    <div className={styles.field}>
      <label className={styles.label} htmlFor={id}>
        {label}
      </label>
      <div className={styles.control}>
        <input
          id={id}
          className={styles.input}
          type={type}
          autoComplete={autoComplete}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          aria-invalid={error ? true : undefined}
          aria-describedby={describedBy || undefined}
        />
        {hint && (
          <p id={`${id}-hint`} className={styles.hint}>
            {hint}
          </p>
        )}
        {error && (
          <p id={`${id}-error`} className={styles.fieldError}>
            {error}
          </p>
        )}
      </div>
    </div>
  );
}

export function MyInfoPage() {
  const { data: me, isPending, error: loadError } = useMe();
  const updateName = useUpdateName();
  const changePassword = useChangePassword();
  const showToast = useToastStore((s) => s.showToast);

  const [nameEdit, setNameEdit] = useState<string | null>(null);
  const [nameError, setNameError] = useState<string>();
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [pwErrors, setPwErrors] = useState<{ currentPassword?: string; newPassword?: string }>({});

  if (isPending) return <p role="status">불러오는 중…</p>;
  if (loadError) return <p role="alert">{loadError.message}</p>;

  // 사용자가 입력하기 전에는 서버 값을 그대로 보여준다
  const name = nameEdit ?? me.name;

  function handleName(e: FormEvent) {
    e.preventDefault();
    setNameError(undefined);
    const trimmed = name.trim();
    if (!trimmed) {
      setNameError('이름을 입력하세요');
      return;
    }
    updateName.mutate(trimmed, {
      onSuccess: () => showToast('success', '이름을 저장했습니다.'),
      onError: (err) => {
        if (err instanceof ApiError && err.fields?.name) setNameError(err.fields.name);
        else showToast('error', err.message);
      },
    });
  }

  function handlePassword(e: FormEvent) {
    e.preventDefault();
    const next: typeof pwErrors = {};
    if (!currentPassword) next.currentPassword = '현재 비밀번호를 입력하세요';
    if (!newPassword) next.newPassword = '새 비밀번호를 입력하세요';
    setPwErrors(next);
    if (next.currentPassword || next.newPassword) return;
    changePassword.mutate(
      { currentPassword, newPassword },
      {
        onSuccess: () => {
          setCurrentPassword('');
          setNewPassword('');
          showToast('success', '비밀번호를 변경했습니다.');
        },
        onError: (err) => {
          const fields = err instanceof ApiError ? err.fields : undefined;
          if (fields?.currentPassword || fields?.newPassword) {
            setPwErrors({
              currentPassword: fields.currentPassword,
              newPassword: fields.newPassword,
            });
          } else showToast('error', err.message);
        },
      },
    );
  }

  return (
    <div className={styles.page}>
      <h1 className={styles.title}>내 정보</h1>
      <dl className={styles.email}>
        <dt className={styles.label}>이메일</dt>
        <dd className={styles.readonly}>{me.email}</dd>
      </dl>
      <form noValidate aria-label="이름 변경" className={styles.section} onSubmit={handleName}>
        <Field id="me-name" label="이름" value={name} onChange={setNameEdit} error={nameError} />
        <div className={styles.actions}>
          <button type="submit" className={styles.submit} disabled={updateName.isPending}>
            이름 저장
          </button>
        </div>
      </form>
      <form
        noValidate
        aria-label="비밀번호 변경"
        className={`${styles.section} ${styles.divided}`}
        onSubmit={handlePassword}
      >
        <h2 className={styles.subtitle}>비밀번호 변경</h2>
        <Field
          id="me-current-password"
          label="현재 비밀번호"
          type="password"
          autoComplete="current-password"
          value={currentPassword}
          onChange={setCurrentPassword}
          error={pwErrors.currentPassword}
        />
        <Field
          id="me-new-password"
          label="새 비밀번호"
          type="password"
          autoComplete="new-password"
          value={newPassword}
          onChange={setNewPassword}
          error={pwErrors.newPassword}
          hint="8~72자로 입력하세요"
        />
        <div className={styles.actions}>
          <button type="submit" className={styles.submit} disabled={changePassword.isPending}>
            비밀번호 변경
          </button>
        </div>
      </form>
    </div>
  );
}
