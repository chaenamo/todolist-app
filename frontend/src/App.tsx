import { useEffect, useState } from 'react';
import { Navigate, Outlet, Route, Routes } from 'react-router';
import { discardSession, refreshAccessToken } from './api/client';
import { useAuthStore } from './stores/authStore';
import { Layout } from './components/Layout';
import { Toaster } from './components/Toast';
import { useLogout } from './hooks/useAuth';
import { LoginPage } from './pages/LoginPage';
import { SignupPage } from './pages/SignupPage';
import { NotFoundPage } from './pages/NotFoundPage';
import { CategoryPage } from './pages/CategoryPage';
import { TodoListPage } from './pages/TodoListPage';
import { TodoEditPage } from './pages/TodoEditPage';
import { CalendarPage } from './pages/CalendarPage';
import { MyInfoPage } from './pages/MyInfoPage';
import styles from './App.module.css';

// AD-13, AQ-11: access token이 없고 refresh token만 있으면 refresh를 먼저 끝낸 뒤 보호 화면을 렌더한다
function RequireAuth() {
  const accessToken = useAuthStore((s) => s.accessToken);
  const refreshToken = useAuthStore((s) => s.refreshToken);
  const [failed, setFailed] = useState(false);
  const needsRefresh = !accessToken && !!refreshToken && !failed;

  useEffect(() => {
    if (!needsRefresh) return;
    refreshAccessToken().catch(() => {
      discardSession();
      setFailed(true);
    });
  }, [needsRefresh]);

  if (accessToken) return <Outlet />;
  if (needsRefresh) {
    return (
      <p role="status" className={styles.checking}>
        로그인 상태를 확인하는 중입니다
      </p>
    );
  }
  return <Navigate to="/login" replace />; // SC-00-E1
}

// 로그인 상태에서 로그인·가입 화면에 오면 목록으로
function PublicOnly() {
  const accessToken = useAuthStore((s) => s.accessToken);
  return accessToken ? <Navigate to="/todos" replace /> : <Outlet />;
}

function AppLayout() {
  const logout = useLogout();
  return <Layout onLogout={() => void logout()} />;
}

// 라우트 표: 원칙 6.3. 화면 목록
export function App() {
  return (
    <>
      <Routes>
        <Route element={<PublicOnly />}>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/signup" element={<SignupPage />} />
        </Route>
        <Route element={<RequireAuth />}>
          <Route element={<AppLayout />}>
            <Route path="/" element={<Navigate to="/todos" replace />} />
            <Route path="/todos" element={<TodoListPage />} />
            <Route path="/todos/new" element={<TodoEditPage />} />
            <Route path="/todos/:id/edit" element={<TodoEditPage />} />
            <Route path="/calendar" element={<CalendarPage />} />
            <Route path="/me" element={<MyInfoPage />} />
            <Route path="/categories" element={<CategoryPage />} />
          </Route>
        </Route>
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
      <Toaster />
    </>
  );
}
