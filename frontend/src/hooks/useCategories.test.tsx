import type { ReactNode } from 'react';
import { act } from 'react';
import { afterEach, beforeEach, expect, test, vi } from 'vitest';
import { cleanup, renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useAuthStore } from '../stores/authStore';
import { useUiStore } from '../stores/uiStore';
import type { Category } from '../api/types';
import {
  CATEGORIES_KEY,
  useCategories,
  useCreateCategory,
  useDeleteCategory,
  useRenameCategory,
} from './useCategories';

const fetchMock = vi.fn<typeof fetch>();

function json(status: number, body: unknown): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

let categories: Category[];

// GET은 무효화 후 다시 호출되므로 URL+method로 응답을 고른다
function routeFetch() {
  fetchMock.mockImplementation(async (input, init) => {
    const url = String(input);
    const method = init?.method ?? 'GET';
    if (url === '/api/categories' && method === 'GET') return json(200, { items: categories });
    if (url === '/api/categories' && method === 'POST') {
      const { name } = JSON.parse(String(init?.body)) as { name: string };
      const created = { id: categories.length + 1, name, isDefault: false };
      categories = [...categories, created];
      return json(201, created);
    }
    return json(404, { error: { code: 'NOT_FOUND', message: '없음' } });
  });
}

function getCalls(): number {
  return fetchMock.mock.calls.filter(([, init]) => (init?.method ?? 'GET') === 'GET').length;
}

function wrapperWith(client: QueryClient) {
  return function Wrapper({ children }: { children: ReactNode }) {
    return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
  };
}

function freshClient() {
  return new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
}

function renderBoth() {
  return renderHook(() => ({ list: useCategories(), create: useCreateCategory() }), {
    wrapper: wrapperWith(freshClient()),
  });
}

beforeEach(() => {
  useAuthStore.getState().clear();
  localStorage.clear();
  useUiStore.setState({ categoryId: null, statuses: [], page: 1 });
  categories = [{ id: 1, name: '기본', isDefault: true }];
  fetchMock.mockReset();
  vi.stubGlobal('fetch', fetchMock);
});

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

test("[PR-14] CATEGORIES_KEY는 ['categories']이고 useCategories의 data는 items 배열이다", async () => {
  routeFetch();
  const client = freshClient();
  const { result } = renderHook(() => useCategories(), { wrapper: wrapperWith(client) });

  await waitFor(() => expect(result.current.isSuccess).toBe(true));

  expect(CATEGORIES_KEY).toEqual(['categories']);
  expect(result.current.data).toEqual(categories);
  expect(client.getQueryData(CATEGORIES_KEY)).toBeDefined();
});

test('[PR-14, AQ-03] useCreateCategory 성공 후 카테고리 쿼리가 무효화되어 재조회된다', async () => {
  routeFetch();
  const { result } = renderBoth();

  await waitFor(() => expect(result.current.list.isSuccess).toBe(true));
  expect(getCalls()).toBe(1);

  await act(async () => {
    await result.current.create.mutateAsync('업무');
  });

  await waitFor(() => expect(getCalls()).toBe(2));
  await waitFor(() =>
    expect(result.current.list.data?.map((c) => c.name)).toEqual(['기본', '업무']),
  );
});

test('[SC-03-E2] useCreateCategory 409는 ApiError로 실패하고 재조회하지 않는다', async () => {
  routeFetch();
  const { result } = renderBoth();
  await waitFor(() => expect(result.current.list.isSuccess).toBe(true));
  fetchMock.mockResolvedValueOnce(
    json(409, {
      error: {
        code: 'CONFLICT',
        message: '이미 있는 이름입니다',
        fields: { name: '이미 있는 이름입니다' },
      },
    }),
  );

  let err: unknown;
  await act(async () => {
    err = await result.current.create.mutateAsync('기본').catch((e: unknown) => e);
  });

  expect((err as { status: number }).status).toBe(409);
  expect(getCalls()).toBe(1);
});

function renderMutation<T>(hook: () => T) {
  const client = freshClient();
  const spy = vi.spyOn(client, 'invalidateQueries');
  return { ...renderHook(hook, { wrapper: wrapperWith(client) }), spy };
}

function invalidatedKeys(spy: { mock: { calls: unknown[][] } }): unknown[] {
  return spy.mock.calls.map(
    ([filters]) => (filters as { queryKey?: readonly unknown[] } | undefined)?.queryKey,
  );
}

function respondWith(status: number) {
  fetchMock.mockImplementation(async () =>
    status === 204
      ? new Response(null, { status: 204 })
      : status < 300
        ? json(status, { id: 2, name: '회사', isDefault: false })
        : json(status, {
            error: {
              code: 'CONFLICT',
              message: '이미 있는 이름입니다',
              fields: { name: '이미 있는 이름입니다' },
            },
          }),
  );
}

test('[BR-07] useRenameCategory 성공 시 PATCH 후 카테고리·할일 쿼리를 무효화한다', async () => {
  respondWith(200);
  const { result, spy } = renderMutation(() => useRenameCategory());

  result.current.mutate({ id: 2, name: '회사' });

  await waitFor(() => expect(result.current.isSuccess).toBe(true));
  const [input, init] = fetchMock.mock.calls[0];
  expect(String(input)).toBe('/api/categories/2');
  expect(init?.method).toBe('PATCH');
  expect(JSON.parse(String(init?.body))).toEqual({ name: '회사' });
  expect(invalidatedKeys(spy)).toContainEqual(['categories']);
  expect(invalidatedKeys(spy)).toContainEqual(['todos']);
});

test('[BR-07] useRenameCategory 409면 ApiError로 실패하고 무효화하지 않는다', async () => {
  respondWith(409);
  const { result, spy } = renderMutation(() => useRenameCategory());

  result.current.mutate({ id: 2, name: '기본' });

  await waitFor(() => expect(result.current.isError).toBe(true));
  expect((result.current.error as unknown as { status: number }).status).toBe(409);
  expect(spy).not.toHaveBeenCalled();
});

test('[SC-03-A2, BR-09] 삭제는 확인 모달을 거치고, 성공 후 카테고리·할일 목록 쿼리가 무효화된다', async () => {
  respondWith(204);
  const { result, spy } = renderMutation(() => useDeleteCategory());

  result.current.mutate(2);

  await waitFor(() => expect(result.current.isSuccess).toBe(true));
  const [input, init] = fetchMock.mock.calls[0];
  expect(String(input)).toBe('/api/categories/2');
  expect(init?.method).toBe('DELETE');
  expect(invalidatedKeys(spy)).toContainEqual(['categories']);
  expect(invalidatedKeys(spy)).toContainEqual(['todos']);
});

test('[G-08] 필터 중인 카테고리 삭제 시 uiStore categoryId가 해제된다', async () => {
  respondWith(204);
  useUiStore.setState({ categoryId: 2 });
  const { result } = renderMutation(() => useDeleteCategory());

  result.current.mutate(2);

  await waitFor(() => expect(result.current.isSuccess).toBe(true));
  expect(useUiStore.getState().categoryId).toBeNull();
});

test('[G-08] 다른 카테고리를 삭제하면 uiStore categoryId 필터는 유지된다', async () => {
  respondWith(204);
  useUiStore.setState({ categoryId: 3 });
  const { result } = renderMutation(() => useDeleteCategory());

  result.current.mutate(2);

  await waitFor(() => expect(result.current.isSuccess).toBe(true));
  expect(useUiStore.getState().categoryId).toBe(3);
});

test('[BR-09] useDeleteCategory 실패(500) 시 필터를 유지하고 무효화하지 않는다', async () => {
  fetchMock.mockImplementation(async () =>
    json(500, { error: { code: 'INTERNAL', message: '서버 오류' } }),
  );
  useUiStore.setState({ categoryId: 2 });
  const { result, spy } = renderMutation(() => useDeleteCategory());

  result.current.mutate(2);

  await waitFor(() => expect(result.current.isError).toBe(true));
  expect(useUiStore.getState().categoryId).toBe(2);
  expect(spy).not.toHaveBeenCalled();
});
