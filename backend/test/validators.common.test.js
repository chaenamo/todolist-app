import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  isDateString,
  trimmedString,
  parseId,
  parsePage,
  parseLimit,
  fieldErrors,
} from '../src/validators/common.js';
import { AppError } from '../src/errors.js';

test('isDateString: 형식과 실제 날짜', () => {
  assert.equal(isDateString('2026-11-13'), true);
  assert.equal(isDateString('2028-02-29'), true); // 윤년
  for (const bad of ['2026-2-1', '2026-02-30', '20261113', '', undefined, null, 20261113, '2026-13-01', '2026-00-10', '2026-11-00', '2100-02-29', ' 2026-11-13']) {
    assert.equal(isDateString(bad), false, String(bad));
  }
});

test('trimmedString: trim 후 길이 검사', () => {
  assert.deepEqual(trimmedString('  업무  ', { max: 30 }), { value: '업무' });
  assert.ok(trimmedString('   ', { max: 30 }).error);
  assert.ok(trimmedString(undefined, { max: 30 }).error);
  assert.ok(trimmedString(123, { max: 30 }).error);
  assert.ok(trimmedString('a'.repeat(31), { max: 30 }).error);
  assert.deepEqual(trimmedString('a'.repeat(30), { max: 30 }), { value: 'a'.repeat(30) });
});

test('parseId: 양의 정수만', () => {
  assert.equal(parseId('12'), 12);
  assert.equal(parseId(12), 12);
  for (const bad of ['0', '-1', '1.5', 'abc', '01', '', 0, -3, 1.5, null, undefined, '99999999999999999999']) {
    assert.equal(parseId(bad), null, String(bad));
  }
});

test('PR-43: parsePage/parseLimit 기본값·절삭·오류', () => {
  assert.deepEqual(parseLimit(undefined), { value: 50 });
  assert.deepEqual(parseLimit('101'), { value: 100 });
  assert.deepEqual(parseLimit('100'), { value: 100 });
  assert.deepEqual(parseLimit('20'), { value: 20 });
  assert.deepEqual(parsePage(undefined), { value: 1 });
  assert.deepEqual(parsePage('3'), { value: 3 });
  for (const bad of ['0', '-1', 'abc', '']) {
    assert.ok(parseLimit(bad).error, `limit ${bad}`);
    assert.ok(parsePage(bad).error, `page ${bad}`);
  }
});

test('PR-43: page·limit 오류는 400 VALIDATION_ERROR + fields', () => {
  const errors = fieldErrors();
  errors.take('page', parsePage('0'));
  errors.take('limit', parseLimit('abc'));
  assert.throws(
    () => errors.throwIfAny(),
    (err) =>
      err instanceof AppError &&
      err.status === 400 &&
      err.code === 'VALIDATION_ERROR' &&
      Boolean(err.fields.page) &&
      Boolean(err.fields.limit),
  );
});

test('fieldErrors: 오류가 없으면 던지지 않고, 필드별 첫 오류만 남긴다', () => {
  const errors = fieldErrors();
  assert.equal(errors.take('limit', parseLimit('20')), 20);
  errors.throwIfAny();

  errors.add('title', '첫 오류');
  errors.add('title', '두 번째');
  assert.throws(() => errors.throwIfAny(), (err) => err.fields.title === '첫 오류');
});
