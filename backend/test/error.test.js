import { test } from 'node:test';
import assert from 'node:assert/strict';
import { errorHandler } from '../src/middleware/error.js';
import { AppError } from '../src/errors.js';

function run(err) {
  const res = {
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(body) {
      this.body = body;
      return this;
    },
  };
  errorHandler(err, {}, res, () => {});
  return res;
}

function pgError(code, constraint) {
  return Object.assign(new Error(`violates constraint ${constraint}`), { code, constraint });
}

test('AppError는 그 상태·코드·fields로 응답한다', () => {
  const res = run(new AppError(400, 'VALIDATION_ERROR', '입력값을 확인해 주세요', { title: '필수' }));
  assert.equal(res.statusCode, 400);
  assert.deepEqual(res.body, {
    error: { code: 'VALIDATION_ERROR', message: '입력값을 확인해 주세요', fields: { title: '필수' } },
  });
});

test('PR-46: 23505 uq_users_email → 409 fields.email', () => {
  const res = run(pgError('23505', 'uq_users_email'));
  assert.equal(res.statusCode, 409);
  assert.equal(res.body.error.code, 'CONFLICT');
  assert.ok(res.body.error.fields.email);
});

test('PR-46: 23505 uq_categories_user_id_name → 409 fields.name', () => {
  const res = run(pgError('23505', 'uq_categories_user_id_name'));
  assert.equal(res.statusCode, 409);
  assert.ok(res.body.error.fields.name);
});

test('PR-46: 매핑 없는 23505 → fields 없는 409', () => {
  const res = run(pgError('23505', 'uq_refresh_tokens_token_hash'));
  assert.equal(res.statusCode, 409);
  assert.equal(res.body.error.code, 'CONFLICT');
  assert.equal(res.body.error.fields, undefined);
});

test('EQ-01: 23503 fk_todos_category_owner → 409, fields 없음', () => {
  const res = run(pgError('23503', 'fk_todos_category_owner'));
  assert.equal(res.statusCode, 409);
  assert.equal(res.body.error.code, 'CONFLICT');
  assert.equal(res.body.error.fields, undefined);
});

test('PR-21: 기타 에러 → 500 INTERNAL, 스택·SQL 문구 없음', (t) => {
  t.mock.method(console, 'error', () => {});
  const err = pgError('42P01', undefined);
  err.message = 'relation "secret_table" does not exist SELECT * FROM secret_table';
  const res = run(err);
  assert.equal(res.statusCode, 500);
  assert.equal(res.body.error.code, 'INTERNAL');
  const text = JSON.stringify(res.body);
  assert.doesNotMatch(text, /secret_table|SELECT|at .*\.js/);
});
