import { afterEach, expect, test, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { Pagination } from './Pagination';

afterEach(() => {
  cleanup();
});

test('[WF-04] total이 limit 이하이면 아무것도 렌더하지 않는다', () => {
  const { container } = render(<Pagination page={1} total={20} limit={20} onChange={vi.fn()} />);
  expect(container.innerHTML).toBe('');
});

test('[WF-04] 페이지 번호 버튼을 보이고 현재 페이지는 aria-current="page"다', () => {
  render(<Pagination page={1} total={45} limit={20} onChange={vi.fn()} />);

  expect(screen.getByRole('navigation', { name: '페이지' })).toBeTruthy();
  for (const n of ['1', '2', '3']) expect(screen.getByRole('button', { name: n })).toBeTruthy();
  expect(screen.queryByRole('button', { name: '4' })).toBeNull();
  expect(screen.getByRole('button', { name: '1' }).getAttribute('aria-current')).toBe('page');
  expect(screen.getByRole('button', { name: '2' }).getAttribute('aria-current')).toBeNull();
});

test('[WF-04] 번호 클릭은 onChange(번호)를 호출하고 1페이지에서 이전은 비활성이다', () => {
  const onChange = vi.fn();
  render(<Pagination page={1} total={45} limit={20} onChange={onChange} />);

  expect((screen.getByRole('button', { name: '이전' }) as HTMLButtonElement).disabled).toBe(true);
  fireEvent.click(screen.getByRole('button', { name: '2' }));
  expect(onChange).toHaveBeenLastCalledWith(2);
  fireEvent.click(screen.getByRole('button', { name: '다음' }));
  expect(onChange).toHaveBeenLastCalledWith(2);
});

test('[WF-04] 마지막 페이지에서 다음은 비활성이고 이전은 page-1로 이동한다', () => {
  const onChange = vi.fn();
  render(<Pagination page={3} total={45} limit={20} onChange={onChange} />);

  expect((screen.getByRole('button', { name: '다음' }) as HTMLButtonElement).disabled).toBe(true);
  fireEvent.click(screen.getByRole('button', { name: '이전' }));
  expect(onChange).toHaveBeenLastCalledWith(2);
});
