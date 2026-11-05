import type { ReactNode } from 'react';
import { afterEach, beforeEach, expect, test, vi } from 'vitest';
import { cleanup, renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useAuthStore } from '../stores/authStore';
import {
  TODOS_KEY,
  useCreateTodo,
  useDeleteTodo,
  useSetCompleted,
  useTodo,
  useTodoList,
  useUpdateTodo,
} from './useTodos';

const fetchMock = vi.fn<typeof fetch>();

function json(status: number, body: unknown): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

beforeEach(() => {
  useAuthStore.getState().clear();
  localStorage.clear();
  fetchMock.mockReset();
  fetchMock.mockImplementation(async () => json(200, { items: [], page: 1, limit: 20, total: 0 }));
  vi.stubGlobal('fetch', fetchMock);
  // react-query 타이머는 그대로 두고 Date만 고정한다
  vi.useFakeTimers({ toFake: ['Date'] });
  vi.setSystemTime(new Date(2026, 10, 13, 9, 0));
});

afterEach(() => {
  cleanup();
  vi.useRealTimers();
  vi.unstubAllGlobals();
});

test('[PR-05, U-04] useTodoList 요청 URL에 today(로컬 날짜)·categoryId·status=A,B·page가 들어간다', async () => {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  const { result } = renderHook(
    () => useTodoList({ categoryId: 2, statuses: ['IN_PROGRESS', 'OVERDUE'], page: 3 }),
    {
      wrapper: ({ children }: { children: ReactNode }) => (
        <QueryClientProvider client={client}>{children}</QueryClientProvider>
      ),
    },
  );

  await waitFor(() => expect(result.current.isSuccess).toBe(true));

  const url = new URL(String(fetchMock.mock.calls[0][0]), 'http://x');
  expect(url.pathname).toBe('/api/todos');
  expect(url.searchParams.get('today')).toBe('2026-11-13');
  expect(url.searchParams.get('categoryId')).toBe('2');
  expect(url.searchParams.get('status')).toBe('IN_PROGRESS,OVERDUE');
  expect(url.searchParams.get('page')).toBe('3');
  expect(TODOS_KEY).toEqual(['todos']);
  expect(client.getQueriesData({ queryKey: TODOS_KEY }).length).toBeGreaterThan(0);
});

function renderMutation<T>(hook: () => T) {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  const spy = vi.spyOn(client, 'invalidateQueries');
  const view = renderHook(hook, {
    wrapper: ({ children }: { children: ReactNode }) => (
      <QueryClientProvider client={client}>{children}</QueryClientProvider>
    ),
  });
  return { ...view, spy };
}

function invalidatedTodos(spy: { mock: { calls: unknown[][] } }): boolean {
  return spy.mock.calls.some(([filters]) => {
    const key = (filters as { queryKey?: readonly unknown[] } | undefined)?.queryKey;
    return key?.[0] === TODOS_KEY[0];
  });
}

function respondWith(status: number) {
  fetchMock.mockImplementation(async () =>
    status === 204
      ? new Response(null, { status: 204 })
      : status < 300
        ? json(status, { id: 7, isCompleted: true })
        : json(status, {
            error: { code: status === 404 ? 'NOT_FOUND' : 'INTERNAL', message: '오류' },
          }),
  );
}

test('[AQ-03] useSetCompleted 성공 시 PATCH 후 todos 쿼리를 무효화한다', async () => {
  respondWith(200);
  const { result, spy } = renderMutation(() => useSetCompleted());

  result.current.mutate({ id: 7, isCompleted: true });

  await waitFor(() => expect(result.current.isSuccess).toBe(true));
  const [input, init] = fetchMock.mock.calls[0];
  expect(new URL(String(input), 'http://x').pathname).toBe('/api/todos/7');
  expect(init?.method).toBe('PATCH');
  expect(JSON.parse(String(init?.body))).toEqual({ isCompleted: true });
  expect(invalidatedTodos(spy)).toBe(true);
});

test('[SC-06-E1] useSetCompleted 404면 todos 쿼리를 무효화한다', async () => {
  respondWith(404);
  const { result, spy } = renderMutation(() => useSetCompleted());

  result.current.mutate({ id: 7, isCompleted: true });

  await waitFor(() => expect(result.current.isError).toBe(true));
  expect(invalidatedTodos(spy)).toBe(true);
});

test('[SC-06-E1] useSetCompleted 500이면 무효화하지 않는다', async () => {
  respondWith(500);
  const { result, spy } = renderMutation(() => useSetCompleted());

  result.current.mutate({ id: 7, isCompleted: true });

  await waitFor(() => expect(result.current.isError).toBe(true));
  expect(invalidatedTodos(spy)).toBe(false);
});

test('[AQ-03] useDeleteTodo 성공 시 DELETE 후 todos 쿼리를 무효화한다', async () => {
  respondWith(204);
  const { result, spy } = renderMutation(() => useDeleteTodo());

  result.current.mutate(7);

  await waitFor(() => expect(result.current.isSuccess).toBe(true));
  const [input, init] = fetchMock.mock.calls[0];
  expect(new URL(String(input), 'http://x').pathname).toBe('/api/todos/7');
  expect(init?.method).toBe('DELETE');
  expect(invalidatedTodos(spy)).toBe(true);
});

test('[SC-08-E1] useDeleteTodo 404면 todos 쿼리를 무효화한다', async () => {
  respondWith(404);
  const { result, spy } = renderMutation(() => useDeleteTodo());

  result.current.mutate(7);

  await waitFor(() => expect(result.current.isError).toBe(true));
  expect(invalidatedTodos(spy)).toBe(true);
});

test('[SC-08-E1] useDeleteTodo 500이면 무효화하지 않는다', async () => {
  respondWith(500);
  const { result, spy } = renderMutation(() => useDeleteTodo());

  result.current.mutate(7);

  await waitFor(() => expect(result.current.isError).toBe(true));
  expect(invalidatedTodos(spy)).toBe(false);
});

const todoInput = {
  title: '보고서 작성',
  description: null,
  categoryId: 1,
  startDate: '2026-11-10',
  endDate: '2026-11-12',
};

test('[UC-07] useTodo(null)은 요청하지 않는다', async () => {
  const { result } = renderMutation(() => useTodo(null));

  await Promise.resolve();
  expect(result.current.fetchStatus).toBe('idle');
  expect(fetchMock).not.toHaveBeenCalled();
});

test('[UC-07] useTodo(id)는 GET /api/todos/{id}로 조회한다', async () => {
  fetchMock.mockImplementation(async () => json(200, { id: 7, ...todoInput }));
  const { result } = renderMutation(() => useTodo(7));

  await waitFor(() => expect(result.current.isSuccess).toBe(true));
  expect(new URL(String(fetchMock.mock.calls[0][0]), 'http://x').pathname).toBe('/api/todos/7');
  expect(result.current.data?.title).toBe('보고서 작성');
});

test('[SC-07-E2] useTodo 404는 재시도하지 않는다', async () => {
  // 기본 retry를 켠 클라이언트에서도 1번만 호출되어야 한다
  respondWith(404);
  const client = new QueryClient();
  const { result } = renderHook(() => useTodo(7), {
    wrapper: ({ children }: { children: ReactNode }) => (
      <QueryClientProvider client={client}>{children}</QueryClientProvider>
    ),
  });

  await waitFor(() => expect(result.current.isError).toBe(true));
  expect(fetchMock).toHaveBeenCalledTimes(1);
});

test('[AQ-03] useCreateTodo 성공 시 POST 후 todos 쿼리를 무효화한다', async () => {
  respondWith(201);
  const { result, spy } = renderMutation(() => useCreateTodo());

  result.current.mutate(todoInput);

  await waitFor(() => expect(result.current.isSuccess).toBe(true));
  const [input, init] = fetchMock.mock.calls[0];
  expect(new URL(String(input), 'http://x').pathname).toBe('/api/todos');
  expect(init?.method).toBe('POST');
  expect(JSON.parse(String(init?.body))).toEqual(todoInput);
  expect(invalidatedTodos(spy)).toBe(true);
});

test('[AQ-03] useUpdateTodo 성공 시 PUT 후 todos 쿼리를 무효화한다', async () => {
  respondWith(200);
  const { result, spy } = renderMutation(() => useUpdateTodo());

  result.current.mutate({ id: 7, input: todoInput });

  await waitFor(() => expect(result.current.isSuccess).toBe(true));
  const [input, init] = fetchMock.mock.calls[0];
  expect(new URL(String(input), 'http://x').pathname).toBe('/api/todos/7');
  expect(init?.method).toBe('PUT');
  expect(JSON.parse(String(init?.body))).toEqual(todoInput);
  expect(invalidatedTodos(spy)).toBe(true);
});
