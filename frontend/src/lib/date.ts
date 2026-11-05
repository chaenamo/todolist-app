export interface DateRange {
  from: string;
  to: string;
}

const pad = (n: number, w = 2): string => String(n).padStart(w, '0');

// 로컬 시간대 연산을 피하려고 UTC 자정으로 파싱한다
function parse(date: string): Date {
  const [y, m, d] = date.split('-').map(Number);
  return new Date(Date.UTC(y, m - 1, d));
}

function format(d: Date): string {
  return `${pad(d.getUTCFullYear(), 4)}-${pad(d.getUTCMonth() + 1)}-${pad(d.getUTCDate())}`;
}

// toISOString은 UTC 기준이라 사용자 로컬 날짜와 어긋날 수 있다
export function todayString(now: Date = new Date()): string {
  return `${pad(now.getFullYear(), 4)}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
}

export function addDays(date: string, days: number): string {
  const d = parse(date);
  d.setUTCDate(d.getUTCDate() + days);
  return format(d);
}

export function dayOfWeek(date: string): number {
  return parse(date).getUTCDay();
}

export function diffDays(from: string, to: string): number {
  return Math.round((parse(to).getTime() - parse(from).getTime()) / 86_400_000);
}

export function monthRange(date: string): DateRange {
  const d = parse(date);
  return {
    from: format(new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), 1))),
    // 다음 달 0일 = 이번 달 말일 (윤년 자동 처리)
    to: format(new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth() + 1, 0))),
  };
}

// 주 시작은 일요일(A-12)
export function weekRange(date: string): DateRange {
  const from = addDays(date, -parse(date).getUTCDay());
  return { from, to: addDays(from, 6) };
}

// 달력 그리드는 항상 6주(42일)로 고정해 높이가 변하지 않게 한다
export function monthGridRange(date: string): DateRange {
  const from = weekRange(monthRange(date).from).from;
  return { from, to: addDays(from, 41) };
}

// 'YYYY-MM-DD' → 'M/D' (Date 없이 문자열로 처리해 시간대 영향 제거)
export function formatMonthDay(date: string): string {
  const [, m, d] = date.split('-');
  return `${Number(m)}/${Number(d)}`;
}
