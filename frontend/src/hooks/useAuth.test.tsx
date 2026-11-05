import type { ReactNode } from 'react';
import { act } from 'react';
import { afterEach, beforeEach, expect, test, vi } from 'vitest';
import { cleanup, renderHook, screen } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter, useLocation } from 'react-router';
import { queryClient } from '../queryClient';
import { useAuthStore } from '../stores/authStore';
import { useLogin, useLogout, useSignup } from './useAuth';

const fetchMock = vi.fn<typeof fetch>();

function json(status: number, body: unknown): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

const authResponse = {
  accessToken: 'at-1',
  refreshToken: 'rt-1',
  user: { id: 1, email: 'a@b.com', name: '홍길동', createdAt: '2026-01-01T00:00:00Z' },
};

function LocationMarker() {
  return <p data-testid="location">{useLocation().pathname}</p>;
}

function wrapperWith(client: QueryClient, path = '/start') {
  return function Wrapper({ children }: { children: ReactNode }) {
    return (
      <QueryClientProvider client={client}>
        <MemoryRouter initialEntries={[path]}>
          {children}
          <LocationMarker />
        </MemoryRouter>
      </QueryClientProvider>
    );
  };
}

function freshClient() {
  return new QueryClient({ defaultOptions: { mutations: { retry: false } } });
}

function location(): string | null {
  return screen.getByTestId('location').textContent;
}

beforeEach(() => {
  useAuthStore.getState().clear();
  localStorage.clear();
  queryClient.clear();
  fetchMock.mockReset();
  vi.stubGlobal('fetch', fetchMock);
});

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

test('[G-01, PR-37] useLogin·useSignup 성공 시 access token과 refresh token이 authStore에 저장된다', async () => {
  fetchMock.mockResolvedValueOnce(json(200, authResponse));
  const login = renderHook(() => useLogin(), { wrapper: wrapperWith(freshClient(), '/login') });

  await act(async () => {
    await login.result.current.mutateAsync({ email: 'a@b.com', password: 'password1' });
  });

  expect(useAuthStore.getState().accessToken).toBe('at-1');
  expect(useAuthStore.getState().refreshToken).toBe('rt-1');
  expect(location()).toBe('/todos');
  cleanup();

  useAuthStore.getState().clear();
  fetchMock.mockResolvedValueOnce(
    json(201, { ...authResponse, accessToken: 'at-2', refreshToken: 'rt-2' }),
  );
  const signup = renderHook(() => useSignup(), { wrapper: wrapperWith(freshClient(), '/signup') });

  await act(async () => {
    await signup.result.current.mutateAsync({
      email: 'a@b.com',
      password: 'password1',
      name: '홍길동',
    });
  });

  expect(useAuthStore.getState().accessToken).toBe('at-2');
  expect(useAuthStore.getState().refreshToken).toBe('rt-2');
  expect(location()).toBe('/todos');
});

test('[SC-02-E1] useLogin 실패 시 토큰을 저장하지 않고 이동하지 않는다', async () => {
  fetchMock.mockResolvedValueOnce(
    json(401, {
      error: { code: 'UNAUTHORIZED', message: '이메일 또는 비밀번호가 올바르지 않습니다' },
    }),
  );
  const { result } = renderHook(() => useLogin(), {
    wrapper: wrapperWith(freshClient(), '/login'),
  });

  await act(async () => {
    await result.current.mutateAsync({ email: 'a@b.com', password: 'wrong' }).catch(() => {});
  });

  expect(useAuthStore.getState().accessToken).toBeNull();
  expect(useAuthStore.getState().refreshToken).toBeNull();
  expect(location()).toBe('/login');
});

test('[A-14, PR-16, PR-37] 로그아웃 시 저장된 refresh token으로 POST /api/auth/logout이 호출되고 토큰·쿼리 캐시가 비워지고 /login으로 이동한다', async () => {
  useAuthStore.setState({ accessToken: 'at-1', refreshToken: 'rt-1' });
  queryClient.setQueryData(['x'], 1);
  fetchMock.mockResolvedValueOnce(new Response(null, { status: 204 }));
  const { result } = renderHook(() => useLogout(), { wrapper: wrapperWith(queryClient, '/todos') });

  await act(async () => {
    await result.current();
  });

  expect(fetchMock).toHaveBeenCalledTimes(1);
  const [url, init] = fetchMock.mock.calls[0];
  expect(String(url)).toBe('/api/auth/logout');
  expect(init?.method).toBe('POST');
  expect(JSON.parse(String(init?.body))).toEqual({ refreshToken: 'rt-1' });
  expect(useAuthStore.getState().accessToken).toBeNull();
  expect(useAuthStore.getState().refreshToken).toBeNull();
  expect(queryClient.getQueryData(['x'])).toBeUndefined();
  expect(location()).toBe('/login');
});

test.each([
  ['네트워크 오류', () => fetchMock.mockRejectedValueOnce(new TypeError('Failed to fetch'))],
  [
    '5xx',
    () =>
      fetchMock.mockResolvedValueOnce(
        json(500, { error: { code: 'INTERNAL', message: '서버 오류' } }),
      ),
  ],
])(
  '[A-14] 로그아웃 API가 네트워크 오류·5xx여도 토큰 폐기와 /login 이동은 진행된다 (%s)',
  async (_, arrange) => {
    useAuthStore.setState({ accessToken: 'at-1', refreshToken: 'rt-1' });
    queryClient.setQueryData(['x'], 1);
    arrange();
    const { result } = renderHook(() => useLogout(), {
      wrapper: wrapperWith(queryClient, '/todos'),
    });

    await act(async () => {
      await result.current();
    });

    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(useAuthStore.getState().accessToken).toBeNull();
    expect(useAuthStore.getState().refreshToken).toBeNull();
    expect(queryClient.getQueryData(['x'])).toBeUndefined();
    expect(location()).toBe('/login');
  },
);

test('[A-14] refresh token이 없으면 로그아웃 API를 호출하지 않고 /login으로 이동한다', async () => {
  useAuthStore.setState({ accessToken: 'at-1', refreshToken: null });
  queryClient.setQueryData(['x'], 1);
  const { result } = renderHook(() => useLogout(), { wrapper: wrapperWith(queryClient, '/todos') });

  await act(async () => {
    await result.current();
  });

  expect(fetchMock).not.toHaveBeenCalled();
  expect(useAuthStore.getState().accessToken).toBeNull();
  expect(queryClient.getQueryData(['x'])).toBeUndefined();
  expect(location()).toBe('/login');
});
