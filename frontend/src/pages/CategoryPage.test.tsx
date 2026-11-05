import { afterEach, beforeEach, expect, test, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router';
import { useAuthStore } from '../stores/authStore';
import { useToastStore } from '../stores/toastStore';
import { useUiStore } from '../stores/uiStore';
import { Toaster } from '../components/Toast';
import type { Category } from '../api/types';
import { CategoryPage } from './CategoryPage';

const fetchMock = vi.fn<typeof fetch>();

function json(status: number, body: unknown): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

const conflict = {
  error: {
    code: 'CONFLICT',
    message: '이미 있는 이름입니다',
    fields: { name: '이미 있는 이름입니다' },
  },
};

let categories: Category[];
let postResponse: (() => Response) | null;
let patchResponse: (() => Response) | null;

// GET은 무효화 후 다시 호출되므로 URL+method로 응답을 고른다
function routeFetch() {
  fetchMock.mockImplementation(async (input, init) => {
    const url = String(input);
    const method = init?.method ?? 'GET';
    if (url === '/api/categories' && method === 'GET') return json(200, { items: categories });
    if (url === '/api/categories' && method === 'POST') {
      if (postResponse) return postResponse();
      const { name } = JSON.parse(String(init?.body)) as { name: string };
      const created = { id: categories.length + 1, name, isDefault: false };
      categories = [...categories, created];
      return json(201, created);
    }
    const m = /^\/api\/categories\/(\d+)$/.exec(url);
    if (m && method === 'PATCH') {
      if (patchResponse) return patchResponse();
      const id = Number(m[1]);
      const { name } = JSON.parse(String(init?.body)) as { name: string };
      categories = categories.map((c) => (c.id === id ? { ...c, name } : c));
      return json(
        200,
        categories.find((c) => c.id === id),
      );
    }
    if (m && method === 'DELETE') {
      categories = categories.filter((c) => c.id !== Number(m[1]));
      return new Response(null, { status: 204 });
    }
    return json(404, { error: { code: 'NOT_FOUND', message: '없음' } });
  });
}

function postCalls() {
  return fetchMock.mock.calls.filter(([, init]) => init?.method === 'POST');
}

function callsOf(method: string) {
  return fetchMock.mock.calls.filter(([, init]) => (init?.method ?? 'GET') === method);
}

function renderPage() {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  return render(
    <QueryClientProvider client={client}>
      <MemoryRouter initialEntries={['/categories']}>
        <CategoryPage />
        <Toaster />
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

function nameInput(): HTMLInputElement {
  return screen.getByLabelText('새 카테고리') as HTMLInputElement;
}

function submit(value: string) {
  fireEvent.change(nameInput(), { target: { value } });
  fireEvent.click(screen.getByRole('button', { name: '등록' }));
}

function list(): Promise<HTMLElement> {
  return screen.findByRole('list', { name: '카테고리 목록' });
}

beforeEach(() => {
  useAuthStore.getState().clear();
  localStorage.clear();
  categories = [
    { id: 1, name: '기본', isDefault: true },
    { id: 2, name: '업무', isDefault: false },
  ];
  postResponse = null;
  patchResponse = null;
  useUiStore.setState({ categoryId: null, statuses: [], page: 1 });
  useToastStore.setState({ toasts: [] });
  fetchMock.mockReset();
  vi.stubGlobal('fetch', fetchMock);
});

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

test('[WF-08] 카테고리 화면은 제목·입력란·등록 버튼·목록을 가진다', async () => {
  routeFetch();
  renderPage();

  expect(screen.getByRole('heading', { name: '카테고리 관리' })).toBeTruthy();
  expect(nameInput()).toBeTruthy();
  expect(screen.getByRole('button', { name: '등록' })).toBeTruthy();
  const items = within(await list()).getAllByRole('listitem');
  expect(items).toHaveLength(2);
  expect(items[1].textContent).toContain('업무');
});

test('[WF-08] 목록 조회 중에는 "불러오는 중…" 상태가 표시된다', () => {
  fetchMock.mockImplementation(() => new Promise<Response>(() => {}));
  renderPage();

  expect(screen.getByRole('status').textContent).toContain('불러오는 중…');
});

test('[WF-08] 목록 조회 실패(500) 시 alert가 표시된다', async () => {
  fetchMock.mockResolvedValue(json(500, { error: { code: 'INTERNAL', message: '서버 오류' } }));
  renderPage();

  expect(await screen.findByRole('alert')).toBeTruthy();
});

test('[SC-03-E1] 공백만 입력 시 요청 없이 "이름을 입력하세요"가 표시된다', async () => {
  routeFetch();
  renderPage();
  await list();

  submit('   ');

  expect(await screen.findByText('이름을 입력하세요')).toBeTruthy();
  expect(postCalls()).toHaveLength(0);
});

test('[SC-03-E2] 서버 409 fields.name 메시지가 입력란 아래 표시된다', async () => {
  routeFetch();
  postResponse = () => json(409, conflict);
  renderPage();
  await list();

  submit('업무');

  await waitFor(() => expect(nameInput().getAttribute('aria-invalid')).toBe('true'));
  const describedBy = nameInput().getAttribute('aria-describedby');
  expect(describedBy).toBeTruthy();
  expect(document.getElementById(String(describedBy))?.textContent).toContain(
    '이미 있는 이름입니다',
  );
  expect(nameInput().value).toBe('업무');
});

test('[UC-03] 등록 시 앞뒤 공백을 제거해 POST하고, 성공하면 입력란이 비워지고 목록이 재조회된다', async () => {
  routeFetch();
  renderPage();
  await list();

  submit('  개인  ');

  await waitFor(() => expect(postCalls()).toHaveLength(1));
  expect(JSON.parse(String(postCalls()[0][1]?.body))).toEqual({ name: '개인' });
  await waitFor(() => expect(nameInput().value).toBe(''));
  await waitFor(async () =>
    expect(within(await list()).getAllByRole('listitem')[2]?.textContent).toContain('개인'),
  );
});

test('[BR-06, SC-03-E3] 기본 행에 변경·삭제 버튼이 없다', async () => {
  routeFetch();
  renderPage();

  const defaultRow = within(await list())
    .getAllByRole('listitem')
    .find((li) => li.textContent?.includes('(변경·삭제 불가)'));

  expect(defaultRow).toBeTruthy();
  expect(defaultRow?.textContent).toContain('기본');
  expect(within(defaultRow as HTMLElement).queryAllByRole('button')).toHaveLength(0);
});

test('[BR-06] 기본 행에는 변경·삭제 컨트롤이 없다', async () => {
  routeFetch();
  renderPage();
  await list();

  expect(screen.queryByRole('button', { name: '기본 이름 변경' })).toBeNull();
  expect(screen.queryByRole('button', { name: '기본 삭제' })).toBeNull();
  expect(screen.getByRole('button', { name: '업무 이름 변경' })).toBeTruthy();
  expect(screen.getByRole('button', { name: '업무 삭제' })).toBeTruthy();
});

function renameInput(): HTMLInputElement {
  return screen.getByLabelText('새 이름') as HTMLInputElement;
}

async function startRename() {
  await list();
  fireEvent.click(screen.getByRole('button', { name: '업무 이름 변경' }));
}

test('[UC-03] 이름 변경을 누르면 현재 이름이 채워진 입력란과 저장·취소 버튼이 나타난다', async () => {
  routeFetch();
  renderPage();
  await startRename();

  expect(renameInput().value).toBe('업무');
  expect(screen.getByRole('button', { name: '저장' })).toBeTruthy();
  expect(screen.getByRole('button', { name: '취소' })).toBeTruthy();
});

test('[UC-03] 이름 변경 취소 시 요청 없이 편집 모드가 닫힌다', async () => {
  routeFetch();
  renderPage();
  await startRename();

  fireEvent.change(renameInput(), { target: { value: '회사' } });
  fireEvent.click(screen.getByRole('button', { name: '취소' }));

  expect(screen.queryByLabelText('새 이름')).toBeNull();
  expect(callsOf('PATCH')).toHaveLength(0);
  expect(screen.getByRole('button', { name: '업무 이름 변경' })).toBeTruthy();
});

test('[SC-03-E1] 이름 변경에 공백만 저장하면 요청 없이 "이름을 입력하세요"가 표시된다', async () => {
  routeFetch();
  renderPage();
  await startRename();

  fireEvent.change(renameInput(), { target: { value: '   ' } });
  fireEvent.click(screen.getByRole('button', { name: '저장' }));

  expect(await screen.findByText('이름을 입력하세요')).toBeTruthy();
  expect(callsOf('PATCH')).toHaveLength(0);
});

test('[BR-07] 이름 변경 409 fields.name이 행 아래 표시된다', async () => {
  routeFetch();
  patchResponse = () => json(409, conflict);
  renderPage();
  await startRename();

  fireEvent.change(renameInput(), { target: { value: '기본' } });
  fireEvent.click(screen.getByRole('button', { name: '저장' }));

  await waitFor(() => expect(renameInput().getAttribute('aria-invalid')).toBe('true'));
  const describedBy = renameInput().getAttribute('aria-describedby');
  expect(describedBy).toBeTruthy();
  const message = document.getElementById(String(describedBy));
  expect(message?.textContent).toContain('이미 있는 이름입니다');
  // 메시지는 편집 중인 행 안에 있다
  const row = renameInput().closest('li') as HTMLElement;
  expect(row.contains(message)).toBe(true);
  expect(renameInput().value).toBe('기본');
});

test('[UC-03] 이름 변경 성공 시 편집 모드가 닫히고 토스트와 함께 목록이 재조회된다', async () => {
  routeFetch();
  renderPage();
  await startRename();
  const getsBefore = callsOf('GET').length;

  fireEvent.change(renameInput(), { target: { value: '회사' } });
  fireEvent.click(screen.getByRole('button', { name: '저장' }));

  await waitFor(() => expect(callsOf('PATCH')).toHaveLength(1));
  expect(String(callsOf('PATCH')[0][0])).toBe('/api/categories/2');
  expect(JSON.parse(String(callsOf('PATCH')[0][1]?.body))).toEqual({ name: '회사' });
  expect(await screen.findByText('이름을 변경했습니다.')).toBeTruthy();
  await waitFor(() => expect(screen.queryByLabelText('새 이름')).toBeNull());
  await waitFor(() => expect(callsOf('GET').length).toBeGreaterThan(getsBefore));
  expect(await screen.findByRole('button', { name: '회사 이름 변경' })).toBeTruthy();
});

function deleteDialog(): HTMLElement {
  return screen.getByRole('dialog', { name: "카테고리 '업무'를 삭제할까요?" });
}

test('[SC-03-A2] 삭제 확인 모달에서 취소하면 DELETE를 보내지 않는다', async () => {
  routeFetch();
  renderPage();
  await list();

  fireEvent.click(screen.getByRole('button', { name: '업무 삭제' }));
  fireEvent.click(within(deleteDialog()).getByRole('button', { name: '취소' }));

  expect(screen.queryByRole('dialog')).toBeNull();
  expect(callsOf('DELETE')).toHaveLength(0);
});

test('[SC-03-A2, BR-09] 삭제는 확인 모달을 거치고, 성공 후 카테고리·할일 목록 쿼리가 무효화된다', async () => {
  routeFetch();
  renderPage();
  await list();
  const getsBefore = callsOf('GET').length;

  fireEvent.click(screen.getByRole('button', { name: '업무 삭제' }));
  expect(callsOf('DELETE')).toHaveLength(0);
  expect(deleteDialog().textContent).toContain("소속 할일은 삭제되지 않고 '기본'으로 이동합니다.");
  fireEvent.click(within(deleteDialog()).getByRole('button', { name: '삭제' }));

  await waitFor(() => expect(callsOf('DELETE')).toHaveLength(1));
  expect(String(callsOf('DELETE')[0][0])).toBe('/api/categories/2');
  expect(await screen.findByText('삭제했습니다.')).toBeTruthy();
  await waitFor(() => expect(callsOf('GET').length).toBeGreaterThan(getsBefore));
  await waitFor(() => expect(screen.queryByRole('button', { name: '업무 삭제' })).toBeNull());
});

test('[G-08] 필터 중인 카테고리 삭제 시 uiStore categoryId가 해제된다', async () => {
  routeFetch();
  useUiStore.setState({ categoryId: 2 });
  renderPage();
  await list();

  fireEvent.click(screen.getByRole('button', { name: '업무 삭제' }));
  fireEvent.click(within(deleteDialog()).getByRole('button', { name: '삭제' }));

  await waitFor(() => expect(useUiStore.getState().categoryId).toBeNull());
});
