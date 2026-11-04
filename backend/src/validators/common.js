import { AppError, ERROR_CODES } from '../errors.js';

// G-05 잠정 길이·규칙 (PR-39: 이 한 곳에서만 정의)
export const LIMITS = {
  EMAIL_MAX: 254,
  PASSWORD_MIN: 8,
  PASSWORD_MAX: 72, // bcrypt 72바이트 한계
  USER_NAME_MAX: 50,
  CATEGORY_NAME_MAX: 30,
  TITLE_MAX: 100,
  DESCRIPTION_MAX: 1000,
};

// PR-43
export const PAGE_SIZE_DEFAULT = 50;
export const PAGE_SIZE_MAX = 100;

const DATE_PATTERN = /^(\d{4})-(\d{2})-(\d{2})$/;

// 형식 + 실제 날짜(2026-02-30 거부). Date 변환 없이 검사한다(PR-04)
export function isDateString(value) {
  const match = typeof value === 'string' && DATE_PATTERN.exec(value);
  if (!match) return false;
  const [year, month, day] = match.slice(1).map(Number);
  const isLeap = (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0;
  const daysInMonth = [31, isLeap ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
  return month >= 1 && month <= 12 && day >= 1 && day <= daysInMonth[month - 1];
}

// 앞뒤 공백 제거 후 길이 검사 (BR-07, BR-10). 결과는 { value } 또는 { error }
export function trimmedString(value, { min = 1, max }) {
  if (typeof value !== 'string') return { error: '필수 입력 항목입니다' };
  const trimmed = value.trim();
  if (trimmed.length < min) return { error: '필수 입력 항목입니다' };
  if (trimmed.length > max) return { error: `${max}자 이하로 입력하세요` };
  return { value: trimmed };
}

// 경로·쿼리 문자열 또는 JSON number의 양의 정수 id. 아니면 null
export function parseId(value) {
  const number = typeof value === 'string' && /^[1-9]\d*$/.test(value) ? Number(value) : value;
  return Number.isSafeInteger(number) && number > 0 ? number : null;
}

function parsePositiveInt(value, fallback) {
  if (value === undefined) return { value: fallback };
  const number = parseId(value);
  return number === null ? { error: '1 이상의 정수여야 합니다' } : { value: number };
}

export function parsePage(value) {
  return parsePositiveInt(value, 1);
}

// 100 초과는 오류가 아니라 100으로 자른다 (PR-43)
export function parseLimit(value) {
  const result = parsePositiveInt(value, PAGE_SIZE_DEFAULT);
  return result.error ? result : { value: Math.min(result.value, PAGE_SIZE_MAX) };
}

export function validationError(fields) {
  return new AppError(400, ERROR_CODES.VALIDATION_ERROR, '입력값을 확인해 주세요', fields);
}

// 필드 오류를 모았다가 한 번에 400으로 던진다. take는 { value } | { error }를 받아 value를 돌려준다
export function fieldErrors() {
  const fields = {};
  return {
    add(field, message) {
      fields[field] ??= message;
    },
    take(field, result) {
      if (result.error) fields[field] ??= result.error;
      return result.value;
    },
    throwIfAny() {
      if (Object.keys(fields).length > 0) throw validationError(fields);
    },
  };
}
