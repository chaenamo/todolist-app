import { LIMITS, trimmedString, fieldErrors } from './common.js';
import { checkPassword } from './auth.js';

// A-06: 이메일 등 name 외 필드는 400 (AQ-10과 같은 방식)
export function validateUpdateMe(body = {}) {
  const errors = fieldErrors();
  for (const key of Object.keys(body)) {
    if (key !== 'name') errors.add(key, '허용되지 않는 필드입니다');
  }
  const name = errors.take('name', trimmedString(body.name, { max: LIMITS.USER_NAME_MAX }));
  errors.throwIfAny();
  return { name };
}

export function validateChangePassword(body = {}) {
  const errors = fieldErrors();
  const input = {
    currentPassword: errors.take(
      'currentPassword',
      typeof body.currentPassword === 'string' && body.currentPassword !== ''
        ? { value: body.currentPassword }
        : { error: '현재 비밀번호를 입력하세요' },
    ),
    newPassword: errors.take('newPassword', checkPassword(body.newPassword)),
  };
  errors.throwIfAny();
  return input;
}
