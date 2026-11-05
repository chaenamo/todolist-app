import { beforeEach, expect, test } from 'vitest';
import { useUiStore } from './uiStore';

const initial = {
  categoryId: null,
  statuses: [],
  page: 1,
  calendarView: 'month',
  calendarDate: null,
} as const;

beforeEach(() => {
  useUiStore.setState({ ...initial, statuses: [] });
});

test('[G-09] 기본값은 전체 카테고리, 상태 없음, 1페이지, month 뷰다', () => {
  const s = useUiStore.getState();
  expect(s.categoryId).toBeNull();
  expect(s.statuses).toEqual([]);
  expect(s.page).toBe(1);
  expect(s.calendarView).toBe('month');
  expect(s.calendarDate).toBeNull();
});

test('[G-09] setCategoryId는 카테고리를 바꾸고 page를 1로 되돌린다', () => {
  useUiStore.getState().setPage(3);
  useUiStore.getState().setCategoryId(7);

  expect(useUiStore.getState().categoryId).toBe(7);
  expect(useUiStore.getState().page).toBe(1);
});

test('[G-09] setStatuses는 상태 필터를 바꾸고 page를 1로 되돌린다', () => {
  useUiStore.getState().setPage(3);
  useUiStore.getState().setStatuses(['IN_PROGRESS', 'OVERDUE']);

  expect(useUiStore.getState().statuses).toEqual(['IN_PROGRESS', 'OVERDUE']);
  expect(useUiStore.getState().page).toBe(1);
});

test('[G-09] setPage는 page만 바꾸고 필터는 유지한다', () => {
  useUiStore.getState().setCategoryId(2);
  useUiStore.getState().setPage(4);

  expect(useUiStore.getState().page).toBe(4);
  expect(useUiStore.getState().categoryId).toBe(2);
});

test('[G-09] setCalendarView와 setCalendarDate는 캘린더 상태를 바꾼다', () => {
  useUiStore.getState().setCalendarView('week');
  useUiStore.getState().setCalendarDate('2026-11-05');

  expect(useUiStore.getState().calendarView).toBe('week');
  expect(useUiStore.getState().calendarDate).toBe('2026-11-05');
});
