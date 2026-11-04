import { LIMITS, trimmedString, fieldErrors } from './common.js';

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// G-05 잠정: 형식·최대 254자, 대소문자 구분(입력값 그대로)
function checkEmail(value) {
  if (typeof value !== 'string' || value === '') return { error: '이메일을 입력하세요' };
  if (value.length > LIMITS.EMAIL_MAX || !EMAIL_PATTERN.test(value)) {
    return { error: '이메일 형식이 올바르지 않습니다' };
  }
  return { value };
}

// G-05 잠정: 8~72자. 72는 bcrypt가 읽는 바이트 한계라 바이트로 센다
export function checkPassword(value) {
  if (
    typeof value !== 'string' ||
    value.length < LIMITS.PASSWORD_MIN ||
    Buffer.byteLength(value) > LIMITS.PASSWORD_MAX
  ) {
    return { error: `비밀번호는 ${LIMITS.PASSWORD_MIN}~${LIMITS.PASSWORD_MAX}자여야 합니다` };
  }
  return { value };
}

function checkRequired(value, message) {
  return typeof value === 'string' && value !== '' ? { value } : { error: message };
}

export function validateSignup(body = {}) {
  const errors = fieldErrors();
  const input = {
    email: errors.take('email', checkEmail(body.email)),
    password: errors.take('password', checkPassword(body.password)),
    name: errors.take('name', trimmedString(body.name, { max: LIMITS.USER_NAME_MAX })),
  };
  errors.throwIfAny();
  return input;
}

export function validateLogin(body = {}) {
  const errors = fieldErrors();
  const input = {
    email: errors.take('email', checkEmail(body.email)),
    password: errors.take('password', checkRequired(body.password, '비밀번호를 입력하세요')),
  };
  errors.throwIfAny();
  return input;
}

// refresh·logout 공용
export function validateRefreshToken(body = {}) {
  const errors = fieldErrors();
  const refreshToken = errors.take(
    'refreshToken',
    checkRequired(body.refreshToken, 'refresh token이 필요합니다'),
  );
  errors.throwIfAny();
  return refreshToken;
}
