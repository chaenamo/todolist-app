import { create } from 'zustand';
import type { TodoStatus } from '../api/types';

export type CalendarView = 'month' | 'week' | 'day';

interface UiState {
  // 목록 필터·페이지 (PR-15)
  categoryId: number | null;
  statuses: TodoStatus[];
  page: number;
  // 캘린더 뷰·기준 날짜('YYYY-MM-DD', null이면 오늘)
  calendarView: CalendarView;
  calendarDate: string | null;
  setCategoryId: (categoryId: number | null) => void;
  setStatuses: (statuses: TodoStatus[]) => void;
  setPage: (page: number) => void;
  resetFilters: () => void;
  setCalendarView: (calendarView: CalendarView) => void;
  setCalendarDate: (calendarDate: string | null) => void;
  openDay: (date: string) => void;
}

export const useUiStore = create<UiState>()((set) => ({
  categoryId: null,
  statuses: [],
  page: 1,
  calendarView: 'month',
  calendarDate: null,
  // G-09: 필터가 바뀌면 1페이지로
  setCategoryId: (categoryId) => set({ categoryId, page: 1 }),
  setStatuses: (statuses) => set({ statuses, page: 1 }),
  setPage: (page) => set({ page }),
  resetFilters: () => set({ categoryId: null, statuses: [], page: 1 }),
  setCalendarView: (calendarView) => set({ calendarView }),
  setCalendarDate: (calendarDate) => set({ calendarDate }),
  // G-14: 월·주 화면의 날짜·+N 클릭은 일간 뷰로 진입
  openDay: (date) => set({ calendarView: 'day', calendarDate: date }),
}));
