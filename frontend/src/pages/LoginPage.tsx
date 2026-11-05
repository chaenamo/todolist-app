import { useState, type FormEvent } from 'react';
import { Link } from 'react-router';
import { ApiError } from '../api/client';
import { useLogin } from '../hooks/useAuth';
import styles from './AuthPage.module.css';

export function LoginPage() {
  const mutation = useLogin();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});
  const serverError = mutation.error instanceof ApiError ? mutation.error : null;

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const next = {
      email: email ? undefined : '이메일을 입력하세요',
      password: password ? undefined : '비밀번호를 입력하세요',
    };
    setErrors(next);
    if (next.email || next.password) return;
    mutation.mutate({ email, password });
  }

  return (
    <div className={styles.page}>
      <div className={styles.card}>
        <p className={styles.brand}>TodoList</p>
        <h1 className={styles.title}>로그인</h1>
        <form noValidate onSubmit={handleSubmit}>
          <div className={styles.field}>
            <label className={styles.label} htmlFor="login-email">
              이메일
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
              비밀번호
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
            로그인
          </button>
        </form>
        <p className={styles.switch}>
          계정이 없으신가요? <Link to="/signup">회원가입</Link>
        </p>
      </div>
    </div>
  );
}
