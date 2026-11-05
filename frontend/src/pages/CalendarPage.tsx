import { useCallback, useMemo, useState } from 'react';
import { useNavigate } from 'react-router';
import { CalendarView } from '../components/calendar/CalendarView';
import { DayTodoList } from '../components/calendar/DayTodoList';
import { useCalendarTodos } from '../hooks/useCalendarTodos';
import { useCategories } from '../hooks/useCategories';
import { useMediaQuery } from '../hooks/useMediaQuery';
import { categoryName, useT } from '../i18n';
import {
  addDays,
  formatDayTitle,
  formatMonthTitle,
  monthRange,
  todayString,
  weekRange,
  type DateRange,
} from '../lib/date';
import { useLocaleStore } from '../stores/localeStore';
import { useUiStore, type CalendarView as ViewType } from '../stores/uiStore';
import styles from './CalendarPage.module.css';

const SEGMENTS: ViewType[] = ['month', 'week', 'day'];

export function CalendarPage() {
  const t = useT();
  const locale = useLocaleStore((s) => s.locale);
  const navigate = useNavigate();
  const calendarView = useUiStore((s) => s.calendarView);
  const calendarDate = useUiStore((s) => s.calendarDate);
  const setCalendarView = useUiStore((s) => s.setCalendarView);
  const setCalendarDate = useUiStore((s) => s.setCalendarDate);
  const openDay = useUiStore((s) => s.openDay);
  const date = calendarDate ?? todayString();
  const compact = useMediaQuery('(max-width: 767px)');
  const [gridRange, setGridRange] = useState<DateRange | null>(null);
  const range = calendarView === 'day' ? { from: date, to: date } : gridRange;
  const { data, error } = useCalendarTodos(range);
  const { data: categories } = useCategories();
  const categoryNames = useMemo(
    () => new Map((categories ?? []).map((c) => [c.id, categoryName(c, t)])),
    [categories, t],
  );

  // 같은 범위로 다시 호출돼도 state가 바뀌지 않게 해 datesSet 루프를 막는다
  const onRangeChange = useCallback((r: DateRange) => {
    setGridRange((prev) => (prev && prev.from === r.from && prev.to === r.to ? prev : r));
  }, []);
  const openEdit = useCallback(
    (id: number) => void navigate(`/todos/${id}/edit`, { state: { from: '/calendar' } }),
    [navigate],
  );

  const move = (dir: -1 | 1) => {
    if (calendarView === 'month') {
      const { from, to } = monthRange(date);
      setCalendarDate(dir < 0 ? monthRange(addDays(from, -1)).from : addDays(to, 1));
    } else {
      setCalendarDate(addDays(date, dir * (calendarView === 'week' ? 7 : 1)));
    }
  };

  const week = weekRange(date);
  const title =
    calendarView === 'month'
      ? formatMonthTitle(date, locale)
      : calendarView === 'week'
        ? `${week.from.replaceAll('-', '.')} ~ ${week.to.slice(5).replace('-', '.')}`
        : formatDayTitle(date, locale);

  return (
    <section>
      <div className={styles.toolbar}>
        <div className={styles.nav}>
          <button
            type="button"
            className={styles.btn}
            aria-label={t.calendar.prev[calendarView]}
            onClick={() => move(-1)}
          >
            ‹
          </button>
          <button type="button" className={styles.btn} onClick={() => setCalendarDate(null)}>
            {t.calendar.today}
          </button>
          <button
            type="button"
            className={styles.btn}
            aria-label={t.calendar.next[calendarView]}
            onClick={() => move(1)}
          >
            ›
          </button>
        </div>
        <h1 className={styles.title}>{title}</h1>
        <div role="group" aria-label={t.calendar.view} className={styles.segment}>
          {SEGMENTS.map((v) => (
            <button
              key={v}
              type="button"
              className={`${styles.btn} ${styles.seg}`}
              aria-pressed={calendarView === v}
              onClick={() => setCalendarView(v)}
            >
              {t.calendar[v]}
            </button>
          ))}
        </div>
      </div>
      {error && (
        <p role="alert" className={styles.error}>
          {error.message}
        </p>
      )}
      {calendarView === 'day' ? (
        <DayTodoList items={data?.items ?? []} categoryNames={categoryNames} onSelect={openEdit} />
      ) : (
        <CalendarView
          view={calendarView}
          date={date}
          compact={compact}
          items={data?.items ?? []}
          onRangeChange={onRangeChange}
          onEventClick={openEdit}
          onDateSelect={openDay}
        />
      )}
    </section>
  );
}
