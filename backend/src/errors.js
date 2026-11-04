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
