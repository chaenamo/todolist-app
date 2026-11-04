// ST-01~04, PR-03: 상태는 저장하지 않고 today 기준으로 파생한다. 날짜는 'YYYY-MM-DD' 문자열 비교(PR-04)
export const TODO_STATUS = {
  NOT_STARTED: 'NOT_STARTED',
  IN_PROGRESS: 'IN_PROGRESS',
  COMPLETED: 'COMPLETED',
  OVERDUE: 'OVERDUE',
};

// 판정 순서: 완료 → 기한 초과 → 진행 중 → 시작 전
export function deriveStatus(todo, today) {
  if (todo.isCompleted) return TODO_STATUS.COMPLETED;
  if (today > todo.endDate) return TODO_STATUS.OVERDUE;
  if (today >= todo.startDate) return TODO_STATUS.IN_PROGRESS;
  return TODO_STATUS.NOT_STARTED;
}

// deriveStatus와 같은 판정을 SQL로. `{t}` 자리에 today 파라미터 자리표시자가 들어간다
const SQL_FRAGMENTS = {
  COMPLETED: 'is_completed',
  OVERDUE: '(NOT is_completed AND end_date < {t})',
  IN_PROGRESS: '(NOT is_completed AND start_date <= {t} AND end_date >= {t})',
  NOT_STARTED: '(NOT is_completed AND start_date > {t})',
};

// PR-38: 화이트리스트 조각만 반환한다. paramRef는 '$3' 같은 자리표시자만 허용
export function statusSqlCondition(status, paramRef) {
  if (!Object.hasOwn(SQL_FRAGMENTS, status)) throw new Error(`unknown status: ${status}`);
  if (!/^\$[1-9]\d*$/.test(paramRef)) throw new Error(`invalid param ref: ${paramRef}`);
  return SQL_FRAGMENTS[status].replaceAll('{t}', `${paramRef}::date`);
}
