import { useState, type FormEvent } from 'react';
import { Link } from 'react-router';
import { ApiError } from '../api/client';
import { LanguageSelect } from '../components/LanguageSelect';
import { useLogin } from '../hooks/useAuth';
import { useT } from '../i18n';
import styles from './AuthPage.module.css';

export function LoginPage() {
  const t = useT();
  const mutation = useLogin();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});
  const serverError = mutation.error instanceof ApiError ? mutation.error : null;

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const next = {
      email: email ? undefined : t.auth.emailRequired,
      password: password ? undefined : t.auth.passwordRequired,
    };
    setErrors(next);
    if (next.email || next.password) return;
    mutation.mutate({ email, password });
  }

  return (
    <div className={styles.page}>
      <div className={styles.card}>
        <div className={styles.top}>
          <p className={styles.brand}>TodoList</p>
          <LanguageSelect />
        </div>
        <h1 className={styles.title}>{t.auth.loginTitle}</h1>
        <form noValidate onSubmit={handleSubmit}>
          <div className={styles.field}>
            <label className={styles.label} htmlFor="login-email">
              {t.common.email}
            </label>
            <input
              id="login-email"
              className={styles.input}
              type="email"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              aria-invalid={errors.email ? true : undefined}
              aria-describedby={errors.email ? 'login-email-error' : undefined}
            />
            {errors.email && (
              <p id="login-email-error" className={styles.fieldError}>
                {errors.email}
              </p>
            )}
          </div>
          <div className={styles.field}>
            <label className={styles.label} htmlFor="login-password">
              {t.common.password}
            </label>
            <input
              id="login-password"
              className={styles.input}
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              aria-invalid={errors.password ? true : undefined}
              aria-describedby={errors.password ? 'login-password-error' : undefined}
            />
            {errors.password && (
              <p id="login-password-error" className={styles.fieldError}>
                {errors.password}
              </p>
            )}
          </div>
          {serverError && (
            <div role="alert" className={styles.formError}>
              {serverError.message}
            </div>
          )}
          <button type="submit" className={styles.submit} disabled={mutation.isPending}>
            {t.auth.loginTitle}
          </button>
        </form>
        <p className={styles.switch}>
          {t.auth.noAccount} <Link to="/signup">{t.auth.signupTitle}</Link>
        </p>
      </div>
    </div>
  );
}
