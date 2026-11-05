import type { ReactNode } from 'react';
import { afterEach, beforeEach, expect, test, vi } from 'vitest';
import { cleanup, renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useAuthStore } from '../stores/authStore';
import { CALENDAR_MAX_DAYS, useCalendarTodos } from './useCalendarTodos';

const fetchMock = vi.fn<typeof fetch>();

function json(status: number, body: unknown): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

function renderCalendar(range: { from: string; to: string } | null) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  const view = renderHook(() => useCalendarTodos(range), {
    wrapper: ({ children }: { children: ReactNode }) => (
      <QueryClientProvider client={client}>{children}</QueryClientProvider>
    ),
  });
  return { ...view, client };
}

beforeEach(() => {
  useAuthStore.getState().clear();
  localStorage.clear();
  fetchMock.mockReset();
  fetchMock.mockImplementation(async () => json(200, { items: [] }));
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

test('[AQ-05] useCalendarTodos가 from·to·today를 쿼리에 넣고 기간이 42일 이하다', async () => {
  expect(CALENDAR_MAX_DAYS).toBe(42);

  // 2026-11-01~2026-12-12 = 42일 → 요청 1회
  const { result, client } = renderCalendar({ from: '2026-11-01', to: '2026-12-12' });
  await waitFor(() => expect(result.current.isSuccess).toBe(true));

  expect(fetchMock).toHaveBeenCalledTimes(1);
  const url = new URL(String(fetchMock.mock.calls[0][0]), 'http://x');
  expect(url.pathname).toBe('/api/todos/calendar');
  expect(fetchMock.mock.calls[0][1]?.method ?? 'GET').toBe('GET');
  expect(url.searchParams.get('from')).toBe('2026-11-01');
  expect(url.searchParams.get('to')).toBe('2026-12-12');
  expect(url.searchParams.get('today')).toBe('2026-11-13');
  expect(client.getQueriesData({ queryKey: ['todos', 'calendar'] }).length).toBeGreaterThan(0);
  cleanup();

  // 43일 → 요청하지 않는다
  fetchMock.mockClear();
  const over = renderCalendar({ from: '2026-11-01', to: '2026-12-13' });
  // null → 요청하지 않는다
  const none = renderCalendar(null);
  await new Promise((r) => setTimeout(r, 20));
  expect(over.result.current.fetchStatus).toBe('idle');
  expect(none.result.current.fetchStatus).toBe('idle');
  expect(fetchMock).not.toHaveBeenCalled();
});
