import { useState, type FormEvent } from 'react';
import { Link } from 'react-router';
import { ApiError } from '../api/client';
import { LanguageSelect } from '../components/LanguageSelect';
import { ThemeSelect } from '../components/ThemeSelect';
import { FontSizeSelect } from '../components/FontSizeSelect';
import { useSignup } from '../hooks/useAuth';
import { useT } from '../i18n';
import styles from './AuthPage.module.css';

type FieldName = 'email' | 'password' | 'name';

const FIELDS: { name: FieldName; type: string; autoComplete: string }[] = [
  { name: 'email', type: 'email', autoComplete: 'email' },
  { name: 'password', type: 'password', autoComplete: 'new-password' },
  { name: 'name', type: 'text', autoComplete: 'name' },
];

export function SignupPage() {
  const t = useT();
  const mutation = useSignup();
  const labels: Record<FieldName, string> = {
    email: t.common.email,
    password: t.common.password,
    name: t.common.name,
  };
  const required: Record<FieldName, string> = {
    email: t.auth.emailRequired,
    password: t.auth.passwordRequired,
    name: t.auth.nameRequired,
  };
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
    for (const f of FIELDS) if (!values[f.name]) next[f.name] = required[f.name];
    setClientErrors(next);
    if (Object.keys(next).length > 0) return;
    mutation.mutate(values);
  }

  return (
    <div className={styles.page}>
      <div className={styles.card}>
        <div className={styles.top}>
          <p className={styles.brand}>TodoList</p>
          <div className={styles.controls}>
            <LanguageSelect />
            <ThemeSelect />
            <FontSizeSelect />
          </div>
        </div>
        <h1 className={styles.title}>{t.auth.signupTitle}</h1>
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
                  {labels[f.name]}
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
                    {t.common.passwordHint}
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
            {t.auth.submitSignup}
          </button>
        </form>
        <p className={styles.switch}>
          {t.auth.haveAccount} <Link to="/login">{t.auth.loginTitle}</Link>
        </p>
      </div>
    </div>
  );
}
