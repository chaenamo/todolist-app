import { afterEach, beforeEach, expect, test, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter, Route, Routes } from 'react-router';
import { useAuthStore } from '../stores/authStore';
import { useToastStore } from '../stores/toastStore';
import { Toaster } from '../components/Toast';
import type { Category } from '../api/types';
import { TodoEditPage } from './TodoEditPage';

const fetchMock = vi.fn<typeof fetch>();

function json(status: number, body: unknown): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

const categories: Category[] = [
  { id: 1, name: '기본', isDefault: true },
  { id: 2, name: '업무', isDefault: false },
];

const existing = {
  id: 7,
  categoryId: 2,
  title: '보고서 작성',
  description: '분기 보고서',
  startDate: '2026-11-10',
  endDate: '2026-11-12',
  isCompleted: true,
  completedAt: '2026-11-11T00:00:00Z',
  createdAt: '2026-11-01T00:00:00Z',
  updatedAt: '2026-11-01T00:00:00Z',
};

let todoResponse: () => Response;
let saveResponse: (init?: RequestInit) => Response;

function routeFetch() {
  fetchMock.mockImplementation(async (input, init) => {
    const url = new URL(String(input), 'http://x');
    const method = init?.method ?? 'GET';
    if (url.pathname === '/api/categories' && method === 'GET') {
      return json(200, { items: categories });
    }
    if (url.pathname === '/api/todos/7' && method === 'GET') return todoResponse();
    if (url.pathname === '/api/todos' && method === 'POST') return saveResponse(init);
    if (url.pathname === '/api/todos/7' && method === 'PUT') return saveResponse(init);
    return json(404, { error: { code: 'NOT_FOUND', message: '없음' } });
  });
}

function saveCalls() {
  return fetchMock.mock.calls.filter(
    ([, init]) => init?.method === 'POST' || init?.method === 'PUT',
  );
}

function renderPage(pathname: string, state?: unknown) {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  return render(
    <QueryClientProvider client={client}>
      <MemoryRouter initialEntries={[{ pathname, state }]}>
        <Routes>
          <Route path="/todos/new" element={<TodoEditPage />} />
          <Route path="/todos/:id/edit" element={<TodoEditPage />} />
          <Route path="/todos" element={<p>목록 화면</p>} />
          <Route path="/calendar" element={<p>캘린더 화면</p>} />
        </Routes>
        <Toaster />
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

function field(label: RegExp | string): HTMLInputElement {
  return screen.getByLabelText(label) as HTMLInputElement;
}

function change(label: RegExp | string, value: string) {
  fireEvent.change(field(label), { target: { value } });
}

function errorOf(label: RegExp | string): string {
  const ids = field(label).getAttribute('aria-describedby') ?? '';
  return ids
    .split(' ')
    .map((id) => document.getElementById(id)?.textContent ?? '')
    .join(' ');
}

async function fillNew(start: string, end: string) {
  await screen.findByRole('option', { name: '업무' });
  change(/^제목/, '보고서 작성');
  change(/^시작일자/, start);
  change(/^종료일자/, end);
}

function save() {
  fireEvent.click(screen.getByRole('button', { name: '저장' }));
}

function cancel() {
  fireEvent.click(screen.getByRole('button', { name: '취소' }));
}

beforeEach(() => {
  useAuthStore.getState().clear();
  localStorage.clear();
  useToastStore.setState({ toasts: [] });
  todoResponse = () => json(200, existing);
  saveResponse = (init) => json(200, { id: 7, ...JSON.parse(String(init?.body)) });
  fetchMock.mockReset();
  routeFetch();
  vi.stubGlobal('fetch', fetchMock);
});

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

test('[WF-05] 등록·수정 경로에 맞는 제목을 보여준다', async () => {
  renderPage('/todos/new');
  expect(screen.getByRole('heading', { name: '할일 등록' })).toBeTruthy();
  cleanup();

  renderPage('/todos/7/edit');
  expect(await screen.findByRole('heading', { name: '할일 수정' })).toBeTruthy();
});

test('[AC-02, SC-04-E2] 종료일자 < 시작일자로 저장 시 요청 없이 종료일자 아래 오류가 표시된다', async () => {
  renderPage('/todos/new');
  await fillNew('2026-11-12', '2026-11-10');

  save();

  expect(field(/^종료일자/).getAttribute('aria-invalid')).toBe('true');
  expect(errorOf(/^종료일자/)).toContain('종료일자는 시작일자 이후여야 합니다');
  expect(saveCalls()).toHaveLength(0);
});

test('[PR-06, SC-00-E4] 서버 400 fields.endDate도 종료일자 아래에 표시된다', async () => {
  saveResponse = () =>
    json(400, {
      error: {
        code: 'VALIDATION_ERROR',
        message: '입력값이 올바르지 않습니다',
        fields: { endDate: '서버가 거부한 종료일자' },
      },
    });
  renderPage('/todos/new');
  await fillNew('2026-11-10', '2026-11-12');

  save();

  await waitFor(() => expect(errorOf(/^종료일자/)).toContain('서버가 거부한 종료일자'));
  expect(field(/^종료일자/).getAttribute('aria-invalid')).toBe('true');
  expect(screen.queryByText('목록 화면')).toBeNull();
});

test('[AC-01, BR-08] 카테고리를 바꾸지 않고 등록하면 categoryId가 기본 id다', async () => {
  renderPage('/todos/new');
  await fillNew('2026-11-10', '2026-11-12');
  await waitFor(() => expect(field('카테고리').value).toBe('1'));

  save();

  await waitFor(() => expect(saveCalls()).toHaveLength(1));
  const [input, init] = saveCalls()[0];
  expect(new URL(String(input), 'http://x').pathname).toBe('/api/todos');
  expect(init?.method).toBe('POST');
  expect(JSON.parse(String(init?.body))).toEqual({
    title: '보고서 작성',
    description: null,
    categoryId: 1,
    startDate: '2026-11-10',
    endDate: '2026-11-12',
  });
  expect(await screen.findByText('저장했습니다.')).toBeTruthy();
  expect(screen.getByText('목록 화면')).toBeTruthy();
});

test('[BR-17, AQ-10] 수정 진입 시 기존 값이 채워지고 저장 요청이 PUT이며 isCompleted를 보내지 않는다', async () => {
  renderPage('/todos/7/edit');
  await waitFor(() => expect(field(/^제목/).value).toBe('보고서 작성'));
  await waitFor(() => expect(field('카테고리').value).toBe('2'));
  expect(field('설명').value).toBe('분기 보고서');
  expect(field(/^시작일자/).value).toBe('2026-11-10');
  expect(field(/^종료일자/).value).toBe('2026-11-12');

  change(/^제목/, '보고서 수정');
  save();

  await waitFor(() => expect(saveCalls()).toHaveLength(1));
  const [input, init] = saveCalls()[0];
  expect(new URL(String(input), 'http://x').pathname).toBe('/api/todos/7');
  expect(init?.method).toBe('PUT');
  const body = JSON.parse(String(init?.body)) as Record<string, unknown>;
  expect(Object.keys(body).sort()).toEqual([
    'categoryId',
    'description',
    'endDate',
    'startDate',
    'title',
  ]);
  expect(body).toEqual({
    title: '보고서 수정',
    description: '분기 보고서',
    categoryId: 2,
    startDate: '2026-11-10',
    endDate: '2026-11-12',
  });
});

test('[G-12] 저장·취소 후 state.from이 /calendar면 캘린더로, 없으면 목록으로 돌아간다', async () => {
  // 저장 → 캘린더
  renderPage('/todos/new', { from: '/calendar' });
  await fillNew('2026-11-10', '2026-11-12');
  save();
  expect(await screen.findByText('캘린더 화면')).toBeTruthy();
  cleanup();

  // 취소(state 없음) → 목록
  renderPage('/todos/new');
  await screen.findByRole('option', { name: '업무' });
  cancel();
  expect(await screen.findByText('목록 화면')).toBeTruthy();
  cleanup();

  // 수정 화면 취소 → 캘린더
  renderPage('/todos/7/edit', { from: '/calendar' });
  await waitFor(() => expect(field(/^제목/).value).toBe('보고서 작성'));
  cancel();
  expect(await screen.findByText('캘린더 화면')).toBeTruthy();
});

test('[G-02, CMP-02] 변경 후 취소는 이탈 확인 모달, 변경 없이 취소는 즉시 복귀', async () => {
  renderPage('/todos/new');
  await screen.findByRole('option', { name: '업무' });
  change(/^제목/, '보고서');

  cancel();
  const dialog = screen.getByRole('dialog');
  expect(dialog.textContent).toContain('저장하지 않은 변경 사항이 있습니다.');

  fireEvent.click(within(dialog).getByRole('button', { name: '계속 편집' }));
  expect(screen.queryByRole('dialog')).toBeNull();
  expect(field(/^제목/).value).toBe('보고서');
  expect(screen.queryByText('목록 화면')).toBeNull();

  cancel();
  fireEvent.click(within(screen.getByRole('dialog')).getByRole('button', { name: '나가기' }));
  expect(await screen.findByText('목록 화면')).toBeTruthy();
  cleanup();

  renderPage('/todos/new');
  await screen.findByRole('option', { name: '업무' });
  cancel();
  expect(screen.queryByRole('dialog')).toBeNull();
  expect(await screen.findByText('목록 화면')).toBeTruthy();
});

test('[SC-07-E2, SC-07-E3] 수정 대상 404면 찾을 수 없음 화면을 보여준다', async () => {
  todoResponse = () => json(404, { error: { code: 'NOT_FOUND', message: '없음' } });
  renderPage('/todos/7/edit');

  expect(
    await screen.findByRole('heading', { name: '요청하신 항목을 찾을 수 없습니다.' }),
  ).toBeTruthy();
  expect(screen.queryByRole('button', { name: '저장' })).toBeNull();
});
