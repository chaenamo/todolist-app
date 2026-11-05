import { expect, test } from 'vitest';
import type { TodoWithStatus } from '../../api/types';
import { DONE_CLASS, dayLabel, fromViewRange, toDateString, toEvents } from './adapter';

function todo(over: Partial<TodoWithStatus> = {}): TodoWithStatus {
  return {
    id: 7,
    categoryId: 1,
    title: '보고서',
    description: null,
    startDate: '2026-11-14',
    endDate: '2026-11-16',
    isCompleted: false,
    completedAt: null,
    createdAt: '2026-11-01T00:00:00Z',
    updatedAt: '2026-11-01T00:00:00Z',
    status: 'NOT_STARTED',
    ...over,
  };
}

test('[AC-05, PR-18] 할일 2026-10-30~11-02 → 이벤트 end = 2026-11-03', () => {
  const [event] = toEvents([todo({ startDate: '2026-10-30', endDate: '2026-11-02' })]);
  expect(event.start).toBe('2026-10-30');
  expect(event.end).toBe('2026-11-03');
});

test('[AC-06] 할일 2026-11-14~11-16 → start = 2026-11-14, end = 2026-11-17', () => {
  const [event] = toEvents([todo()]);
  expect(event).toEqual({
    id: '7',
    title: '보고서',
    start: '2026-11-14',
    end: '2026-11-17',
    allDay: true,
    classNames: ['todo-status-NOT_STARTED'],
  });
});

test('[AQ-04] fromViewRange(2026-11-01, 2026-12-13) → from 2026-11-01, to 2026-12-12', () => {
  expect(fromViewRange('2026-11-01', '2026-12-13')).toEqual({
    from: '2026-11-01',
    to: '2026-12-12',
  });
});

test('[Q-03] 완료 할일 이벤트에 취소선 클래스가 붙는다', () => {
  const [done, open] = toEvents([
    todo({ id: 1, isCompleted: true, status: 'COMPLETED' }),
    todo({ id: 2, isCompleted: false, status: 'OVERDUE' }),
  ]);
  expect(DONE_CLASS).toBe('todo-done');
  expect(done.classNames).toEqual(['todo-status-COMPLETED', 'todo-done']);
  expect(open.classNames).toEqual(['todo-status-OVERDUE']);
});

test('[AQ-04] toDateString은 로컬 날짜를 YYYY-MM-DD로 만든다', () => {
  expect(toDateString(new Date(2026, 0, 5))).toBe('2026-01-05');
});

test('[PR-18] FullCalendar import가 components/calendar/ 밖에 없다', () => {
  const sources = import.meta.glob(['/src/**/*.{ts,tsx}', '!/src/**/*.test.*'], {
    query: '?raw',
    import: 'default',
    eager: true,
  }) as Record<string, string>;

  const users = Object.entries(sources)
    .filter(([, code]) => code.includes('@fullcalendar'))
    .map(([path]) => path);
  expect(users.some((p) => p.startsWith('/src/components/calendar/'))).toBe(true);
  expect(users.filter((p) => !p.startsWith('/src/components/calendar/'))).toEqual([]);
});

test('[SG-30] dayLabel은 숫자만, 1일은 월/일로 표시한다', () => {
  expect(dayLabel(new Date(2026, 10, 5))).toBe('5');
  expect(dayLabel(new Date(2026, 10, 1))).toBe('11/1');
  expect(dayLabel(new Date(2026, 11, 1))).toBe('12/1');
});
