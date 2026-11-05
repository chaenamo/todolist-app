import { act } from 'react';
import { afterEach, beforeEach, expect, test, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import { QueryClientProvider } from '@tanstack/react-query';
import { App } from './App';
import { discardSession } from './api/client';
import { queryClient } from './queryClient';
import { useAuthStore } from './stores/authStore';

const fetchMock = vi.fn<typeof fetch>();

function json(status: number, body: unknown): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

function renderAt(path: string) {
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={[path]}>
        <App />
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

beforeEach(() => {
  useAuthStore.getState().clear();
  localStorage.clear();
  queryClient.clear();
  fetchMock.mockReset();
  // /todos 화면이 목록·카테고리를 조회하므로 기본 GET 응답을 둔다
  fetchMock.mockImplementation(async (input) => {
    const path = new URL(String(input), 'http://x').pathname;
    if (path === '/api/todos') return json(200, { items: [], page: 1, limit: 20, total: 0 });
    if (path === '/api/categories') return json(200, { items: [] });
    return json(404, { error: { code: 'NOT_FOUND', message: '없음' } });
  });
  vi.stubGlobal('fetch', fetchMock);
});

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

test('[PR-16] 정의되지 않은 경로는 NotFoundPage를 렌더한다', async () => {
  renderAt('/nope');
  expect(
    await screen.findByRole('heading', { name: '요청하신 항목을 찾을 수 없습니다.' }),
  ).toBeTruthy();
});

test('[WF-01] 로그인 상태의 보호 화면은 주 메뉴와 함께 렌더되고 로그아웃하면 로그인 화면으로 간다', async () => {
  useAuthStore.setState({ accessToken: 'at-1', refreshToken: 'rt-1' });
  renderAt('/todos');

  expect(await screen.findByRole('heading', { name: '할일 목록' })).toBeTruthy();
  expect(screen.getByRole('navigation', { name: '주 메뉴' })).toBeTruthy();

  fetchMock.mockResolvedValueOnce(new Response(null, { status: 204 }));
  fireEvent.click(screen.getByRole('button', { name: '로그아웃' }));

  expect(await screen.findByRole('heading', { name: '로그인' })).toBeTruthy();
  const logoutCalls = fetchMock.mock.calls.filter(([, init]) => init?.method === 'POST');
  expect(logoutCalls).toHaveLength(1);
  const [url, init] = logoutCalls[0];
  expect(String(url)).toBe('/api/auth/logout');
  expect(JSON.parse(String(init?.body))).toEqual({ refreshToken: 'rt-1' });
  expect(useAuthStore.getState().accessToken).toBeNull();
  expect(useAuthStore.getState().refreshToken).toBeNull();
});

test('[WF-01] 로그인 화면에는 주 메뉴가 없다', async () => {
  renderAt('/login');
  expect(await screen.findByRole('heading', { name: '로그인' })).toBeTruthy();
  expect(screen.queryByRole('navigation', { name: '주 메뉴' })).toBeNull();
});

test('[SC-00-E2] 토큰이 둘 다 없으면 보호 라우트에서 로그인 화면으로 이동한다', async () => {
  renderAt('/todos');
  expect(await screen.findByRole('heading', { name: '로그인' })).toBeTruthy();
  expect(fetchMock).not.toHaveBeenCalled();
});

test('[PR-16] refreshToken만 있으면 refresh 완료 전까지 status를 보이고 보호 화면은 렌더하지 않는다', async () => {
  useAuthStore.setState({ accessToken: null, refreshToken: 'rt-1' });
  let resolveRefresh: (res: Response) => void = () => {};
  fetchMock.mockReturnValueOnce(new Promise<Response>((resolve) => (resolveRefresh = resolve)));

  renderAt('/calendar');

  const status = await screen.findByRole('status');
  expect(status.textContent).toContain('로그인 상태를 확인하는 중입니다');
  expect(screen.queryByRole('heading', { level: 1 })).toBeNull();

  await act(async () => {
    resolveRefresh(json(200, { accessToken: 'new' }));
  });

  expect(await screen.findByRole('heading', { name: /^\d{4}년 \d{1,2}월$/ })).toBeTruthy();
  expect(screen.queryByRole('status')).toBeNull();
  expect(useAuthStore.getState().accessToken).toBe('new');
});

test('[SC-00-E2] refresh가 401이면 refreshToken을 폐기하고 로그인 화면으로 이동한다', async () => {
  useAuthStore.setState({ accessToken: null, refreshToken: 'rt-1' });
  fetchMock.mockResolvedValueOnce(
    json(401, { error: { code: 'UNAUTHORIZED', message: '세션이 만료되었습니다' } }),
  );

  renderAt('/todos');

  expect(await screen.findByRole('heading', { name: '로그인' })).toBeTruthy();
  expect(useAuthStore.getState().refreshToken).toBeNull();
  expect(useAuthStore.getState().accessToken).toBeNull();
});

test('[U-02] 로그인 상태에서 /login에 접근하면 /todos로 리다이렉트한다', async () => {
  useAuthStore.setState({ accessToken: 'at-1', refreshToken: 'rt-1' });
  renderAt('/login');
  expect(await screen.findByRole('heading', { name: '할일 목록' })).toBeTruthy();
});

test('[SC-00-E2] 보호 화면 렌더 중 세션이 폐기되면 로그인 화면으로 이동한다', async () => {
  useAuthStore.setState({ accessToken: 'at-1', refreshToken: 'rt-1' });
  renderAt('/todos');
  expect(await screen.findByRole('heading', { name: '할일 목록' })).toBeTruthy();

  act(() => discardSession());

  expect(await screen.findByRole('heading', { name: '로그인' })).toBeTruthy();
});
