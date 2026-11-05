import { afterEach, expect, test, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router';
import { Layout } from './Layout';

afterEach(() => {
  cleanup();
});

function renderLayout() {
  const onLogout = vi.fn();
  render(
    <MemoryRouter initialEntries={['/calendar']}>
      <Routes>
        <Route element={<Layout onLogout={onLogout} />}>
          <Route path="/todos" element={<h1>목록 본문</h1>} />
          <Route path="/calendar" element={<h1>캘린더 본문</h1>} />
        </Route>
      </Routes>
    </MemoryRouter>,
  );
  return { onLogout };
}

function nav() {
  return screen.getByRole('navigation', { name: '주 메뉴' });
}

test('[WF-01] 로고 링크는 /todos를 가리키고 Outlet 내용을 렌더한다', () => {
  renderLayout();
  expect(screen.getByRole('link', { name: 'TodoList' }).getAttribute('href')).toBe('/todos');
  expect(screen.getByRole('heading', { name: '캘린더 본문' })).toBeTruthy();
});

test('[WF-01] 주 메뉴는 목록·캘린더·카테고리·내 정보 순서의 링크를 갖는다', () => {
  renderLayout();
  const links = within(nav()).getAllByRole('link');
  expect(links.map((a) => a.textContent)).toEqual(['목록', '캘린더', '카테고리', '내 정보']);
  expect(links.map((a) => a.getAttribute('href'))).toEqual([
    '/todos',
    '/calendar',
    '/categories',
    '/me',
  ]);
});

test('[WF-01] 현재 경로의 메뉴 링크만 aria-current="page"를 갖는다', () => {
  renderLayout();
  for (const link of within(nav()).getAllByRole('link')) {
    const expected = link.textContent === '캘린더' ? 'page' : null;
    expect(link.getAttribute('aria-current')).toBe(expected);
  }
});

test('[WF-01] 로그아웃 버튼은 onLogout을 한 번 호출한다', () => {
  const { onLogout } = renderLayout();
  fireEvent.click(screen.getByRole('button', { name: '로그아웃' }));
  expect(onLogout).toHaveBeenCalledTimes(1);
});

test('[WF-01] 햄버거 버튼은 메뉴를 열고 닫으며 aria 속성을 갱신한다', () => {
  renderLayout();
  const button = screen.getByRole('button', { name: '메뉴 열기' });
  expect(button.getAttribute('aria-expanded')).toBe('false');
  expect(nav().id).toBeTruthy();
  expect(button.getAttribute('aria-controls')).toBe(nav().id);

  fireEvent.click(button);

  const opened = screen.getByRole('button', { name: '메뉴 닫기' });
  expect(opened.getAttribute('aria-expanded')).toBe('true');

  fireEvent.click(opened);
  expect(screen.getByRole('button', { name: '메뉴 열기' }).getAttribute('aria-expanded')).toBe(
    'false',
  );
});

test('[WF-01] 메뉴 링크를 누르면 이동하고 메뉴가 닫힌다', () => {
  renderLayout();
  fireEvent.click(screen.getByRole('button', { name: '메뉴 열기' }));

  fireEvent.click(within(nav()).getByRole('link', { name: '목록' }));

  expect(screen.getByRole('heading', { name: '목록 본문' })).toBeTruthy();
  expect(screen.getByRole('button', { name: '메뉴 열기' }).getAttribute('aria-expanded')).toBe(
    'false',
  );
  expect(within(nav()).getByRole('link', { name: '목록' }).getAttribute('aria-current')).toBe(
    'page',
  );
});
