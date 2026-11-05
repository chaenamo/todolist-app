import { afterEach, beforeEach, expect, test, vi } from 'vitest';
import { useAuthStore } from '../stores/authStore';
import {
  createTodo,
  deleteTodo,
  getTodo,
  listCalendarTodos,
  listTodos,
  setCompleted,
  updateTodo,
} from './todos';

const fetchMock = vi.fn<typeof fetch>();

function json(status: number, body: unknown): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

const paged = { items: [], page: 2, limit: 20, total: 25 };

function calledUrl(): URL {
  return new URL(String(fetchMock.mock.calls[0][0]), 'http://x');
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

test('[UC-04, U-04] listTodos는 GET /api/todos에 today·categoryId·status·page를 붙이고 Paged를 반환한다', async () => {
  fetchMock.mockResolvedValueOnce(json(200, paged));

  await expect(
    listTodos({
      today: '2026-11-13',
      categoryId: 3,
      statuses: ['IN_PROGRESS', 'OVERDUE'],
      page: 2,
    }),
  ).resolves.toEqual(paged);

  const url = calledUrl();
  expect(url.pathname).toBe('/api/todos');
  expect(fetchMock.mock.calls[0][1]?.method).toBe('GET');
  expect(url.searchParams.get('today')).toBe('2026-11-13');
  expect(url.searchParams.get('categoryId')).toBe('3');
  expect(url.searchParams.get('status')).toBe('IN_PROGRESS,OVERDUE');
  expect(url.searchParams.get('page')).toBe('2');
});

test('[UC-04] categoryId가 null이고 statuses가 비면 categoryId·status 키를 보내지 않는다', async () => {
  fetchMock.mockResolvedValueOnce(json(200, paged));

  await listTodos({ today: '2026-11-13', categoryId: null, statuses: [], page: 1 });

  const url = calledUrl();
  expect(url.searchParams.has('categoryId')).toBe(false);
  expect(url.searchParams.has('status')).toBe(false);
  expect(url.searchParams.get('today')).toBe('2026-11-13');
  expect(url.searchParams.get('page')).toBe('1');
});

test('[UC-05] setCompleted는 PATCH /api/todos/{id}에 { isCompleted }를 보내고 Todo를 반환한다', async () => {
  const updated = { id: 7, title: '보고서 작성', isCompleted: true };
  fetchMock.mockResolvedValueOnce(json(200, updated));

  await expect(setCompleted(7, true)).resolves.toEqual(updated);

  expect(calledUrl().pathname).toBe('/api/todos/7');
  const init = fetchMock.mock.calls[0][1];
  expect(init?.method).toBe('PATCH');
  expect(JSON.parse(String(init?.body))).toEqual({ isCompleted: true });
});

test('[UC-06] deleteTodo는 DELETE /api/todos/{id}를 보내고 204면 undefined를 반환한다', async () => {
  fetchMock.mockResolvedValueOnce(new Response(null, { status: 204 }));

  await expect(deleteTodo(7)).resolves.toBeUndefined();

  expect(calledUrl().pathname).toBe('/api/todos/7');
  expect(fetchMock.mock.calls[0][1]?.method).toBe('DELETE');
});

const input = {
  title: '보고서 작성',
  description: null,
  categoryId: 2,
  startDate: '2026-11-10',
  endDate: '2026-11-12',
};

test('[UC-07] getTodo는 GET /api/todos/{id}를 보내고 Todo를 반환한다', async () => {
  const found = { id: 7, ...input, isCompleted: false };
  fetchMock.mockResolvedValueOnce(json(200, found));

  await expect(getTodo(7)).resolves.toEqual(found);

  expect(calledUrl().pathname).toBe('/api/todos/7');
  expect(fetchMock.mock.calls[0][1]?.method).toBe('GET');
});

test('[UC-03] createTodo는 POST /api/todos에 입력값을 보내고 생성된 Todo를 반환한다', async () => {
  const created = { id: 8, ...input, isCompleted: false };
  fetchMock.mockResolvedValueOnce(json(201, created));

  await expect(createTodo(input)).resolves.toEqual(created);

  expect(calledUrl().pathname).toBe('/api/todos');
  const init = fetchMock.mock.calls[0][1];
  expect(init?.method).toBe('POST');
  expect(JSON.parse(String(init?.body))).toEqual(input);
});

test('[UC-07, BR-17] updateTodo는 PUT /api/todos/{id}에 5개 키만 보낸다', async () => {
  const updated = { id: 7, ...input, isCompleted: true };
  fetchMock.mockResolvedValueOnce(json(200, updated));

  await expect(updateTodo(7, input)).resolves.toEqual(updated);

  expect(calledUrl().pathname).toBe('/api/todos/7');
  const init = fetchMock.mock.calls[0][1];
  expect(init?.method).toBe('PUT');
  const body = JSON.parse(String(init?.body)) as Record<string, unknown>;
  expect(Object.keys(body).sort()).toEqual([
    'categoryId',
    'description',
    'endDate',
    'startDate',
    'title',
  ]);
  expect(body).toEqual(input);
});

test('[UC-05, AQ-05] listCalendarTodos는 GET /api/todos/calendar에 from·to·today를 붙이고 items를 반환한다', async () => {
  const body = { items: [] };
  fetchMock.mockResolvedValueOnce(json(200, body));

  await expect(
    listCalendarTodos({ from: '2026-11-01', to: '2026-12-12', today: '2026-11-13' }),
  ).resolves.toEqual(body);

  const url = calledUrl();
  expect(url.pathname).toBe('/api/todos/calendar');
  expect(fetchMock.mock.calls[0][1]?.method).toBe('GET');
  expect(url.searchParams.get('from')).toBe('2026-11-01');
  expect(url.searchParams.get('to')).toBe('2026-12-12');
  expect(url.searchParams.get('today')).toBe('2026-11-13');
});
