import { afterEach, beforeEach, expect, test, vi } from 'vitest';
import { useAuthStore } from '../stores/authStore';
import { createCategory, deleteCategory, listCategories, renameCategory } from './categories';
import { ApiError } from './client';

const fetchMock = vi.fn<typeof fetch>();

function json(status: number, body: unknown): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

const items = [
  { id: 1, name: '기본', isDefault: true },
  { id: 2, name: '업무', isDefault: false },
];

beforeEach(() => {
  useAuthStore.getState().clear();
  localStorage.clear();
  fetchMock.mockReset();
  vi.stubGlobal('fetch', fetchMock);
});

afterEach(() => {
  vi.unstubAllGlobals();
});

test('[UC-03] listCategories는 GET /api/categories를 호출하고 { items }를 반환한다', async () => {
  fetchMock.mockResolvedValueOnce(json(200, { items }));

  await expect(listCategories()).resolves.toEqual({ items });

  const [url, init] = fetchMock.mock.calls[0];
  expect(String(url)).toBe('/api/categories');
  expect(init?.method).toBe('GET');
  expect(init?.body).toBeUndefined();
});

test('[UC-03] createCategory는 POST /api/categories로 name을 보내고 Category를 반환한다', async () => {
  fetchMock.mockResolvedValueOnce(json(201, { id: 3, name: '개인', isDefault: false }));

  await expect(createCategory('개인')).resolves.toEqual({ id: 3, name: '개인', isDefault: false });

  const [url, init] = fetchMock.mock.calls[0];
  expect(String(url)).toBe('/api/categories');
  expect(init?.method).toBe('POST');
  expect(JSON.parse(String(init?.body))).toEqual({ name: '개인' });
});

test('[SC-03-E2] createCategory 409는 fields를 가진 ApiError로 돌려준다', async () => {
  fetchMock.mockResolvedValueOnce(
    json(409, {
      error: {
        code: 'CONFLICT',
        message: '이미 있는 이름입니다',
        fields: { name: '이미 있는 이름입니다' },
      },
    }),
  );

  const err = await createCategory('업무').catch((e: unknown) => e);

  expect(err).toBeInstanceOf(ApiError);
  expect((err as ApiError).status).toBe(409);
  expect((err as ApiError).code).toBe('CONFLICT');
  expect((err as ApiError).fields).toEqual({ name: '이미 있는 이름입니다' });
});

test('[UC-03] renameCategory는 PATCH /api/categories/{id}로 name을 보내고 Category를 반환한다', async () => {
  fetchMock.mockResolvedValueOnce(json(200, { id: 2, name: '회사', isDefault: false }));

  await expect(renameCategory(2, '회사')).resolves.toEqual({
    id: 2,
    name: '회사',
    isDefault: false,
  });

  const [url, init] = fetchMock.mock.calls[0];
  expect(String(url)).toBe('/api/categories/2');
  expect(init?.method).toBe('PATCH');
  expect(JSON.parse(String(init?.body))).toEqual({ name: '회사' });
});

test('[BR-07] renameCategory 409는 fields를 가진 ApiError로 돌려준다', async () => {
  fetchMock.mockResolvedValueOnce(
    json(409, {
      error: {
        code: 'CONFLICT',
        message: '이미 있는 이름입니다',
        fields: { name: '이미 있는 이름입니다' },
      },
    }),
  );

  const err = await renameCategory(2, '기본').catch((e: unknown) => e);

  expect(err).toBeInstanceOf(ApiError);
  expect((err as ApiError).status).toBe(409);
  expect((err as ApiError).fields).toEqual({ name: '이미 있는 이름입니다' });
});

test('[BR-09] deleteCategory는 DELETE /api/categories/{id}를 호출하고 204면 undefined를 반환한다', async () => {
  fetchMock.mockResolvedValueOnce(new Response(null, { status: 204 }));

  await expect(deleteCategory(2)).resolves.toBeUndefined();

  const [url, init] = fetchMock.mock.calls[0];
  expect(String(url)).toBe('/api/categories/2');
  expect(init?.method).toBe('DELETE');
  expect(init?.body).toBeUndefined();
});
