import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { listCalendarTodos } from '../api/todos';
import { diffDays, todayString, type DateRange } from '../lib/date';
import { TODOS_KEY } from './useTodos';

// AQ-05: 서버 상한(42일)을 넘는 범위는 요청하지 않는다
export const CALENDAR_MAX_DAYS = 42;

export function useCalendarTodos(range: DateRange | null) {
  const today = todayString();
  return useQuery({
    queryKey: [...TODOS_KEY, 'calendar', { from: range?.from, to: range?.to, today }],
    queryFn: () => {
      if (!range) throw new Error('range is required');
      return listCalendarTodos({ from: range.from, to: range.to, today });
    },
    enabled: range !== null && diffDays(range.from, range.to) + 1 <= CALENDAR_MAX_DAYS,
    placeholderData: keepPreviousData,
  });
}
