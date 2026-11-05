import { afterEach, expect, test, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import type { TodoWithStatus } from '../../api/types';
import { TodoRow } from './TodoRow';

const todo: TodoWithStatus = {
  id: 7,
  categoryId: 2,
  title: '보고서 작성',
  description: null,
  startDate: '2026-11-10',
  endDate: '2026-11-12',
  isCompleted: false,
  completedAt: null,
  createdAt: '2026-11-01T00:00:00Z',
  updatedAt: '2026-11-01T00:00:00Z',
  status: 'OVERDUE',
};

afterEach(() => {
  cleanup();
});

function renderRow(over: { todo?: TodoWithStatus; toggling?: boolean } = {}) {
  const onToggle = vi.fn();
  const onDelete = vi.fn();
  const view = render(
    <MemoryRouter>
      <ul>
        <TodoRow
          todo={over.todo ?? todo}
          categoryName="업무"
          toggling={over.toggling ?? false}
          onToggle={onToggle}
          onDelete={onDelete}
        />
      </ul>
    </MemoryRouter>,
  );
  return { ...view, onToggle, onDelete };
}

test('[WF-04, PR-03] 행은 수정 링크 제목·카테고리명·기간(M/D)·응답 status 배지를 보인다', () => {
  const { container } = renderRow();

  expect(screen.getByRole('link', { name: '보고서 작성 수정' }).getAttribute('href')).toBe(
    '/todos/7/edit',
  );
  const text = container.textContent ?? '';
  expect(text).toContain('업무');
  expect(text).toContain('11/10 ~ 11/12');
  expect(text).toContain('기한 초과');
});

test('[WF-04, SC-06] 완료 체크박스는 isCompleted를 반영하고 클릭 시 onToggle(새 값)을 부른다', () => {
  const { onToggle } = renderRow();
  const box = screen.getByRole('checkbox', { name: '보고서 작성 완료' }) as HTMLInputElement;
  expect(box.checked).toBe(false);
  expect(box.disabled).toBe(false);

  fireEvent.click(box);

  expect(onToggle).toHaveBeenCalledWith(true);
  cleanup();

  const done = renderRow({ todo: { ...todo, isCompleted: true, status: 'COMPLETED' } });
  const doneBox = screen.getByRole('checkbox', { name: '보고서 작성 완료' }) as HTMLInputElement;
  expect(doneBox.checked).toBe(true);
  fireEvent.click(doneBox);
  expect(done.onToggle).toHaveBeenCalledWith(false);
});

test('[AQ-03] toggling이면 체크박스가 disabled다', () => {
  renderRow({ toggling: true });
  const box = screen.getByRole('checkbox', { name: '보고서 작성 완료' }) as HTMLInputElement;
  expect(box.disabled).toBe(true);
});

test('[WF-04, SC-08] 삭제 버튼은 onDelete를 부른다', () => {
  const { onDelete } = renderRow();

  fireEvent.click(screen.getByRole('button', { name: '보고서 작성 삭제' }));

  expect(onDelete).toHaveBeenCalledTimes(1);
});
