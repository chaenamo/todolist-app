import { afterEach, beforeEach, expect, test, vi } from 'vitest';
import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter, Route, Routes, useLocation } from 'react-router';
import { useAuthStore } from '../stores/authStore';
import { useUiStore } from '../stores/uiStore';
import type { TodoWithStatus } from '../api/types';
import { diffDays } from '../lib/date';
import { CalendarPage } from './CalendarPage';

const fetchMock = vi.fn<typeof fetch>();
let calendarItems: TodoWithStatus[] = [];

function json(status: number, body: unknown): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

const report: TodoWithStatus = {
  id: 5,
  categoryId: 1,
  title: '보고서',
  description: null,
  startDate: '2026-11-10',
  endDate: '2026-11-12',
  isCompleted: false,
  completedAt: null,
  createdAt: '2026-11-01T00:00:00Z',
  updatedAt: '2026-11-01T00:00:00Z',
  status: 'IN_PROGRESS',
};

function EditMarker() {
  const location = useLocation();
  const from = (location.state as { from?: string } | null)?.from;
  return (
    <p>
      수정 화면 {location.pathname} from={from}
    </p>
  );
}

function renderPage() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={client}>
      <MemoryRouter initialEntries={['/calendar']}>
        <Routes>
          <Route path="/calendar" element={<CalendarPage />} />
          <Route path="/todos/:id/edit" element={<EditMarker />} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

beforeEach(() => {
  useAuthStore.getState().clear();
  localStorage.clear();
  useUiStore.setState({ calendarDate: '2026-11-13', calendarView: 'month' });
  calendarItems = [report];
  fetchMock.mockReset();
  fetchMock.mockImplementation(async (input, init) => {
    const url = new URL(String(input), 'http://x');
    if (url.pathname === '/api/todos/calendar' && (init?.method ?? 'GET') === 'GET') {
      return json(200, { items: calendarItems });
    }
    if (url.pathname === '/api/categories' && (init?.method ?? 'GET') === 'GET') {
      return json(200, { items: [{ id: 1, name: '업무', isDefault: true }] });
    }
    return json(404, { error: { code: 'NOT_FOUND', message: '없음' } });
  });
  vi.stubGlobal('fetch', fetchMock);
});

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
  useUiStore.setState({ calendarDate: null, calendarView: 'month' });
});

test('[WF-05] 캘린더 제목은 기준 월(2026년 11월)을 보여준다', () => {
  renderPage();
  expect(screen.getByRole('heading', { level: 1, name: '2026년 11월' })).toBeTruthy();
});

test('[WF-05] 이전 달·다음 달·오늘 버튼이 calendarDate를 바꾼다', () => {
  renderPage();

  fireEvent.click(screen.getByRole('button', { name: '이전 달' }));
  expect(useUiStore.getState().calendarDate).toBe('2026-10-01');

  act(() => useUiStore.setState({ calendarDate: '2026-11-13' }));
  fireEvent.click(screen.getByRole('button', { name: '다음 달' }));
  expect(useUiStore.getState().calendarDate).toBe('2026-12-01');

  fireEvent.click(screen.getByRole('button', { name: '오늘' }));
  expect(useUiStore.getState().calendarDate).toBeNull();
});

test('[UC-05, G-12] 이벤트 막대를 누르면 state.from=/calendar로 수정 화면에 간다', async () => {
  renderPage();

  const bar = await screen.findByText('보고서');
  const url = new URL(
    String(fetchMock.mock.calls.find(([i]) => String(i).includes('/api/todos/calendar'))![0]),
    'http://x',
  );
  expect(url.searchParams.get('from')).toBeTruthy();
  expect(url.searchParams.get('to')).toBeTruthy();

  fireEvent.click(bar);
  await waitFor(() =>
    expect(screen.getByText(/수정 화면/).textContent).toBe(
      '수정 화면 /todos/5/edit from=/calendar',
    ),
  );
});

function lastRange() {
  const calls = fetchMock.mock.calls.filter(([i]) => String(i).includes('/api/todos/calendar'));
  if (calls.length === 0) return null;
  const url = new URL(String(calls[calls.length - 1][0]), 'http://x');
  return { from: url.searchParams.get('from'), to: url.searchParams.get('to') };
}

function viewButton(name: '월' | '주' | '일') {
  const group = screen.getByRole('group', { name: '보기' });
  return Array.from(group.querySelectorAll('button')).find((b) => b.textContent === name)!;
}

test('[A-12, BR-16] 뷰 전환 시 기준 날짜가 유지되고 조회 범위가 월(42일)/주(일~토)/일(1일)로 바뀐다', async () => {
  useUiStore.setState({ calendarDate: '2026-11-11', calendarView: 'month' });
  renderPage();

  expect(viewButton('월').getAttribute('aria-pressed')).toBe('true');
  await waitFor(() => expect(lastRange()).toEqual({ from: '2026-11-01', to: '2026-12-12' }));
  const month = lastRange()!;
  expect(diffDays(month.from!, month.to!) + 1).toBe(42);

  fireEvent.click(viewButton('주'));
  expect(useUiStore.getState().calendarView).toBe('week');
  expect(useUiStore.getState().calendarDate).toBe('2026-11-11');
  expect(viewButton('주').getAttribute('aria-pressed')).toBe('true');
  expect(viewButton('월').getAttribute('aria-pressed')).toBe('false');
  await waitFor(() => expect(lastRange()).toEqual({ from: '2026-11-08', to: '2026-11-14' }));

  fireEvent.click(viewButton('일'));
  expect(useUiStore.getState().calendarView).toBe('day');
  expect(useUiStore.getState().calendarDate).toBe('2026-11-11');
  await waitFor(() => expect(lastRange()).toEqual({ from: '2026-11-11', to: '2026-11-11' }));

  fireEvent.click(viewButton('월'));
  expect(useUiStore.getState().calendarView).toBe('month');
  expect(useUiStore.getState().calendarDate).toBe('2026-11-11');
  await waitFor(() => expect(lastRange()).toEqual({ from: '2026-11-01', to: '2026-12-12' }));
});

test('[AC-06] 주간 뷰 2026-11-08 기준 요청이 from=2026-11-08&to=2026-11-14다', async () => {
  useUiStore.setState({ calendarDate: '2026-11-08', calendarView: 'week' });
  renderPage();

  await waitFor(() => expect(lastRange()).toEqual({ from: '2026-11-08', to: '2026-11-14' }));
  const calls = fetchMock.mock.calls.filter(([i]) => String(i).includes('/api/todos/calendar'));
  const last = calls[calls.length - 1];
  expect(last[1]?.method ?? 'GET').toBe('GET');
  expect(new URL(String(last[0]), 'http://x').searchParams.get('today')).toBeTruthy();
});

test('[SC-09-A4] 일간 뷰 0건이면 안내 문구가 표시된다', async () => {
  calendarItems = [];
  useUiStore.setState({ calendarDate: '2026-11-11', calendarView: 'day' });
  renderPage();

  expect(await screen.findByText('이 날 할일이 없습니다')).toBeTruthy();
  expect(lastRange()).toEqual({ from: '2026-11-11', to: '2026-11-11' });
});

test('[A-12] 일간 뷰는 할일 목록을 보여주고 행을 누르면 state.from=/calendar로 수정 화면에 간다', async () => {
  useUiStore.setState({ calendarDate: '2026-11-11', calendarView: 'day' });
  renderPage();

  const list = await screen.findByRole('list', { name: '일간 할일 목록' });
  expect(list.textContent).toContain('보고서');
  fireEvent.click(screen.getByRole('button', { name: '보고서' }));
  await waitFor(() =>
    expect(screen.getByText(/수정 화면/).textContent).toBe(
      '수정 화면 /todos/5/edit from=/calendar',
    ),
  );
});

test('[WF-05] 주간 뷰 제목은 2026.11.08 ~ 11.14이고 이전 주·다음 주는 7일씩 이동한다', () => {
  useUiStore.setState({ calendarDate: '2026-11-11', calendarView: 'week' });
  renderPage();

  expect(screen.getByRole('heading', { level: 1, name: '2026.11.08 ~ 11.14' })).toBeTruthy();
  fireEvent.click(screen.getByRole('button', { name: '이전 주' }));
  expect(useUiStore.getState().calendarDate).toBe('2026-11-04');

  fireEvent.click(screen.getByRole('button', { name: '다음 주' }));
  fireEvent.click(screen.getByRole('button', { name: '다음 주' }));
  expect(useUiStore.getState().calendarDate).toBe('2026-11-18');
  expect(useUiStore.getState().calendarView).toBe('week');
});

test('[WF-05] 일간 뷰 제목은 2026년 11월 11일 (수)이고 이전 날·다음 날은 1일씩 이동한다', () => {
  useUiStore.setState({ calendarDate: '2026-11-11', calendarView: 'day' });
  renderPage();

  expect(screen.getByRole('heading', { level: 1, name: '2026년 11월 11일 (수)' })).toBeTruthy();
  fireEvent.click(screen.getByRole('button', { name: '이전 날' }));
  expect(useUiStore.getState().calendarDate).toBe('2026-11-10');

  fireEvent.click(screen.getByRole('button', { name: '다음 날' }));
  fireEvent.click(screen.getByRole('button', { name: '다음 날' }));
  expect(useUiStore.getState().calendarDate).toBe('2026-11-12');
  expect(useUiStore.getState().calendarView).toBe('day');
});

function stubMatchMedia(matches: boolean) {
  vi.stubGlobal(
    'matchMedia',
    vi.fn((query: string) => ({
      matches,
      media: query,
      onchange: null,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      addListener: vi.fn(),
      removeListener: vi.fn(),
      dispatchEvent: vi.fn(),
    })),
  );
}

test('[G-14] 날짜 번호/+N 선택 핸들러가 uiStore를 view=day, date=그 날짜로 바꾼다', async () => {
  // 월간: 날짜 번호 클릭
  useUiStore.setState({ calendarDate: '2026-11-11', calendarView: 'month' });
  const month = renderPage();
  await screen.findByText('보고서');
  const link = month.container.querySelector('[data-date="2026-11-11"] a[data-navlink]');
  expect(link).toBeTruthy();
  fireEvent.click(link!);
  expect(useUiStore.getState().calendarView).toBe('day');
  expect(useUiStore.getState().calendarDate).toBe('2026-11-11');
  cleanup();

  // 주간: 날짜 번호 클릭
  useUiStore.setState({ calendarDate: '2026-11-11', calendarView: 'week' });
  const week = renderPage();
  await screen.findByText('보고서');
  const weekLink = week.container.querySelector('[data-date="2026-11-12"] a[data-navlink]');
  expect(weekLink).toBeTruthy();
  fireEvent.click(weekLink!);
  expect(useUiStore.getState().calendarView).toBe('day');
  expect(useUiStore.getState().calendarDate).toBe('2026-11-12');
  cleanup();

  // 모바일 월간: 한 날짜에 4건 → +N 클릭
  stubMatchMedia(true);
  calendarItems = [1, 2, 3, 4].map((n) => ({
    ...report,
    id: 10 + n,
    title: `할일${n}`,
    startDate: '2026-11-11',
    endDate: '2026-11-11',
  }));
  useUiStore.setState({ calendarDate: '2026-11-11', calendarView: 'month' });
  const mobile = renderPage();
  const more = await waitFor(() => {
    const el = mobile.container.querySelector('[data-date="2026-11-11"] .fc-daygrid-more-link');
    expect(el).toBeTruthy();
    return el!;
  });
  expect(more.textContent).toMatch(/\+\d/);
  fireEvent.click(more);
  expect(useUiStore.getState().calendarView).toBe('day');
  expect(useUiStore.getState().calendarDate).toBe('2026-11-11');
});
