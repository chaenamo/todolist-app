import { useState, type FormEvent } from 'react';
import { Link } from 'react-router';
import { ApiError } from '../api/client';
import { useSignup } from '../hooks/useAuth';
import styles from './AuthPage.module.css';

type FieldName = 'email' | 'password' | 'name';

const FIELDS: {
  name: FieldName;
  label: string;
  type: string;
  autoComplete: string;
  empty: string;
}[] = [
  {
    name: 'email',
    label: '이메일',
    type: 'email',
    autoComplete: 'email',
    empty: '이메일을 입력하세요',
  },
  {
    name: 'password',
    label: '비밀번호',
    type: 'password',
    autoComplete: 'new-password',
    empty: '비밀번호를 입력하세요',
  },
  { name: 'name', label: '이름', type: 'text', autoComplete: 'name', empty: '이름을 입력하세요' },
];

export function SignupPage() {
  const mutation = useSignup();
  const [values, setValues] = useState<Record<FieldName, string>>({
    email: '',
    password: '',
    name: '',
  });
  const [clientErrors, setClientErrors] = useState<Partial<Record<FieldName, string>>>({});
  const serverError = mutation.error instanceof ApiError ? mutation.error : null;
  const serverFields: Record<string, string> = serverError?.fields ?? {};
  const hasUnmatched = Object.keys(serverFields).some((k) => !FIELDS.some((f) => f.name === k));
  const showFormError = serverError && (Object.keys(serverFields).length === 0 || hasUnmatched);

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const next: Partial<Record<FieldName, string>> = {};
    for (const f of FIELDS) if (!values[f.name]) next[f.name] = f.empty;
    setClientErrors(next);
    if (Object.keys(next).length > 0) return;
    mutation.mutate(values);
  }

  return (
    <div className={styles.page}>
      <div className={styles.card}>
        <p className={styles.brand}>TodoList</p>
        <h1 className={styles.title}>회원가입</h1>
        <form noValidate onSubmit={handleSubmit}>
          {FIELDS.map((f) => {
            const error = clientErrors[f.name] ?? serverFields[f.name];
            const id = `signup-${f.name}`;
            const hint = f.name === 'password';
            const describedBy = [hint && `${id}-hint`, error && `${id}-error`]
              .filter(Boolean)
              .join(' ');
            return (
              <div key={f.name} className={styles.field}>
                <label className={styles.label} htmlFor={id}>
                  {f.label}
                </label>
                <input
                  id={id}
                  className={styles.input}
                  type={f.type}
                  autoComplete={f.autoComplete}
                  value={values[f.name]}
                  onChange={(e) => setValues({ ...values, [f.name]: e.target.value })}
                  aria-invalid={error ? true : undefined}
                  aria-describedby={describedBy || undefined}
                />
                {hint && (
                  <p id={`${id}-hint`} className={styles.hint}>
                    8~72자로 입력하세요
                  </p>
                )}
                {error && (
                  <p id={`${id}-error`} className={styles.fieldError}>
                    {error}
                  </p>
                )}
              </div>
            );
          })}
          {showFormError && (
            <div role="alert" className={styles.formError}>
              {serverError.message}
            </div>
          )}
          <button type="submit" className={styles.submit} disabled={mutation.isPending}>
            가입하기
          </button>
        </form>
        <p className={styles.switch}>
          이미 계정이 있으신가요? <Link to="/login">로그인</Link>
        </p>
      </div>
    </div>
  );
}
