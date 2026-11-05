import { afterEach, beforeEach, expect, test, vi } from 'vitest';
import { useAuthStore } from '../stores/authStore';
import { changePassword, getMe, updateName } from './users';
import { ApiError } from './client';

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

beforeEach(() => {
  useAuthStore.getState().clear();
  localStorage.clear();
  useAuthStore.setState({ accessToken: 'at-1', refreshToken: 'rt-old' });
  fetchMock.mockReset();
  vi.stubGlobal('fetch', fetchMock);
});

afterEach(() => {
  vi.unstubAllGlobals();
});

test('[UC-10] getMe는 GET /api/users/me를 호출하고 User를 반환한다', async () => {
  fetchMock.mockResolvedValueOnce(json(200, me));

  await expect(getMe()).resolves.toEqual(me);

  const [url, init] = fetchMock.mock.calls[0];
  expect(String(url)).toBe('/api/users/me');
  expect(init?.method ?? 'GET').toBe('GET');
  expect(init?.body).toBeUndefined();
});

test('[UC-10] updateName은 PATCH /api/users/me로 name을 보내고 User를 반환한다', async () => {
  fetchMock.mockResolvedValueOnce(json(200, { ...me, name: '김철수' }));

  await expect(updateName('김철수')).resolves.toEqual({ ...me, name: '김철수' });

  const [url, init] = fetchMock.mock.calls[0];
  expect(String(url)).toBe('/api/users/me');
  expect(init?.method).toBe('PATCH');
  expect(JSON.parse(String(init?.body))).toEqual({ name: '김철수' });
});

test('[UC-10, G-06] changePassword는 PUT /api/users/me/password로 두 비밀번호를 보내고 { refreshToken }을 반환한다', async () => {
  fetchMock.mockResolvedValueOnce(json(200, { refreshToken: 'rt-new' }));

  await expect(
    changePassword({ currentPassword: 'old-pass-1', newPassword: 'new-pass-1' }),
  ).resolves.toEqual({ refreshToken: 'rt-new' });

  const [url, init] = fetchMock.mock.calls[0];
  expect(String(url)).toBe('/api/users/me/password');
  expect(init?.method).toBe('PUT');
  expect(JSON.parse(String(init?.body))).toEqual({
    currentPassword: 'old-pass-1',
    newPassword: 'new-pass-1',
  });
});

test('[SC-10-E1] changePassword 400은 fields를 가진 ApiError로 돌려준다', async () => {
  fetchMock.mockResolvedValueOnce(
    json(400, {
      error: {
        code: 'VALIDATION_ERROR',
        message: '입력값을 확인해 주세요',
        fields: { currentPassword: '현재 비밀번호가 올바르지 않습니다' },
      },
    }),
  );

  const err = await changePassword({
    currentPassword: 'wrong-pass',
    newPassword: 'new-pass-1',
  }).catch((e: unknown) => e);

  expect(err).toBeInstanceOf(ApiError);
  expect((err as ApiError).status).toBe(400);
  expect((err as ApiError).fields).toEqual({
    currentPassword: '현재 비밀번호가 올바르지 않습니다',
  });
});
