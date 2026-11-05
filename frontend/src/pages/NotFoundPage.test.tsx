import { afterEach, expect, test } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import { NotFoundPage } from './NotFoundPage';

afterEach(() => {
  cleanup();
});

test('[CMP-04] NotFoundPage는 안내 문구와 할일 목록 링크를 보여준다', () => {
  render(
    <MemoryRouter>
      <NotFoundPage />
    </MemoryRouter>,
  );
  expect(screen.getByRole('heading', { name: '요청하신 항목을 찾을 수 없습니다.' })).toBeTruthy();
  expect(screen.getByRole('link', { name: '할일 목록으로' }).getAttribute('href')).toBe('/todos');
});
