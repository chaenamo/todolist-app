import { useEffect, useRef } from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import jaLocale from '@fullcalendar/core/locales/ja';
import koLocale from '@fullcalendar/core/locales/ko';
import type { TodoWithStatus } from '../../api/types';
import type { DateRange } from '../../lib/date';
import { useLocaleStore, type Locale } from '../../stores/localeStore';
import { dayLabel, fromViewRange, toDateString, toEvents } from './adapter';
import './calendar.css';

interface Props {
  view: 'month' | 'week';
  date: string;
  items: TodoWithStatus[];
  compact: boolean;
  onRangeChange: (range: DateRange) => void;
  onEventClick: (id: number) => void;
  onDateSelect: (date: string) => void;
}

// 영어는 FullCalendar 기본 로케일('en')
const FC_LOCALE = { ko: koLocale, ja: jaLocale, en: 'en' } satisfies Record<Locale, unknown>;
const VIEW_NAME = { month: 'dayGridMonth', week: 'dayGridWeek' } as const;

export function CalendarView({
  view,
  date,
  items,
  compact,
  onRangeChange,
  onEventClick,
  onDateSelect,
}: Props) {
  const ref = useRef<FullCalendar>(null);
  const locale = useLocaleStore((s) => s.locale);

  // initialView/initialDate는 최초 1회만 반영되므로 이후 변경은 API로 이동한다
  useEffect(() => {
    ref.current?.getApi().changeView(VIEW_NAME[view], date);
  }, [view, date]);

  return (
    <FullCalendar
      ref={ref}
      plugins={[dayGridPlugin]}
      initialView={VIEW_NAME[view]}
      initialDate={date}
      headerToolbar={false}
      firstDay={0}
      fixedWeekCount={view === 'month'}
      height="auto"
      locale={FC_LOCALE[locale]}
      dayMaxEventRows={compact ? 2 : false}
      moreLinkContent={(arg) => `+${arg.num}`}
      // 핸들러가 void를 반환하면 팝오버·뷰 전환 없이 끝난다
      moreLinkClick={(arg) => {
        onDateSelect(toDateString(arg.date));
      }}
      navLinks
      navLinkDayClick={(d) => onDateSelect(toDateString(d))}
      dayCellContent={(arg) => dayLabel(arg.date)}
      // 주간도 요일만 표시(날짜는 칸 안의 번호로 충분)
      dayHeaderFormat={{ weekday: 'short' }}
      events={toEvents(items)}
      datesSet={(arg) =>
        onRangeChange(fromViewRange(toDateString(arg.start), toDateString(arg.end)))
      }
      eventClick={(arg) => {
        arg.jsEvent.preventDefault();
        onEventClick(Number(arg.event.id));
      }}
    />
  );
}
