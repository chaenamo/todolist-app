import { Route, Routes } from 'react-router';
import { NotFoundPage } from './pages/NotFoundPage';

// 화면 라우트는 FE-04 이후 Task에서 추가한다
export function App() {
  return (
    <Routes>
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}
