import { afterEach, expect, test, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import type { Category } from '../../api/types';
import { TodoForm, type TodoFormValues } from './TodoForm';

const categories: Category[] = [
  { id: 1, name: '기본', isDefault: true },
  { id: 2, name: '업무', isDefault: false },
];

const empty: TodoFormValues = {
  title: '',
  description: '',
  categoryId: 1,
  startDate: '',
  endDate: '',
};

function renderForm(over: Partial<Parameters<typeof TodoForm>[0]> = {}) {
  const onSubmit = vi.fn();
  const onCancel = vi.fn();
  render(
    <TodoForm
      initial={empty}
      categories={categories}
      submitting={false}
      onSubmit={onSubmit}
      onCancel={onCancel}
      {...over}
    />,
  );
  return { onSubmit, onCancel };
}

function field(label: RegExp | string): HTMLInputElement {
  return screen.getByLabelText(label) as HTMLInputElement;
}

function change(label: RegExp | string, value: string) {
  fireEvent.change(field(label), { target: { value } });
}

function errorOf(label: RegExp | string): string {
  const id = field(label).getAttribute('aria-describedby') ?? '';
  return id
    .split(' ')
    .map((i) => document.getElementById(i)?.textContent ?? '')
    .join(' ');
}

afterEach(() => {
  cleanup();
});

test('[WF-05] 제목·설명·카테고리·시작일자·종료일자 필드와 저장·취소 버튼이 있다', () => {
  renderForm();

  expect(field(/^제목/)).toBeTruthy();
  expect(field('설명')).toBeTruthy();
  expect(field('카테고리')).toBeTruthy();
  expect(field(/^시작일자/).type).toBe('date');
  expect(field(/^종료일자/).type).toBe('date');
  expect(screen.getByRole('button', { name: '저장' })).toBeTruthy();
  expect(screen.getByRole('button', { name: '취소' })).toBeTruthy();
});

test('[BR-06, SC-04-E1] 빈 값으로 저장하면 필수 오류가 표시되고 onSubmit은 호출되지 않는다', () => {
  const { onSubmit } = renderForm();

  fireEvent.click(screen.getByRole('button', { name: '저장' }));

  expect(screen.getByText('제목을 입력하세요')).toBeTruthy();
  expect(screen.getByText('시작일자를 선택하세요')).toBeTruthy();
  expect(screen.getByText('종료일자를 선택하세요')).toBeTruthy();
  expect(onSubmit).not.toHaveBeenCalled();
});

test('[AC-02] 종료일자 < 시작일자면 종료일자 필드에 오류가 연결된다', () => {
  const { onSubmit } = renderForm();
  change(/^제목/, '보고서 작성');
  change(/^시작일자/, '2026-11-12');
  change(/^종료일자/, '2026-11-10');

  fireEvent.click(screen.getByRole('button', { name: '저장' }));

  expect(field(/^종료일자/).getAttribute('aria-invalid')).toBe('true');
  expect(errorOf(/^종료일자/)).toContain('종료일자는 시작일자 이후여야 합니다');
  expect(onSubmit).not.toHaveBeenCalled();
});

test('[PR-06] serverErrors는 해당 필드 아래에 표시된다', () => {
  renderForm({ serverErrors: { endDate: '서버 종료일자 오류' } });

  expect(field(/^종료일자/).getAttribute('aria-invalid')).toBe('true');
  expect(errorOf(/^종료일자/)).toContain('서버 종료일자 오류');
});

test('[UC-03] 설명이 비어 있으면 description null로 제출하고 categoryId는 숫자다', () => {
  const { onSubmit } = renderForm();
  change(/^제목/, '보고서 작성');
  change('카테고리', '2');
  change(/^시작일자/, '2026-11-10');
  change(/^종료일자/, '2026-11-10');

  fireEvent.click(screen.getByRole('button', { name: '저장' }));

  expect(onSubmit).toHaveBeenCalledWith({
    title: '보고서 작성',
    description: null,
    categoryId: 2,
    startDate: '2026-11-10',
    endDate: '2026-11-10',
  });
});

test('[G-02] 취소 시 변경 여부(dirty)를 onCancel에 넘긴다', () => {
  const { onCancel } = renderForm();

  fireEvent.click(screen.getByRole('button', { name: '취소' }));
  expect(onCancel).toHaveBeenLastCalledWith(false);

  change(/^제목/, '보고서');
  fireEvent.click(screen.getByRole('button', { name: '취소' }));
  expect(onCancel).toHaveBeenLastCalledWith(true);
});
