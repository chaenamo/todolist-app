import { afterEach, expect, test, vi } from 'vitest';
import {
  addDays,
  dayOfWeek,
  diffDays,
  formatDayTitle,
  formatMonthDay,
  formatMonthTitle,
  monthGridRange,
  monthRange,
  todayString,
  weekRange,
} from './date';

// 앱 tsconfig는 Node 타입을 포함하지 않는다. 테스트는 Node에서 돌므로 TZ 전환에 필요한 만큼만 선언한다
declare const process: { env: Record<string, string | undefined> };

const originalTz = process.env.TZ;

afterEach(() => {
  vi.useRealTimers();
  if (originalTz === undefined) delete process.env.TZ;
  else process.env.TZ = originalTz;
});

test('[A-01, R-03] todayString은 시스템 TZ를 Asia/Seoul·America/Los_Angeles로 바꿔도 각 로컬 날짜를 반환한다', () => {
  vi.useFakeTimers();
  vi.setSystemTime(new Date('2026-11-13T15:30:00Z'));

  process.env.TZ = 'Asia/Seoul';
  expect(todayString()).toBe('2026-11-14');

  process.env.TZ = 'America/Los_Angeles';
  expect(todayString()).toBe('2026-11-13');
});

test('[A-01] todayString은 인자로 받은 Date의 로컬 날짜를 0 채움 형식으로 반환한다', () => {
  expect(todayString(new Date(2026, 0, 5, 23, 59))).toBe('2026-01-05');
});

test('[A-12, AC-06] weekRange(2026-11-11)은 2026-11-08~2026-11-14이다', () => {
  const week = { from: '2026-11-08', to: '2026-11-14' };
  expect(weekRange('2026-11-11')).toEqual(week);
  expect(weekRange('2026-11-08')).toEqual(week); // 일요일
  expect(weekRange('2026-11-14')).toEqual(week); // 토요일
  expect(weekRange('2026-12-31')).toEqual({ from: '2026-12-27', to: '2027-01-02' });
});

test('[AC-05] monthRange(2026-11-13)은 2026-11-01~2026-11-30, monthGridRange는 42일·일요일 시작이다', () => {
  expect(monthRange('2026-11-13')).toEqual({ from: '2026-11-01', to: '2026-11-30' });
  expect(monthGridRange('2026-11-13')).toEqual({ from: '2026-11-01', to: '2026-12-12' });

  const oct = monthGridRange('2026-10-15');
  expect(oct.from).toBe('2026-09-27');
  expect(diffDays(oct.from, oct.to)).toBe(41);

  expect(monthRange('2028-02-10')).toEqual({ from: '2028-02-01', to: '2028-02-29' });
  expect(monthRange('2027-02-10')).toEqual({ from: '2027-02-01', to: '2027-02-28' });
  expect(monthRange('2026-12-31')).toEqual({ from: '2026-12-01', to: '2026-12-31' });
});

test('[PR-04, AQ-04] addDays는 월말·윤년·연말 경계를 넘는다', () => {
  expect(addDays('2026-11-02', 1)).toBe('2026-11-03');
  expect(addDays('2026-11-30', 1)).toBe('2026-12-01');
  expect(addDays('2028-02-28', 1)).toBe('2028-02-29');
  expect(addDays('2028-02-29', 1)).toBe('2028-03-01');
  expect(addDays('2027-02-28', 1)).toBe('2027-03-01');
  expect(addDays('2026-12-31', 1)).toBe('2027-01-01');
  expect(addDays('2027-01-01', -1)).toBe('2026-12-31');
  expect(addDays('2026-11-13', 0)).toBe('2026-11-13');
});

test('[PR-04] diffDays는 to - from 일수를 반환한다', () => {
  expect(diffDays('2026-11-13', '2026-11-13')).toBe(0);
  expect(diffDays('2026-11-01', '2026-11-30')).toBe(29);
  expect(diffDays('2026-11-30', '2026-11-01')).toBe(-29);
  expect(diffDays('2028-02-28', '2028-03-01')).toBe(2);
});

test.each(['America/Los_Angeles', 'Pacific/Kiritimati'])(
  '[A-01, PR-04] %s TZ에서도 addDays·diffDays·weekRange·monthGridRange 결과는 같다',
  (tz) => {
    process.env.TZ = tz;
    expect(diffDays('2026-10-31', '2026-11-02')).toBe(2); // 미국 DST 종료(11-01) 경계
    expect(addDays('2026-10-31', 2)).toBe('2026-11-02');
    expect(addDays('2026-12-31', 1)).toBe('2027-01-01');
    expect(addDays('2027-01-01', -1)).toBe('2026-12-31');
    expect(diffDays('2028-02-28', '2028-03-01')).toBe(2);
    expect(weekRange('2026-11-11')).toEqual({ from: '2026-11-08', to: '2026-11-14' });
    expect(monthGridRange('2026-11-13')).toEqual({ from: '2026-11-01', to: '2026-12-12' });
  },
);

test('[WF-04] formatMonthDay는 YYYY-MM-DD를 0 없는 M/D로 바꾼다', () => {
  expect(formatMonthDay('2026-11-05')).toBe('11/5');
  expect(formatMonthDay('2026-11-10')).toBe('11/10');
  expect(formatMonthDay('2027-01-09')).toBe('1/9');
});

test('[WF-05] dayOfWeek는 0=일요일 기준 요일을 반환한다', () => {
  expect(dayOfWeek('2026-11-08')).toBe(0);
  expect(dayOfWeek('2026-11-11')).toBe(3);
  expect(dayOfWeek('2026-11-14')).toBe(6);
  expect(dayOfWeek('2028-02-29')).toBe(2);
  process.env.TZ = 'Pacific/Kiritimati';
  expect(dayOfWeek('2026-11-08')).toBe(0);
  process.env.TZ = 'America/Los_Angeles';
  expect(dayOfWeek('2026-11-08')).toBe(0);
});

test('[FE-15] formatMonthTitle은 언어별 표기를 UTC 기준으로 만든다', () => {
  expect(formatMonthTitle('2026-11-05', 'ko')).toBe('2026년 11월');
  expect(formatMonthTitle('2026-11-05', 'ja')).toBe('2026年11月');
  expect(formatMonthTitle('2026-11-05', 'en')).toBe('November 2026');
  expect(formatMonthTitle('2026-12-01', 'en')).toBe('December 2026');
});

test('[FE-15] formatDayTitle은 날짜와 요일을 언어별로 만든다', () => {
  expect(formatDayTitle('2026-11-11', 'ko')).toBe('2026년 11월 11일 (수)');
  expect(formatDayTitle('2026-11-11', 'ja')).toBe('2026年11月11日 (水)');
  expect(formatDayTitle('2026-11-11', 'en')).toBe('November 11, 2026 (Wed)');
});
