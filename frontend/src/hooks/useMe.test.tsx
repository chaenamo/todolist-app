import type { ReactNode } from 'react';
import { act } from 'react';
import { afterEach, beforeEach, expect, test, vi } from 'vitest';
import { cleanup, renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useAuthStore } from '../stores/authStore';
import type { User } from '../api/types';
import { ME_KEY, useChangePassword, useMe, useUpdateName } from './useMe';

const fetchMock = vi.fn<typeof fetch>();

function json(status: number, body: unknown): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

let me: User;

function routeFetch() {
  fetchMock.mockImplementation(async (input, init) => {
    const url = String(input);
    const method = init?.method ?? 'GET';
    if (url === '/api/users/me' && method === 'GET') return json(200, me);
    if (url === '/api/users/me' && method === 'PATCH') {
      const { name } = JSON.parse(String(init?.body)) as { name: string };
      me = { ...me, name };
      return json(200, me);
    }
    if (url === '/api/users/me/password' && method === 'PUT') {
      return json(200, { refreshToken: 'rt-new' });
    }
    return json(404, { error: { code: 'NOT_FOUND', message: '없음' } });
  });
}

function freshClient() {
  return new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
}

function wrapperWith(client: QueryClient) {
  return function Wrapper({ children }: { children: ReactNode }) {
    return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
  };
}

beforeEach(() => {
  useAuthStore.getState().clear();
  localStorage.clear();
  useAuthStore.setState({ accessToken: 'at-1', refreshToken: 'rt-old' });
  me = { id: 1, email: 'me@test.example', name: '홍길동', createdAt: '2026-11-01T00:00:00.000Z' };
  fetchMock.mockReset();
  vi.stubGlobal('fetch', fetchMock);
});

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

test("[UC-10] ME_KEY는 ['me']이고 useMe의 data는 User이다", async () => {
  routeFetch();
  const client = freshClient();
  const { result } = renderHook(() => useMe(), { wrapper: wrapperWith(client) });

  await waitFor(() => expect(result.current.isSuccess).toBe(true));

  expect(ME_KEY).toEqual(['me']);
  expect(result.current.data).toEqual(me);
  expect(client.getQueryData(ME_KEY)).toEqual(me);
});

test('[SC-10] useUpdateName 성공 시 ME_KEY를 무효화한다', async () => {
  routeFetch();
  const client = freshClient();
  const spy = vi.spyOn(client, 'invalidateQueries');
  const { result } = renderHook(() => useUpdateName(), { wrapper: wrapperWith(client) });

  await act(async () => {
    await result.current.mutateAsync('김철수');
  });

  expect(spy).toHaveBeenCalledWith(expect.objectContaining({ queryKey: ME_KEY }));
  const patch = fetchMock.mock.calls.find(([, init]) => init?.method === 'PATCH');
  expect(JSON.parse(String(patch?.[1]?.body))).toEqual({ name: '김철수' });
});

test('[G-06] useChangePassword 성공 시 응답의 refresh token으로 교체하고 access token은 유지한다', async () => {
  routeFetch();
  const { result } = renderHook(() => useChangePassword(), {
    wrapper: wrapperWith(freshClient()),
  });

  await act(async () => {
    await result.current.mutateAsync({ currentPassword: 'old-pass-1', newPassword: 'new-pass-1' });
  });

  expect(useAuthStore.getState().refreshToken).toBe('rt-new');
  expect(useAuthStore.getState().accessToken).toBe('at-1');
});

test('[SC-10-E1] useChangePassword 400은 실패하고 토큰을 바꾸지 않는다', async () => {
  routeFetch();
  fetchMock.mockResolvedValueOnce(
    json(400, {
      error: {
        code: 'VALIDATION_ERROR',
        message: '입력값을 확인해 주세요',
        fields: { currentPassword: '현재 비밀번호가 올바르지 않습니다' },
      },
    }),
  );
  const { result } = renderHook(() => useChangePassword(), {
    wrapper: wrapperWith(freshClient()),
  });

  let err: unknown;
  await act(async () => {
    err = await result.current
      .mutateAsync({ currentPassword: 'wrong-pass', newPassword: 'new-pass-1' })
      .catch((e: unknown) => e);
  });

  expect((err as { status: number }).status).toBe(400);
  expect(useAuthStore.getState().refreshToken).toBe('rt-old');
  expect(useAuthStore.getState().accessToken).toBe('at-1');
});
