import { afterEach, expect, test, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import type { TodoStatus } from '../../api/types';
import { FilterBar } from './FilterBar';

const categories = [
  { id: 1, name: '기본', isDefault: true },
  { id: 2, name: '업무', isDefault: false },
];

function renderBar(categoryId: number | null = null, statuses: TodoStatus[] = []) {
  const props = {
    categories,
    categoryId,
    statuses,
    onCategoryChange: vi.fn(),
    onStatusesChange: vi.fn(),
    onReset: vi.fn(),
  };
  render(<FilterBar {...props} />);
  return props;
}

afterEach(() => {
  cleanup();
});

test('[WF-04] 카테고리 select는 전체와 카테고리 옵션을 가지고 상태 체크박스 4개와 초기화 버튼이 있다', () => {
  renderBar();

  const options = screen.getAllByRole('option').map((o) => o.textContent);
  expect(options).toEqual(['전체', '기본', '업무']);
  for (const label of ['시작 전', '진행 중', '완료', '기한 초과']) {
    expect(screen.getByRole('checkbox', { name: label })).toBeTruthy();
  }
  expect(screen.getByRole('button', { name: '필터 초기화' })).toBeTruthy();
});

test('[G-09] 카테고리 선택은 숫자 id로, 전체는 null로 onCategoryChange를 호출한다', () => {
  const props = renderBar(1);
  const select = screen.getByLabelText('카테고리') as HTMLSelectElement;
  expect(select.value).toBe('1');

  fireEvent.change(select, { target: { value: '2' } });
  expect(props.onCategoryChange).toHaveBeenLastCalledWith(2);

  fireEvent.change(select, { target: { value: '' } });
  expect(props.onCategoryChange).toHaveBeenLastCalledWith(null);
});

test('[BR-15] 체크박스는 현재 statuses를 반영하고 체크·해제 시 새 배열로 onStatusesChange를 호출한다', () => {
  const props = renderBar(null, ['IN_PROGRESS']);
  const inProgress = screen.getByRole('checkbox', { name: '진행 중' }) as HTMLInputElement;
  expect(inProgress.checked).toBe(true);

  fireEvent.click(screen.getByRole('checkbox', { name: '기한 초과' }));
  const added = props.onStatusesChange.mock.calls[0][0] as TodoStatus[];
  expect([...added].sort()).toEqual(['IN_PROGRESS', 'OVERDUE']);

  fireEvent.click(inProgress);
  expect(props.onStatusesChange).toHaveBeenLastCalledWith([]);
});

test('[G-09] 필터 초기화 버튼은 onReset을 호출한다', () => {
  const props = renderBar(2, ['COMPLETED']);
  fireEvent.click(screen.getByRole('button', { name: '필터 초기화' }));
  expect(props.onReset).toHaveBeenCalledTimes(1);
});
