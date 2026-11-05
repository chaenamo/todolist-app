import { afterEach, expect, test, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import type { TodoWithStatus } from '../../api/types';
import { DayTodoList } from './DayTodoList';

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

const meeting: TodoWithStatus = {
  ...report,
  id: 6,
  categoryId: 2,
  title: '회의',
  startDate: '2026-11-11',
  endDate: '2026-11-11',
  isCompleted: true,
  status: 'COMPLETED',
};

const categoryNames = new Map([
  [1, '업무'],
  [2, '개인'],
]);

afterEach(() => {
  cleanup();
});

test('[SC-09-A4] 할일이 0건이면 안내 문구를 보여주고 목록은 없다', () => {
  render(<DayTodoList items={[]} categoryNames={categoryNames} onSelect={vi.fn()} />);
  expect(screen.getByText('이 날 할일이 없습니다')).toBeTruthy();
  expect(screen.queryByRole('list', { name: '일간 할일 목록' })).toBeNull();
});

test('[A-12] 행마다 제목·카테고리명·기간·상태를 보여준다', () => {
  render(
    <DayTodoList items={[report, meeting]} categoryNames={categoryNames} onSelect={vi.fn()} />,
  );
  const list = screen.getByRole('list', { name: '일간 할일 목록' });
  const rows = list.querySelectorAll('li');
  expect(rows.length).toBe(2);

  const first = rows[0].textContent ?? '';
  expect(first).toContain('보고서');
  expect(first).toContain('업무');
  expect(first).toContain('11/10 ~ 11/12');
  expect(first).toContain('진행 중');

  const second = rows[1].textContent ?? '';
  expect(second).toContain('회의');
  expect(second).toContain('개인');
  expect(second).toContain('완료');
  expect(screen.queryByText('이 날 할일이 없습니다')).toBeNull();
});

test('[UC-05] 제목 버튼을 누르면 onSelect(id)를 호출한다', () => {
  const onSelect = vi.fn();
  render(
    <DayTodoList items={[report, meeting]} categoryNames={categoryNames} onSelect={onSelect} />,
  );

  fireEvent.click(screen.getByRole('button', { name: '회의' }));
  expect(onSelect).toHaveBeenCalledWith(6);
  fireEvent.click(screen.getByRole('button', { name: '보고서' }));
  expect(onSelect).toHaveBeenCalledWith(5);
  expect(onSelect).toHaveBeenCalledTimes(2);
});
