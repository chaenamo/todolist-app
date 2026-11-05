import { afterEach, beforeEach, expect, test, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router';
import { useAuthStore } from '../stores/authStore';
import { useToastStore } from '../stores/toastStore';
import { Toaster } from '../components/Toast';
import { MyInfoPage } from './MyInfoPage';

const fetchMock = vi.fn<typeof fetch>();

function json(status: number, body: unknown): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

const me = {
  id: 1,
  email: 'me@test.example',
  name: '홍길동',
  createdAt: '2026-11-01T00:00:00.000Z',
};

const wrongPassword = {
  error: {
    code: 'VALIDATION_ERROR',
    message: '입력값을 확인해 주세요',
    fields: { currentPassword: '현재 비밀번호가 올바르지 않습니다' },
  },
};

let putResponse: () => Response;

// GET은 무효화 후 다시 호출되므로 URL+method로 응답을 고른다
function routeFetch() {
  fetchMock.mockImplementation(async (input, init) => {
    const url = String(input);
    const method = init?.method ?? 'GET';
    if (url === '/api/users/me' && method === 'GET') return json(200, me);
    if (url === '/api/users/me' && method === 'PATCH') {
      const { name } = JSON.parse(String(init?.body)) as { name: string };
      return json(200, { ...me, name });
    }
    if (url === '/api/users/me/password' && method === 'PUT') return putResponse();
    return json(404, { error: { code: 'NOT_FOUND', message: '없음' } });
  });
}

function callsOf(method: string, url?: string) {
  return fetchMock.mock.calls.filter(
    ([u, init]) => (init?.method ?? 'GET') === method && (url === undefined || String(u) === url),
  );
}

function renderPage() {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  return render(
    <QueryClientProvider client={client}>
      <MemoryRouter initialEntries={['/me']}>
        <MyInfoPage />
        <Toaster />
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

function input(label: string): HTMLInputElement {
  return screen.getByLabelText(label) as HTMLInputElement;
}

async function renderLoaded() {
  renderPage();
  await waitFor(() => expect(input('이름').value).toBe('홍길동'));
}

function fillPasswords(current: string, next: string) {
  fireEvent.change(input('현재 비밀번호'), { target: { value: current } });
  fireEvent.change(input('새 비밀번호'), { target: { value: next } });
  fireEvent.click(screen.getByRole('button', { name: '비밀번호 변경' }));
}

beforeEach(() => {
  useAuthStore.getState().clear();
  localStorage.clear();
  useToastStore.setState({ toasts: [] });
  useAuthStore.setState({ accessToken: 'at-1', refreshToken: 'rt-old' });
  putResponse = () => json(200, { refreshToken: 'rt-new' });
  fetchMock.mockReset();
  routeFetch();
  vi.stubGlobal('fetch', fetchMock);
});

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

test('[WF-10] 내 정보 화면은 제목, 이름 폼, 비밀번호 폼을 보여준다', async () => {
  await renderLoaded();

  expect(screen.getByRole('heading', { level: 1, name: '내 정보' })).toBeTruthy();
  expect(screen.getByRole('button', { name: '이름 저장' })).toBeTruthy();
  expect(input('현재 비밀번호').type).toBe('password');
  expect(input('새 비밀번호').type).toBe('password');
  expect(screen.getByText('8~72자로 입력하세요')).toBeTruthy();
  expect(screen.getByRole('button', { name: '비밀번호 변경' })).toBeTruthy();
});

test('[A-06, SC-10-E3] 이메일이 입력 요소가 아닌 텍스트로 표시된다', async () => {
  await renderLoaded();

  const email = screen.getByText('me@test.example');
  expect(email.tagName).not.toBe('INPUT');
  expect(email.tagName).not.toBe('TEXTAREA');
  expect(screen.queryByDisplayValue('me@test.example')).toBeNull();
});

test('[SC-10] 공백뿐인 이름은 이름을 입력하세요 오류를 띄우고 PATCH하지 않는다', async () => {
  await renderLoaded();

  fireEvent.change(input('이름'), { target: { value: '   ' } });
  fireEvent.click(screen.getByRole('button', { name: '이름 저장' }));

  expect(await screen.findByText('이름을 입력하세요')).toBeTruthy();
  expect(callsOf('PATCH')).toHaveLength(0);
});

test('[SC-10] 이름 저장 성공 시 me 쿼리가 무효화되고 성공 토스트가 뜬다', async () => {
  await renderLoaded();
  expect(callsOf('GET', '/api/users/me')).toHaveLength(1);

  fireEvent.change(input('이름'), { target: { value: '김철수' } });
  fireEvent.click(screen.getByRole('button', { name: '이름 저장' }));

  expect(await screen.findByText('이름을 저장했습니다.')).toBeTruthy();
  const patch = callsOf('PATCH', '/api/users/me');
  expect(patch).toHaveLength(1);
  expect(JSON.parse(String(patch[0][1]?.body))).toEqual({ name: '김철수' });
  await waitFor(() => expect(callsOf('GET', '/api/users/me')).toHaveLength(2));
});

test('[SC-10] 비밀번호 폼을 비운 채 제출하면 두 필수 오류를 띄우고 PUT하지 않는다', async () => {
  await renderLoaded();

  fireEvent.click(screen.getByRole('button', { name: '비밀번호 변경' }));

  expect(await screen.findByText('현재 비밀번호를 입력하세요')).toBeTruthy();
  expect(screen.getByText('새 비밀번호를 입력하세요')).toBeTruthy();
  expect(callsOf('PUT')).toHaveLength(0);
});

test('[SC-10-E1, PQ-02] 비밀번호 변경 400 fields.currentPassword가 현재 비밀번호 아래 표시되고 로그아웃되지 않는다', async () => {
  putResponse = () => json(400, wrongPassword);
  await renderLoaded();

  fillPasswords('wrong-pass', 'new-pass-1');

  await waitFor(() => expect(input('현재 비밀번호').getAttribute('aria-invalid')).toBe('true'));
  const describedBy = input('현재 비밀번호').getAttribute('aria-describedby');
  expect(describedBy).toBeTruthy();
  const described = String(describedBy)
    .split(' ')
    .map((id) => document.getElementById(id)?.textContent ?? '')
    .join(' ');
  expect(described).toContain('현재 비밀번호가 올바르지 않습니다');

  expect(useAuthStore.getState().accessToken).toBe('at-1');
  expect(useAuthStore.getState().refreshToken).toBe('rt-old');
  expect(callsOf('POST', '/api/auth/refresh')).toHaveLength(0);
  expect(callsOf('POST', '/api/auth/logout')).toHaveLength(0);
});

test('[G-06] 비밀번호 변경 성공 시 입력란이 비워지고 refresh token이 응답 값으로 교체되며 로그아웃되지 않는다', async () => {
  await renderLoaded();

  fillPasswords('old-pass-1', 'new-pass-1');

  expect(await screen.findByText('비밀번호를 변경했습니다.')).toBeTruthy();
  const put = callsOf('PUT', '/api/users/me/password');
  expect(put).toHaveLength(1);
  expect(JSON.parse(String(put[0][1]?.body))).toEqual({
    currentPassword: 'old-pass-1',
    newPassword: 'new-pass-1',
  });
  await waitFor(() => expect(input('현재 비밀번호').value).toBe(''));
  expect(input('새 비밀번호').value).toBe('');
  expect(useAuthStore.getState().refreshToken).toBe('rt-new');
  expect(useAuthStore.getState().accessToken).toBe('at-1');
});
