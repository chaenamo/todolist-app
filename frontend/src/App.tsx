import { useEffect, useState } from 'react';
import { Navigate, Outlet, Route, Routes } from 'react-router';
import { discardSession, refreshAccessToken } from './api/client';
import { useAuthStore } from './stores/authStore';
import { NotFoundPage } from './pages/NotFoundPage';
import { PlaceholderPage } from './pages/PlaceholderPage';
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

// 라우트 표: 원칙 6.3. 화면은 FE-04~FE-12에서 PlaceholderPage를 교체한다
export function App() {
  return (
    <Routes>
      <Route element={<PublicOnly />}>
        <Route path="/login" element={<PlaceholderPage title="로그인" />} />
        <Route path="/signup" element={<PlaceholderPage title="회원가입" />} />
      </Route>
      <Route element={<RequireAuth />}>
        <Route path="/" element={<Navigate to="/todos" replace />} />
        <Route path="/todos" element={<PlaceholderPage title="할일 목록" />} />
        <Route path="/todos/new" element={<PlaceholderPage title="할일 등록" />} />
        <Route path="/todos/:id/edit" element={<PlaceholderPage title="할일 수정" />} />
        <Route path="/calendar" element={<PlaceholderPage title="캘린더" />} />
        <Route path="/me" element={<PlaceholderPage title="내 정보" />} />
        <Route path="/categories" element={<PlaceholderPage title="카테고리 관리" />} />
      </Route>
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}
