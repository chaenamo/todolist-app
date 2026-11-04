import { LIMITS, isDateString, trimmedString, parseId, parsePage, parseLimit, fieldErrors } from './common.js';
import { TODO_STATUS } from '../domain/todoStatus.js';

const TODO_INPUT_FIELDS = new Set(['title', 'description', 'categoryId', 'startDate', 'endDate']);

function checkDate(value) {
  if (value === undefined || value === null || value === '') return { error: '필수 입력 항목입니다' };
  return isDateString(value) ? { value } : { error: '날짜 형식이 올바르지 않습니다(YYYY-MM-DD)' };
}

function checkDescription(value) {
  if (value === undefined || value === null) return { value: null };
  if (typeof value !== 'string') return { error: '문자열이어야 합니다' };
  if (value.length > LIMITS.DESCRIPTION_MAX) return { error: `${LIMITS.DESCRIPTION_MAX}자 이하로 입력하세요` };
  return { value };
}

// 생략·null이면 '기본'(BR-08, SC-07-A2) → null로 돌려준다
function checkCategoryId(value) {
  if (value === undefined || value === null) return { value: null };
  const id = parseId(value);
  return id === null ? { error: '카테고리를 찾을 수 없습니다' } : { value: id };
}

// 등록(POST)·수정(PUT) 공용 (BR-17). 정의되지 않은 필드(isCompleted 등)는 400 (AQ-10)
export function validateTodoInput(body = {}) {
  const errors = fieldErrors();
  for (const key of Object.keys(body)) {
    if (!TODO_INPUT_FIELDS.has(key)) errors.add(key, '허용되지 않는 필드입니다');
  }
  const input = {
    title: errors.take('title', trimmedString(body.title, { max: LIMITS.TITLE_MAX })), // EQ-03: trim 저장
    description: errors.take('description', checkDescription(body.description)),
    categoryId: errors.take('categoryId', checkCategoryId(body.categoryId)),
    startDate: errors.take('startDate', checkDate(body.startDate)),
    endDate: errors.take('endDate', checkDate(body.endDate)),
  };
  // BR-11: 같은 날 허용. 'YYYY-MM-DD'는 문자열 비교가 날짜 비교와 같다(PR-04)
  if (input.startDate && input.endDate && input.endDate < input.startDate) {
    errors.add('endDate', '종료일자는 시작일자 이후여야 합니다');
  }
  errors.throwIfAny();
  return input;
}

function checkListCategoryId(value) {
  if (value === undefined) return { value: null };
  const id = parseId(value);
  return id === null ? { error: '올바른 id가 아닙니다' } : { value: id };
}

// 'A,B' 형식. 반복 키(status=A&status=B)는 배열로 들어오므로 거부한다
function checkStatuses(value) {
  if (value === undefined || value === '') return { value: [] };
  if (typeof value !== 'string') return { error: '올바른 상태 값이 아닙니다' };
  const parts = value.split(',');
  if (!parts.every((part) => Object.hasOwn(TODO_STATUS, part))) return { error: '올바른 상태 값이 아닙니다' };
  return { value: [...new Set(parts)] };
}

// 목록 조회 쿼리. 정의되지 않은 키는 무시한다. categoryId 소유 검사는 하지 않는다(타인·없는 id는 빈 목록)
export function validateListQuery(query = {}) {
  const errors = fieldErrors();
  const result = {
    today: errors.take('today', checkDate(query.today)),
    categoryId: errors.take('categoryId', checkListCategoryId(query.categoryId)),
    statuses: errors.take('status', checkStatuses(query.status)),
    page: errors.take('page', parsePage(query.page)),
    limit: errors.take('limit', parseLimit(query.limit)),
  };
  errors.throwIfAny();
  return result;
}

// AQ-10: 완료 토글은 { isCompleted: boolean }만 허용
export function validateCompletion(body = {}) {
  const errors = fieldErrors();
  for (const key of Object.keys(body)) {
    if (key !== 'isCompleted') errors.add(key, '허용되지 않는 필드입니다');
  }
  if (typeof body.isCompleted !== 'boolean') errors.add('isCompleted', 'true 또는 false여야 합니다');
  errors.throwIfAny();
  return body.isCompleted;
}
