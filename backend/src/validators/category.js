import { LIMITS, trimmedString, fieldErrors } from './common.js';

// BR-07: 앞뒤 공백 제거 후 저장·비교, 빈값 거부. 길이는 G-05 잠정
export function validateCategoryName(body = {}) {
  const errors = fieldErrors();
  const name = errors.take('name', trimmedString(body.name, { max: LIMITS.CATEGORY_NAME_MAX }));
  errors.throwIfAny();
  return name;
}
