import type { EventInput } from '@fullcalendar/core';
import type { TodoWithStatus } from '../../api/types';
import { addDays, todayString, type DateRange } from '../../lib/date';

export const DONE_CLASS = 'todo-done';

export function toEvents(items: TodoWithStatus[]): EventInput[] {
  return items.map((t) => ({
    id: String(t.id),
    title: t.title,
    start: t.startDate,
    // FullCalendar의 end는 배타적이라 하루를 더한다 (PR-18)
    end: addDays(t.endDate, 1),
    allDay: true,
    classNames: [`todo-status-${t.status}`, ...(t.isCompleted ? [DONE_CLASS] : [])],
  }));
}

// AQ-04: 뷰 범위의 end는 배타적이므로 하루를 뺀다
export function fromViewRange(start: string, endExclusive: string): DateRange {
  return { from: start, to: addDays(endExclusive, -1) };
}

export function toDateString(d: Date): string {
  return todayString(d);
}

// SG-30: 날짜 칸은 숫자만, 각 달 1일은 월을 붙여 '11/1'
export function dayLabel(date: Date): string {
  const day = date.getDate();
  return day === 1 ? `${date.getMonth() + 1}/${day}` : String(day);
}
