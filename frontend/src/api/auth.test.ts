import { afterEach, beforeEach, expect, test, vi } from 'vitest';
import { useAuthStore } from '../stores/authStore';
import { login, logout, signup } from './auth';
import { ApiError } from './client';

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

function callOf(i: number) {
  const [url, init] = fetchMock.mock.calls[i];
  return { url: String(url), method: init?.method, body: JSON.parse(String(init?.body)) };
}

beforeEach(() => {
  useAuthStore.getState().clear();
  localStorage.clear();
  fetchMock.mockReset();
  vi.stubGlobal('fetch', fetchMock);
});

afterEach(() => {
  vi.unstubAllGlobals();
});

test('[UC-01] signup은 POST /api/auth/signup으로 email·password·name을 보내고 AuthResponse를 반환한다', async () => {
  fetchMock.mockResolvedValueOnce(json(201, authResponse));

  await expect(
    signup({ email: 'a@b.com', password: 'password1', name: '홍길동' }),
  ).resolves.toEqual(authResponse);

  expect(callOf(0)).toEqual({
    url: '/api/auth/signup',
    method: 'POST',
    body: { email: 'a@b.com', password: 'password1', name: '홍길동' },
  });
});

test('[UC-02] login은 POST /api/auth/login으로 email·password를 보내고 AuthResponse를 반환한다', async () => {
  fetchMock.mockResolvedValueOnce(json(200, authResponse));

  await expect(login({ email: 'a@b.com', password: 'password1' })).resolves.toEqual(authResponse);

  expect(callOf(0)).toEqual({
    url: '/api/auth/login',
    method: 'POST',
    body: { email: 'a@b.com', password: 'password1' },
  });
});

test('[A-14] logout은 POST /api/auth/logout으로 refreshToken을 보내고 204면 undefined로 끝난다', async () => {
  fetchMock.mockResolvedValueOnce(new Response(null, { status: 204 }));

  await expect(logout('rt-1')).resolves.toBeUndefined();

  expect(callOf(0)).toEqual({
    url: '/api/auth/logout',
    method: 'POST',
    body: { refreshToken: 'rt-1' },
  });
});

test('[AQ-01] login 401은 refresh 없이 ApiError로 돌려준다', async () => {
  useAuthStore.setState({ accessToken: null, refreshToken: 'rt-old' });
  fetchMock.mockResolvedValueOnce(
    json(401, {
      error: { code: 'UNAUTHORIZED', message: '이메일 또는 비밀번호가 올바르지 않습니다' },
    }),
  );

  const err = await login({ email: 'a@b.com', password: 'wrong' }).catch((e: unknown) => e);

  expect(err).toBeInstanceOf(ApiError);
  expect((err as ApiError).status).toBe(401);
  expect((err as ApiError).message).toBe('이메일 또는 비밀번호가 올바르지 않습니다');
  expect(fetchMock).toHaveBeenCalledTimes(1);
});
