import { AppError, ERROR_CODES, notFoundError } from '../errors.js';

// PR-46, AQ-02: unique 제약 이름 → 응답 필드. 매핑 표는 여기 한 곳
const UNIQUE_FIELD_MAP = {
  uq_users_email: { field: 'email', message: '이미 사용 중인 이메일입니다' },
  uq_categories_user_id_name: { field: 'name', message: '이미 있는 이름입니다' },
};

function send(res, status, code, message, fields) {
  res.status(status).json({ error: fields ? { code, message, fields } : { code, message } });
}

export function notFound() {
  throw notFoundError();
}

// eslint-disable-next-line no-unused-vars -- Express는 인자 4개로 에러 미들웨어를 구분한다
export function errorHandler(err, req, res, next) {
  if (err instanceof AppError) {
    return send(res, err.status, err.code, err.message, err.fields);
  }
  if (err.code === '23505') {
    const mapped = UNIQUE_FIELD_MAP[err.constraint];
    if (mapped) {
      return send(res, 409, ERROR_CODES.CONFLICT, mapped.message, { [mapped.field]: mapped.message });
    }
    return send(res, 409, ERROR_CODES.CONFLICT, '이미 존재하는 데이터입니다');
  }
  // EQ-01: 카테고리 삭제와 할일 쓰기 경합
  if (err.code === '23503' && err.constraint === 'fk_todos_category_owner') {
    return send(res, 409, ERROR_CODES.CONFLICT, '다른 변경과 충돌했습니다. 다시 시도해 주세요');
  }
  if (err.type === 'entity.parse.failed') {
    return send(res, 400, ERROR_CODES.VALIDATION_ERROR, '요청 본문이 올바른 JSON이 아닙니다');
  }
  console.error(err.stack ?? err);
  send(res, 500, ERROR_CODES.INTERNAL, '일시적인 오류가 발생했습니다. 잠시 후 다시 시도해 주세요');
}
