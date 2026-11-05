import { afterEach, beforeEach, expect, test, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter, Route, Routes } from 'react-router';
import { useAuthStore } from '../stores/authStore';
import { SignupPage } from './SignupPage';

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
      <MemoryRouter initialEntries={['/signup']}>
        <Routes>
          <Route path="/signup" element={<SignupPage />} />
          <Route path="/todos" element={<p>/todos</p>} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

function input(label: string): HTMLInputElement {
  return screen.getByLabelText(label) as HTMLInputElement;
}

function fill(email: string, password: string, name: string) {
  fireEvent.change(input('이메일'), { target: { value: email } });
  fireEvent.change(input('비밀번호'), { target: { value: password } });
  fireEvent.change(input('이름'), { target: { value: name } });
}

function submit() {
  fireEvent.click(screen.getByRole('button', { name: '가입하기' }));
}

// 메시지가 입력의 aria-describedby가 가리키는 요소 안에 있어야 "필드 아래 메시지"로 본다
function expectFieldError(label: string, message: string) {
  const el = input(label);
  expect(el.getAttribute('aria-invalid')).toBe('true');
  const ids = (el.getAttribute('aria-describedby') ?? '').split(/\s+/).filter(Boolean);
  const described = ids.map((id) => document.getElementById(id)?.textContent ?? '').join(' ');
  expect(described).toContain(message);
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

test('[WF-03] 가입 화면은 제목·세 입력·비밀번호 안내·가입하기 버튼·로그인 링크를 가진다', () => {
  renderPage();
  expect(screen.getByRole('heading', { name: '회원가입' })).toBeTruthy();
  expect(input('이메일')).toBeTruthy();
  expect(input('비밀번호')).toBeTruthy();
  expect(input('이름')).toBeTruthy();
  expect(screen.getByText('8~72자로 입력하세요')).toBeTruthy();
  expect(screen.getByRole('button', { name: '가입하기' })).toBeTruthy();
  expect(screen.getByRole('link', { name: '로그인' }).getAttribute('href')).toBe('/login');
});

test('[SC-01] 빈 값으로 제출하면 필드 메시지를 보이고 요청하지 않는다', async () => {
  renderPage();
  submit();
  expect(await screen.findByText('이메일을 입력하세요')).toBeTruthy();
  expect(screen.getByText('비밀번호를 입력하세요')).toBeTruthy();
  expect(screen.getByText('이름을 입력하세요')).toBeTruthy();
  expect(fetchMock).not.toHaveBeenCalled();
});

test('[SC-01, G-01] 가입 성공 시 토큰을 저장하고 /todos로 이동한다', async () => {
  fetchMock.mockResolvedValueOnce(
    json(201, {
      accessToken: 'at-1',
      refreshToken: 'rt-1',
      user: { id: 1, email: 'a@b.com', name: '홍길동', createdAt: '2026-01-01T00:00:00Z' },
    }),
  );
  renderPage();
  fill('a@b.com', 'password1', '홍길동');
  submit();

  expect(await screen.findByText('/todos')).toBeTruthy();
  expect(useAuthStore.getState().accessToken).toBe('at-1');
  expect(useAuthStore.getState().refreshToken).toBe('rt-1');
  const [url, init] = fetchMock.mock.calls[0];
  expect(String(url)).toBe('/api/auth/signup');
  expect(JSON.parse(String(init?.body))).toEqual({
    email: 'a@b.com',
    password: 'password1',
    name: '홍길동',
  });
});

test('[SC-01-E1] 가입 409 fields.email 시 이메일 필드 아래에 메시지가 표시되고 입력값이 유지된다', async () => {
  fetchMock.mockResolvedValueOnce(
    json(409, {
      error: {
        code: 'CONFLICT',
        message: '이미 사용 중인 이메일입니다',
        fields: { email: '이미 사용 중인 이메일입니다' },
      },
    }),
  );
  renderPage();
  fill('dup@b.com', 'password1', '홍길동');
  submit();

  expect((await screen.findAllByText('이미 사용 중인 이메일입니다')).length).toBeGreaterThan(0);
  expectFieldError('이메일', '이미 사용 중인 이메일입니다');
  expect(input('이메일').value).toBe('dup@b.com');
  expect(input('비밀번호').value).toBe('password1');
  expect(input('이름').value).toBe('홍길동');
});

test('[SC-01-E2] 가입 400 fields가 각 필드 아래에 표시된다', async () => {
  const fields = {
    email: '올바른 이메일 형식이 아닙니다',
    password: '비밀번호는 8자 이상이어야 합니다',
    name: '이름을 입력하세요',
  };
  fetchMock.mockResolvedValueOnce(
    json(400, {
      error: { code: 'VALIDATION_ERROR', message: '입력값이 올바르지 않습니다', fields },
    }),
  );
  renderPage();
  // 클라이언트 검증을 통과할 만한 값으로 서버 검증 실패를 흉내 낸다
  fill('a@b.com', 'password1', '홍길동');
  submit();

  expect((await screen.findAllByText(fields.email)).length).toBeGreaterThan(0);
  expectFieldError('이메일', fields.email);
  expectFieldError('비밀번호', fields.password);
  expectFieldError('이름', fields.name);
});
