import { afterEach, expect, test } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import { App } from './App';

afterEach(cleanup);

test('jsdom 환경에서 정의되지 않은 경로는 NotFoundPage를 렌더한다', () => {
  expect(typeof window).toBe('object');
  render(
    <MemoryRouter initialEntries={['/nope']}>
      <App />
    </MemoryRouter>,
  );
  expect(screen.getByRole('heading', { name: '페이지를 찾을 수 없습니다' })).toBeTruthy();
});
