// PR-20: 에러 코드 ↔ HTTP 상태
export const ERROR_CODES = {
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  FORBIDDEN_OPERATION: 'FORBIDDEN_OPERATION',
  UNAUTHORIZED: 'UNAUTHORIZED',
  NOT_FOUND: 'NOT_FOUND',
  CONFLICT: 'CONFLICT',
  INTERNAL: 'INTERNAL',
};

export class AppError extends Error {
  constructor(status, code, message, fields) {
    super(message);
    this.status = status;
    this.code = code;
    this.fields = fields;
  }
}

// NFR-12: 없음과 타인 소유를 구분하지 않는다
export function notFoundError() {
  return new AppError(404, ERROR_CODES.NOT_FOUND, '찾을 수 없습니다');
}
