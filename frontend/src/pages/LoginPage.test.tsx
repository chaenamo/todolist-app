import { afterEach, beforeEach, expect, test, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter, Route, Routes } from 'react-router';
import { useAuthStore } from '../stores/authStore';
import { useLocaleStore } from '../stores/localeStore';
import { LoginPage } from './LoginPage';

const fetchMock = vi.fn<typeof fetch>();

function json(status: number, body: unknown): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

function renderPage() {
  const client = new QueryClient({ defaultOptions: { mutations: { retry: false } } });
  return render(
    <QueryClientProvider client={client}>
      <MemoryRouter initialEntries={['/login']}>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/todos" element={<p>/todos</p>} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

function input(label: string): HTMLInputElement {
  return screen.getByLabelText(label) as HTMLInputElement;
}

function fill(email: string, password: string) {
  fireEvent.change(input('이메일'), { target: { value: email } });
  fireEvent.change(input('비밀번호'), { target: { value: password } });
}

function submit() {
  fireEvent.click(screen.getByRole('button', { name: '로그인' }));
}

beforeEach(() => {
  useAuthStore.getState().clear();
  localStorage.clear();
  fetchMock.mockReset();
  vi.stubGlobal('fetch', fetchMock);
});

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

test('[WF-02] 로그인 화면은 제목·이메일·비밀번호·로그인 버튼·회원가입 링크를 가진다', () => {
  renderPage();
  expect(screen.getByRole('heading', { name: '로그인' })).toBeTruthy();
  expect(input('이메일')).toBeTruthy();
  expect(input('비밀번호')).toBeTruthy();
  expect(screen.getByRole('button', { name: '로그인' })).toBeTruthy();
  expect(screen.getByRole('link', { name: '회원가입' }).getAttribute('href')).toBe('/signup');
});

test('[SC-02] 빈 값으로 제출하면 필드 메시지를 보이고 요청하지 않는다', async () => {
  renderPage();
  submit();
  expect(await screen.findByText('이메일을 입력하세요')).toBeTruthy();
  expect(screen.getByText('비밀번호를 입력하세요')).toBeTruthy();
  expect(fetchMock).not.toHaveBeenCalled();
});

test('[SC-02, G-01] 로그인 성공 시 토큰을 저장하고 /todos로 이동한다', async () => {
  fetchMock.mockResolvedValueOnce(
    json(200, {
      accessToken: 'at-1',
      refreshToken: 'rt-1',
      user: { id: 1, email: 'a@b.com', name: '홍길동', createdAt: '2026-01-01T00:00:00Z' },
    }),
  );
  renderPage();
  fill('a@b.com', 'password1');
  submit();

  expect(await screen.findByText('/todos')).toBeTruthy();
  expect(useAuthStore.getState().accessToken).toBe('at-1');
  expect(useAuthStore.getState().refreshToken).toBe('rt-1');
  const [url, init] = fetchMock.mock.calls[0];
  expect(String(url)).toBe('/api/auth/login');
  expect(JSON.parse(String(init?.body))).toEqual({ email: 'a@b.com', password: 'password1' });
});

test('[SC-02-E1, G-04] 로그인 401 시 폼 상단에 서버 메시지가 표시되고 입력값이 유지된다', async () => {
  fetchMock.mockResolvedValueOnce(
    json(401, {
      error: { code: 'UNAUTHORIZED', message: '이메일 또는 비밀번호가 올바르지 않습니다' },
    }),
  );
  renderPage();
  fill('a@b.com', 'wrongpass');
  submit();

  const alert = await screen.findByRole('alert');
  expect(alert.textContent).toContain('이메일 또는 비밀번호가 올바르지 않습니다');
  expect(input('이메일').value).toBe('a@b.com');
  expect(input('비밀번호').value).toBe('wrongpass');
  expect(useAuthStore.getState().accessToken).toBeNull();
});

test('[FE-15] 영어로 바꾸면 로그인 화면 문구와 검증 메시지가 영어로 나온다', () => {
  useLocaleStore.getState().setLocale('en');
  renderPage();

  expect(screen.getByRole('heading', { name: 'Log in' })).toBeTruthy();
  expect(screen.getByLabelText('Email')).toBeTruthy();
  fireEvent.click(screen.getByRole('button', { name: 'Log in' }));
  expect(screen.getByText('Enter your email')).toBeTruthy();
  expect(screen.getByText('Enter your password')).toBeTruthy();
  expect(screen.getByRole('link', { name: 'Sign up' })).toBeTruthy();
  expect(screen.getByLabelText('Language')).toBeTruthy();
});
