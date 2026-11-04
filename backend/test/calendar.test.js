import { test, beforeEach, after } from 'node:test';
import assert from 'node:assert/strict';
import request from 'supertest';
import { app } from '../src/app.js';
import { AppError } from '../src/errors.js';
import { validateCalendarQuery } from '../src/validators/todo.js';
import { pool, resetDb, createUserAndToken, bearer } from './helpers.js';

beforeEach(resetDb);
after(async () => {
  await resetDb();
  await pool.end();
});

const TODO_KEYS = [
  'categoryId',
  'completedAt',
  'createdAt',
  'description',
  'endDate',
  'id',
  'isCompleted',
  'startDate',
  'status',
  'title',
  'updatedAt',
];

const calendar = (token, query) =>
  request(app).get(`/api/todos/calendar?${query}`).set(bearer(token));
const ids = (res) => res.body.items.map((t) => t.id);

async function defaultCategoryId(userId) {
  const { rows } = await pool.query(
    'SELECT id FROM categories WHERE user_id = $1 AND is_default',
    [userId],
  );
  return rows[0].id;
}

// 완료 여부를 직접 제어하려고 API 대신 INSERT (CHECK: is_completed = (completed_at IS NOT NULL))
async function insertTodo(userId, categoryId, { start, end, done = false }) {
  const { rows } = await pool.query(
    `INSERT INTO todos (user_id, category_id, title, start_date, end_date, is_completed, completed_at)
     VALUES ($1, $2, 't', $3, $4, $5, CASE WHEN $5 THEN now() END)
     RETURNING id`,
    [userId, categoryId, start, end, done],
  );
  return rows[0].id;
}

async function setupUser() {
  const me = await createUserAndToken();
  return { ...me, catId: await defaultCategoryId(me.user.id) };
}

test('AC-05: 10/30~11/02 할일이 11월 월간 조회(11/01~11/30)에 포함', async () => {
  const me = await setupUser();
  const id = await insertTodo(me.user.id, me.catId, { start: '2026-10-30', end: '2026-11-02' });

  const res = await calendar(me.accessToken, 'from=2026-11-01&to=2026-11-30&today=2026-11-04');
  assert.equal(res.status, 200);
  assert.deepEqual(ids(res), [id]);
});

test('AC-06: 11/14~11/16 할일이 주간 조회(11/08~11/14)에 포함', async () => {
  const me = await setupUser();
  const id = await insertTodo(me.user.id, me.catId, { start: '2026-11-14', end: '2026-11-16' });

  const res = await calendar(me.accessToken, 'from=2026-11-08&to=2026-11-14&today=2026-11-04');
  assert.equal(res.status, 200);
  assert.deepEqual(ids(res), [id]);
});

test('BR-16: 기간 밖 제외, 경계(시작일=to, 종료일=from) 포함, startDate→id 정렬', async () => {
  const me = await setupUser();
  const uid = me.user.id;
  // 기간 밖: 종료일 < from, 시작일 > to
  await insertTodo(uid, me.catId, { start: '2026-11-01', end: '2026-11-07' });
  await insertTodo(uid, me.catId, { start: '2026-11-15', end: '2026-11-20' });
  // 경계: 시작일 = to, 종료일 = from
  const startsAtTo = await insertTodo(uid, me.catId, { start: '2026-11-14', end: '2026-11-20' });
  const endsAtFrom = await insertTodo(uid, me.catId, { start: '2026-11-03', end: '2026-11-08' });
  // 같은 시작일이면 id 오름차순
  const midA = await insertTodo(uid, me.catId, { start: '2026-11-10', end: '2026-11-12' });
  const midB = await insertTodo(uid, me.catId, { start: '2026-11-10', end: '2026-11-10' });

  const res = await calendar(me.accessToken, 'from=2026-11-08&to=2026-11-14&today=2026-11-04');
  assert.equal(res.status, 200);
  assert.deepEqual(ids(res), [endsAtFrom, midA, midB, startsAtTo]);
});

test('AQ-05: 응답은 { items }만, 항목은 Todo 필드 + today 기준 status', async () => {
  const me = await setupUser();
  const uid = me.user.id;
  const ns = await insertTodo(uid, me.catId, { start: '2026-11-14', end: '2026-11-16' });
  const ip = await insertTodo(uid, me.catId, { start: '2026-11-12', end: '2026-11-14' });
  const done = await insertTodo(uid, me.catId, {
    start: '2026-11-02',
    end: '2026-11-03',
    done: true,
  });
  const od = await insertTodo(uid, me.catId, { start: '2026-11-01', end: '2026-11-05' });

  const res = await calendar(me.accessToken, 'from=2026-11-01&to=2026-11-30&today=2026-11-13');
  assert.equal(res.status, 200);
  assert.deepEqual(Object.keys(res.body), ['items']);
  assert.equal(res.body.items.length, 4);
  for (const item of res.body.items) assert.deepEqual(Object.keys(item).sort(), TODO_KEYS);

  const statusById = Object.fromEntries(res.body.items.map((t) => [t.id, t.status]));
  assert.equal(statusById[ns], 'NOT_STARTED');
  assert.equal(statusById[ip], 'IN_PROGRESS');
  assert.equal(statusById[done], 'COMPLETED');
  assert.equal(statusById[od], 'OVERDUE');

  // 같은 할일이라도 today가 바뀌면 status가 바뀐다
  const earlier = await calendar(me.accessToken, 'from=2026-11-01&to=2026-11-30&today=2026-11-04');
  const earlierById = Object.fromEntries(earlier.body.items.map((t) => [t.id, t.status]));
  assert.equal(earlierById[od], 'IN_PROGRESS');
});

test('NFR-12: 다른 사용자 할일은 포함하지 않음', async () => {
  const a = await setupUser();
  const b = await setupUser();
  const mine = await insertTodo(a.user.id, a.catId, { start: '2026-11-10', end: '2026-11-12' });
  await insertTodo(b.user.id, b.catId, { start: '2026-11-10', end: '2026-11-12' });

  const res = await calendar(a.accessToken, 'from=2026-11-01&to=2026-11-30&today=2026-11-04');
  assert.equal(res.status, 200);
  assert.deepEqual(ids(res), [mine]);
});

test('BR-16: 42일 기간은 200, 43일 기간은 400 fields.to', async () => {
  const me = await setupUser();
  const ok = await calendar(me.accessToken, 'from=2026-11-01&to=2026-12-12&today=2026-11-04');
  assert.equal(ok.status, 200);

  const tooLong = await calendar(me.accessToken, 'from=2026-11-01&to=2026-12-13&today=2026-11-04');
  assert.equal(tooLong.status, 400);
  assert.equal(tooLong.body.error.code, 'VALIDATION_ERROR');
  assert.ok(tooLong.body.error.fields.to);
});

test('PR-38: 잘못된 쿼리 파라미터 → 400 해당 fields', async () => {
  const me = await setupUser();
  const cases = [
    ['from=2026-11-01&to=2026-11-30', 'today'],
    ['to=2026-11-30&today=2026-11-04', 'from'],
    ['from=2026-11-01&today=2026-11-04', 'to'],
    ['from=2026/11/01&to=2026-11-30&today=2026-11-04', 'from'],
    ['from=2026-11-01&to=2026-11-3&today=2026-11-04', 'to'],
    ['from=2026-11-01&to=2026-11-30&today=abc', 'today'],
    ['from=2026-02-30&to=2026-03-10&today=2026-11-04', 'from'],
    ['from=2026-02-01&to=2026-02-30&today=2026-11-04', 'to'],
    ['from=2026-11-01&to=2026-11-30&today=2026-02-30', 'today'],
    ['from=2026-11-30&to=2026-11-01&today=2026-11-04', 'to'],
  ];
  for (const [query, field] of cases) {
    const res = await calendar(me.accessToken, query);
    assert.equal(res.status, 400, query);
    assert.equal(res.body.error.code, 'VALIDATION_ERROR', query);
    assert.ok(res.body.error.fields[field], query);
  }
});

test('/api/todos/calendar는 /:id로 매칭되지 않음', async () => {
  const me = await setupUser();
  // /:id로 갔다면 id 검증 오류가 났을 것. calendar 검증 오류여야 한다
  const bad = await request(app).get('/api/todos/calendar').set(bearer(me.accessToken));
  assert.equal(bad.status, 400);
  assert.equal(bad.body.error.code, 'VALIDATION_ERROR');
  assert.equal(bad.body.error.fields.id, undefined);
  assert.ok(bad.body.error.fields.from);
  assert.ok(bad.body.error.fields.to);
  assert.ok(bad.body.error.fields.today);

  const ok = await calendar(me.accessToken, 'from=2026-11-01&to=2026-11-30&today=2026-11-04');
  assert.equal(ok.status, 200);
  assert.deepEqual(ok.body, { items: [] });
});

test('토큰 없이 캘린더 조회 401', async () => {
  const res = await request(app).get(
    '/api/todos/calendar?from=2026-11-01&to=2026-11-30&today=2026-11-04',
  );
  assert.equal(res.status, 401);
});

test('validateCalendarQuery: 정상 입력은 { from, to, today } 반환', () => {
  assert.deepEqual(
    validateCalendarQuery({ from: '2026-11-01', to: '2026-11-30', today: '2026-11-04' }),
    { from: '2026-11-01', to: '2026-11-30', today: '2026-11-04' },
  );
  // 하루짜리(from = to)와 42일 경계도 허용
  assert.deepEqual(
    validateCalendarQuery({ from: '2026-11-04', to: '2026-11-04', today: '2026-11-04' }),
    { from: '2026-11-04', to: '2026-11-04', today: '2026-11-04' },
  );
  assert.equal(
    validateCalendarQuery({ from: '2026-11-01', to: '2026-12-12', today: '2026-11-04' }).to,
    '2026-12-12',
  );
});

test('validateCalendarQuery: 실패 시 AppError(400) + 필드별 fields', () => {
  const isValidation = (keys) => (err) =>
    err instanceof AppError &&
    err.status === 400 &&
    err.code === 'VALIDATION_ERROR' &&
    keys.every((k) => Boolean(err.fields[k]));

  assert.throws(() => validateCalendarQuery({}), isValidation(['from', 'to', 'today']));
  assert.throws(
    () => validateCalendarQuery({ from: '2026-11-30', to: '2026-11-01', today: '2026-11-04' }),
    isValidation(['to']),
  );
  assert.throws(
    () => validateCalendarQuery({ from: '2026-11-01', to: '2026-12-13', today: '2026-11-04' }),
    isValidation(['to']),
  );
  assert.throws(
    () => validateCalendarQuery({ from: '2026-02-30', to: '2026-03-01', today: '2026-11-04' }),
    isValidation(['from']),
  );
});
