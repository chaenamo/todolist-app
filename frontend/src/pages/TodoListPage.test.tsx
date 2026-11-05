import { afterEach, beforeEach, expect, test, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router';
import { useAuthStore } from '../stores/authStore';
import { useUiStore } from '../stores/uiStore';
import { useToastStore } from '../stores/toastStore';
import { Toaster } from '../components/Toast';
import type { Category, Paged, TodoWithStatus } from '../api/types';
import { TodoListPage } from './TodoListPage';

const fetchMock = vi.fn<typeof fetch>();

function json(status: number, body: unknown): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

function todo(over: Partial<TodoWithStatus> = {}): TodoWithStatus {
  return {
    id: 1,
    categoryId: 2,
    title: '보고서 작성',
    description: null,
    startDate: '2026-11-10',
    endDate: '2026-11-12',
    isCompleted: false,
    completedAt: null,
    createdAt: '2026-11-01T00:00:00Z',
    updatedAt: '2026-11-01T00:00:00Z',
    status: 'IN_PROGRESS',
    ...over,
  };
}

const categories: Category[] = [
  { id: 1, name: '기본', isDefault: true },
  { id: 2, name: '업무', isDefault: false },
];

let todos: Paged<TodoWithStatus>;
// 테스트별 PATCH/DELETE /api/todos/{id} 응답
let mutate: (method: string, init?: RequestInit) => Promise<Response>;

function routeFetch() {
  fetchMock.mockImplementation(async (input, init) => {
    const url = new URL(String(input), 'http://x');
    const method = init?.method ?? 'GET';
    if (url.pathname === '/api/categories' && method === 'GET') {
      return json(200, { items: categories });
    }
    if (url.pathname === '/api/todos' && method === 'GET') return json(200, todos);
    if (url.pathname === '/api/todos/1' && (method === 'PATCH' || method === 'DELETE')) {
      return mutate(method, init);
    }
    return json(404, { error: { code: 'NOT_FOUND', message: '없음' } });
  });
}

function todoUrls(): URL[] {
  return fetchMock.mock.calls
    .map(([input]) => new URL(String(input), 'http://x'))
    .filter((u) => u.pathname === '/api/todos');
}

function lastTodoUrl(): URL {
  return todoUrls().at(-1)!;
}

function renderPage() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={client}>
      <MemoryRouter initialEntries={['/todos']}>
        <TodoListPage />
        <Toaster />
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

beforeEach(() => {
  useAuthStore.getState().clear();
  localStorage.clear();
  useUiStore.setState({ categoryId: null, statuses: [], page: 1 });
  useToastStore.setState({ toasts: [] });
  mutate = async () => json(500, { error: { code: 'INTERNAL', message: '미설정' } });
  todos = { items: [todo()], page: 1, limit: 20, total: 1 };
  fetchMock.mockReset();
  routeFetch();
  vi.stubGlobal('fetch', fetchMock);
});

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

test('[WF-04] 목록 화면은 제목·새 할일 링크·목록을 가지고 행에 카테고리명이 보인다', async () => {
  renderPage();

  expect(screen.getByRole('heading', { name: '할일 목록' })).toBeTruthy();
  expect(screen.getByRole('link', { name: '+ 새 할일' }).getAttribute('href')).toBe('/todos/new');
  const list = await screen.findByRole('list', { name: '할일 목록' });
  expect(within(list).getAllByRole('listitem')).toHaveLength(1);
  expect(within(list).getByRole('link', { name: '보고서 작성 수정' })).toBeTruthy();
  await waitFor(() => expect(list.textContent).toContain('업무'));
});

test('[BR-15, G-09] 상태 체크박스 2개 선택 시 status에 두 값이 쉼표로 들어가고 page가 1로 돌아간다', async () => {
  useUiStore.setState({ page: 3 });
  todos = { items: [todo()], page: 3, limit: 20, total: 100 };
  renderPage();
  await screen.findByRole('list', { name: '할일 목록' });
  expect(lastTodoUrl().searchParams.get('page')).toBe('3');

  fireEvent.click(screen.getByRole('checkbox', { name: '진행 중' }));
  fireEvent.click(screen.getByRole('checkbox', { name: '기한 초과' }));

  await waitFor(() => expect(lastTodoUrl().searchParams.get('status')).toBe('IN_PROGRESS,OVERDUE'));
  expect(lastTodoUrl().searchParams.get('page')).toBe('1');
  expect(useUiStore.getState().page).toBe(1);
});

test('[G-09] 카테고리 선택 시 categoryId가 요청에 들어가고 store에 반영된다', async () => {
  renderPage();
  await screen.findByRole('list', { name: '할일 목록' });
  expect(lastTodoUrl().searchParams.has('categoryId')).toBe(false);
  await screen.findByRole('option', { name: '업무' });

  fireEvent.change(screen.getByLabelText('카테고리'), { target: { value: '2' } });

  await waitFor(() => expect(lastTodoUrl().searchParams.get('categoryId')).toBe('2'));
  expect(useUiStore.getState().categoryId).toBe(2);
});

test('[PR-03] 응답 status가 StatusBadge로 표시된다', async () => {
  // 날짜로 계산하면 기한 초과지만 서버 status(완료)를 그대로 보여야 한다
  todos = {
    items: [todo({ startDate: '2020-01-01', endDate: '2020-01-02', status: 'COMPLETED' })],
    page: 1,
    limit: 20,
    total: 1,
  };
  renderPage();

  const list = await screen.findByRole('list', { name: '할일 목록' });
  expect(list.textContent).toContain('완료');
  expect(list.textContent).not.toContain('기한 초과');
});

test('[PR-03] 프론트 소스 어디에도 deriveStatus가 없다', () => {
  const sources = import.meta.glob(['/src/**/*.{ts,tsx}', '!/src/**/*.test.*'], {
    query: '?raw',
    import: 'default',
    eager: true,
  }) as Record<string, string>;

  expect(Object.keys(sources).length).toBeGreaterThan(0);
  const offenders = Object.entries(sources)
    .filter(([, code]) => code.includes('deriveStatus'))
    .map(([path]) => path);
  expect(offenders).toEqual([]);
});

test('[SC-05-A3] 할일 0건이면 8a 문구, 필터 결과 0건이면 8b 문구와 초기화 버튼', async () => {
  todos = { items: [], page: 1, limit: 20, total: 0 };
  renderPage();

  expect(await screen.findByText('등록된 할일이 없습니다.')).toBeTruthy();
  expect(screen.getByRole('link', { name: '+ 첫 할일 등록' }).getAttribute('href')).toBe(
    '/todos/new',
  );
  expect(screen.queryByText('조건에 맞는 할일이 없습니다.')).toBeNull();
  cleanup();

  useUiStore.setState({ categoryId: 2, statuses: ['OVERDUE'], page: 1 });
  renderPage();

  expect(await screen.findByText('조건에 맞는 할일이 없습니다.')).toBeTruthy();
  expect(screen.queryByText('등록된 할일이 없습니다.')).toBeNull();
  const resetButtons = screen.getAllByRole('button', { name: '필터 초기화' });
  expect(resetButtons).toHaveLength(2);

  fireEvent.click(resetButtons[resetButtons.length - 1]);

  expect(useUiStore.getState().categoryId).toBeNull();
  expect(useUiStore.getState().statuses).toEqual([]);
  expect(useUiStore.getState().page).toBe(1);
  await waitFor(() => {
    expect(lastTodoUrl().searchParams.has('categoryId')).toBe(false);
    expect(lastTodoUrl().searchParams.has('status')).toBe(false);
  });
});

test('[WF-04] total ≤ limit이면 페이지네이션이 숨겨진다', async () => {
  todos = { items: [todo()], page: 1, limit: 20, total: 20 };
  renderPage();
  await screen.findByRole('list', { name: '할일 목록' });
  expect(screen.queryByRole('navigation', { name: '페이지' })).toBeNull();
  cleanup();

  todos = { items: [todo()], page: 1, limit: 20, total: 21 };
  renderPage();
  const nav = await screen.findByRole('navigation', { name: '페이지' });

  fireEvent.click(within(nav).getByRole('button', { name: '2' }));

  expect(useUiStore.getState().page).toBe(2);
  await waitFor(() => expect(lastTodoUrl().searchParams.get('page')).toBe('2'));
});

function mutationCalls(method: string) {
  return fetchMock.mock.calls.filter(
    ([input, init]) =>
      new URL(String(input), 'http://x').pathname === '/api/todos/1' && init?.method === method,
  );
}

function rowCheckbox(): HTMLInputElement {
  return screen.getByRole('checkbox', { name: '보고서 작성 완료' }) as HTMLInputElement;
}

test('[AQ-03, G-11] 토글 요청 중 체크박스가 disabled이고, 성공 후 목록 쿼리가 무효화된다', async () => {
  let resolvePatch!: (res: Response) => void;
  mutate = () => new Promise<Response>((r) => (resolvePatch = r));
  renderPage();
  await screen.findByRole('list', { name: '할일 목록' });
  const getsBefore = todoUrls().length;

  fireEvent.click(rowCheckbox());

  await waitFor(() => expect(rowCheckbox().disabled).toBe(true));
  expect(mutationCalls('PATCH')).toHaveLength(1);
  expect(JSON.parse(String(mutationCalls('PATCH')[0][1]?.body))).toEqual({ isCompleted: true });

  todos = {
    items: [todo({ isCompleted: true, status: 'COMPLETED' })],
    page: 1,
    limit: 20,
    total: 1,
  };
  resolvePatch(json(200, todo({ isCompleted: true })));

  await waitFor(() => expect(todoUrls().length).toBeGreaterThan(getsBefore));
  await waitFor(() => expect(rowCheckbox().checked).toBe(true));
  expect(rowCheckbox().disabled).toBe(false);
});

test('[SC-06-E1] 토글 실패(500) 시 체크 상태가 원래대로이고 실패 토스트가 뜬다', async () => {
  mutate = async () =>
    json(500, { error: { code: 'INTERNAL', message: '서버 오류가 발생했습니다' } });
  renderPage();
  await screen.findByRole('list', { name: '할일 목록' });
  const getsBefore = todoUrls().length;

  fireEvent.click(rowCheckbox());

  const alert = await screen.findByRole('alert');
  expect(alert.textContent).toContain('서버 오류가 발생했습니다');
  await waitFor(() => expect(rowCheckbox().disabled).toBe(false));
  expect(rowCheckbox().checked).toBe(false);
  expect(todoUrls().length).toBe(getsBefore);
});

test('[CMP-01, SC-08-A1] 삭제 버튼은 확인 모달을 열고, 취소 시 요청이 가지 않는다', async () => {
  renderPage();
  await screen.findByRole('list', { name: '할일 목록' });

  fireEvent.click(screen.getByRole('button', { name: '보고서 작성 삭제' }));

  const dialog = screen.getByRole('dialog', { name: '할일을 삭제할까요?' });
  fireEvent.click(within(dialog).getByRole('button', { name: '취소' }));

  expect(screen.queryByRole('dialog')).toBeNull();
  expect(mutationCalls('DELETE')).toHaveLength(0);
});

test('[SC-08] 삭제 확인 시 DELETE를 보내고 성공 토스트가 뜬 뒤 목록이 재조회된다', async () => {
  mutate = async () => new Response(null, { status: 204 });
  renderPage();
  await screen.findByRole('list', { name: '할일 목록' });
  const getsBefore = todoUrls().length;

  fireEvent.click(screen.getByRole('button', { name: '보고서 작성 삭제' }));
  todos = { items: [], page: 1, limit: 20, total: 0 };
  const dialog = screen.getByRole('dialog', { name: '할일을 삭제할까요?' });
  fireEvent.click(within(dialog).getByRole('button', { name: '삭제' }));

  expect((await screen.findByRole('status')).textContent).toContain('삭제했습니다.');
  expect(mutationCalls('DELETE')).toHaveLength(1);
  await waitFor(() => expect(todoUrls().length).toBeGreaterThan(getsBefore));
  expect(screen.queryByRole('dialog')).toBeNull();
});

test('[SC-08-E1] 삭제 404 시 "찾을 수 없음" 토스트 후 목록이 재조회된다', async () => {
  mutate = async () =>
    json(404, { error: { code: 'NOT_FOUND', message: '할일을 찾을 수 없습니다' } });
  renderPage();
  await screen.findByRole('list', { name: '할일 목록' });
  const getsBefore = todoUrls().length;

  fireEvent.click(screen.getByRole('button', { name: '보고서 작성 삭제' }));
  todos = { items: [], page: 1, limit: 20, total: 0 };
  const dialog = screen.getByRole('dialog', { name: '할일을 삭제할까요?' });
  fireEvent.click(within(dialog).getByRole('button', { name: '삭제' }));

  expect((await screen.findByRole('alert')).textContent).toContain(
    '요청하신 항목을 찾을 수 없습니다.',
  );
  expect(mutationCalls('DELETE')).toHaveLength(1);
  await waitFor(() => expect(todoUrls().length).toBeGreaterThan(getsBefore));
});
