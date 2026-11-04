import { test, beforeEach, after } from 'node:test';
import assert from 'node:assert/strict';
import request from 'supertest';
import { app } from '../src/app.js';
import { validateListQuery } from '../src/validators/todo.js';
import { pool, resetDb, createUserAndToken, bearer } from './helpers.js';

beforeEach(resetDb);
after(async () => {
  await resetDb();
  await pool.end();
});

const TODO_KEYS = [
  'categoryId', 'completedAt', 'createdAt', 'description', 'endDate', 'id', 'isCompleted', 'startDate', 'status', 'title', 'updatedAt',
];

const list = (token, query) => request(app).get(`/api/todos?${query}`).set(bearer(token));
const ids = (res) => res.body.items.map((t) => t.id);

async function defaultCategoryId(userId) {
  const { rows } = await pool.query('SELECT id FROM categories WHERE user_id = $1 AND is_default', [userId]);
  return rows[0].id;
}

async function addCategory(token, name) {
  return (await request(app).post('/api/categories').set(bearer(token)).send({ name })).body.id;
}

// 완료 여부·created_at을 직접 제어하려고 API 대신 INSERT (CHECK: is_completed = (completed_at IS NOT NULL))
async function insertTodo(userId, categoryId, { start, end, done = false, createdAt = null }) {
  const { rows } = await pool.query(
    `INSERT INTO todos (user_id, category_id, title, start_date, end_date, is_completed, completed_at, created_at)
     VALUES ($1, $2, 't', $3, $4, $5, CASE WHEN $5 THEN now() END, COALESCE($6::timestamptz, now()))
     RETURNING id`,
    [userId, categoryId, start, end, done, createdAt],
  );
  return rows[0].id;
}

async function setupUser() {
  const me = await createUserAndToken();
  return { ...me, catId: await defaultCategoryId(me.user.id) };
}

test('AC-03: 종료 11/12 미완료 할일, today=11/13 OVERDUE 필터 → 포함, IN_PROGRESS → 빈 목록', async () => {
  const me = await setupUser();
  const id = await insertTodo(me.user.id, me.catId, { start: '2026-11-10', end: '2026-11-12' });

  const res = await list(me.accessToken, 'today=2026-11-13&status=OVERDUE');
  assert.equal(res.status, 200);
  assert.equal(res.body.total, 1);
  assert.deepEqual(ids(res), [id]);
  assert.equal(res.body.items[0].status, 'OVERDUE');

  const none = await list(me.accessToken, 'today=2026-11-13&status=IN_PROGRESS');
  assert.equal(none.status, 200);
  assert.deepEqual(none.body.items, []);
  assert.equal(none.body.total, 0);
});

test('AC-04, BR-15: 카테고리 AND (상태 OR) 조합 필터', async () => {
  const me = await createUserAndToken();
  const work = await addCategory(me.accessToken, '업무');
  const personal = await addCategory(me.accessToken, '개인');
  const uid = me.user.id;
  const ns = await insertTodo(uid, work, { start: '2026-11-14', end: '2026-11-16' });
  const ip = await insertTodo(uid, work, { start: '2026-11-12', end: '2026-11-14' });
  await insertTodo(uid, work, { start: '2026-11-12', end: '2026-11-14', done: true });
  await insertTodo(uid, work, { start: '2026-11-01', end: '2026-11-05' });
  await insertTodo(uid, personal, { start: '2026-11-12', end: '2026-11-14' });

  const res = await list(me.accessToken, `today=2026-11-13&categoryId=${work}&status=NOT_STARTED,IN_PROGRESS`);
  assert.equal(res.status, 200);
  assert.equal(res.body.total, 2);
  assert.deepEqual(new Set(ids(res)), new Set([ns, ip]));
  const statusById = Object.fromEntries(res.body.items.map((t) => [t.id, t.status]));
  assert.equal(statusById[ns], 'NOT_STARTED');
  assert.equal(statusById[ip], 'IN_PROGRESS');
});

test('BR-15, NFR-12: 본인 할일만 조회, 항목은 Todo 필드 + status', async () => {
  const a = await setupUser();
  const b = await setupUser();
  const a1 = await insertTodo(a.user.id, a.catId, { start: '2026-11-10', end: '2026-11-12' });
  const a2 = await insertTodo(a.user.id, a.catId, { start: '2026-11-10', end: '2026-11-14' });
  const b1 = await insertTodo(b.user.id, b.catId, { start: '2026-11-10', end: '2026-11-12' });

  const res = await list(a.accessToken, 'today=2026-11-13');
  assert.equal(res.status, 200);
  assert.equal(res.body.total, 2);
  assert.deepEqual(new Set(ids(res)), new Set([a1, a2]));
  assert.ok(!ids(res).includes(b1));
  assert.deepEqual(Object.keys(res.body.items[0]).sort(), TODO_KEYS);
});

test('Q-05, AQ-08: 정렬은 end_date, created_at, id 오름차순', async () => {
  const me = await setupUser();
  const uid = me.user.id;
  const r1 = await insertTodo(uid, me.catId, { start: '2026-11-01', end: '2026-11-12', createdAt: '2026-11-04T10:00:00Z' });
  const r2 = await insertTodo(uid, me.catId, { start: '2026-11-01', end: '2026-11-10', createdAt: '2026-11-04T11:00:00Z' });
  const r3 = await insertTodo(uid, me.catId, { start: '2026-11-01', end: '2026-11-12', createdAt: '2026-11-04T09:00:00Z' });
  const r4 = await insertTodo(uid, me.catId, { start: '2026-11-01', end: '2026-11-12', createdAt: '2026-11-04T09:00:00Z' });

  const res = await list(me.accessToken, 'today=2026-11-13');
  assert.equal(res.status, 200);
  assert.deepEqual(ids(res), [r2, r3, r4, r1]);
});

test('NFR-06: 55건 페이지네이션 (50 + 5), 누락·중복 없음', async () => {
  const me = await setupUser();
  await pool.query(
    `INSERT INTO todos (user_id, category_id, title, start_date, end_date, created_at)
     SELECT $1, $2, 't' || g, '2026-11-01', '2026-11-20', '2026-11-04T10:00:00Z' FROM generate_series(1, 55) AS g`,
    [me.user.id, me.catId],
  );

  const p1 = await list(me.accessToken, 'today=2026-11-13&page=1&limit=50');
  const p2 = await list(me.accessToken, 'today=2026-11-13&page=2&limit=50');
  assert.equal(p1.status, 200);
  assert.equal(p2.status, 200);
  assert.equal(p1.body.items.length, 50);
  assert.equal(p2.body.items.length, 5);
  assert.equal(p1.body.total, 55);
  assert.equal(p2.body.total, 55);
  assert.equal(p2.body.page, 2);
  assert.equal(p2.body.limit, 50);

  const seen = new Set([...ids(p1), ...ids(p2)]);
  assert.equal(seen.size, 55);
  const { rows } = await pool.query('SELECT id FROM todos WHERE user_id = $1', [me.user.id]);
  assert.deepEqual(seen, new Set(rows.map((r) => r.id)));
});

test('PR-43, PR-38: limit=101 → 100 적용, today 누락·잘못된 status → 400', async () => {
  const me = await setupUser();
  const clipped = await list(me.accessToken, 'today=2026-11-13&limit=101');
  assert.equal(clipped.status, 200);
  assert.equal(clipped.body.limit, 100);

  const noToday = await list(me.accessToken, '');
  assert.equal(noToday.status, 400);
  assert.equal(noToday.body.error.code, 'VALIDATION_ERROR');
  assert.ok(noToday.body.error.fields.today);

  const badStatus = await list(me.accessToken, 'today=2026-11-13&status=FOO');
  assert.equal(badStatus.status, 400);
  assert.equal(badStatus.body.error.code, 'VALIDATION_ERROR');
  assert.ok(badStatus.body.error.fields.status);
});

test('NFR-12: 타인의 categoryId로 조회 → 200 빈 목록', async () => {
  const a = await setupUser();
  const b = await createUserAndToken();
  await insertTodo(a.user.id, a.catId, { start: '2026-11-10', end: '2026-11-12' });
  const bCat = await addCategory(b.accessToken, 'B전용');
  await insertTodo(b.user.id, bCat, { start: '2026-11-10', end: '2026-11-12' });

  const res = await list(a.accessToken, `today=2026-11-13&categoryId=${bCat}`);
  assert.equal(res.status, 200);
  assert.deepEqual(res.body.items, []);
  assert.equal(res.body.total, 0);

  const missing = await list(a.accessToken, 'today=2026-11-13&categoryId=999999');
  assert.equal(missing.status, 200);
  assert.equal(missing.body.total, 0);
});

test('today만 주면 page 1, limit 50 기본값', async () => {
  const me = await setupUser();
  const res = await list(me.accessToken, 'today=2026-11-13');
  assert.equal(res.status, 200);
  assert.equal(res.body.page, 1);
  assert.equal(res.body.limit, 50);
  assert.deepEqual(res.body.items, []);
  assert.equal(res.body.total, 0);
});

test('status=COMPLETED 단독 필터 → 완료 항목만 (today 파라미터 미사용 시 08P01 회귀)', async () => {
  const me = await setupUser();
  const done = await insertTodo(me.user.id, me.catId, { start: '2026-11-10', end: '2026-11-12', done: true });
  await insertTodo(me.user.id, me.catId, { start: '2026-11-10', end: '2026-11-12' });

  const res = await list(me.accessToken, 'today=2026-11-13&status=COMPLETED');
  assert.equal(res.status, 200);
  assert.deepEqual(ids(res), [done]);
  assert.equal(res.body.total, 1);
  assert.equal(res.body.items[0].status, 'COMPLETED');
  assert.equal(res.body.items[0].isCompleted, true);

  const withCat = await list(me.accessToken, `today=2026-11-13&categoryId=${me.catId}&status=COMPLETED`);
  assert.equal(withCat.status, 200);
  assert.deepEqual(ids(withCat), [done]);
});

test('네 상태 모두 지정 → 전체 건수와 같음', async () => {
  const me = await setupUser();
  const uid = me.user.id;
  await insertTodo(uid, me.catId, { start: '2026-11-14', end: '2026-11-16' });
  await insertTodo(uid, me.catId, { start: '2026-11-12', end: '2026-11-14' });
  await insertTodo(uid, me.catId, { start: '2026-11-12', end: '2026-11-14', done: true });
  await insertTodo(uid, me.catId, { start: '2026-11-01', end: '2026-11-05' });

  const all = await list(me.accessToken, 'today=2026-11-13');
  const res = await list(me.accessToken, 'today=2026-11-13&status=NOT_STARTED,IN_PROGRESS,COMPLETED,OVERDUE');
  assert.equal(res.status, 200);
  assert.equal(all.body.total, 4);
  assert.equal(res.body.total, 4);
  assert.deepEqual(new Set(res.body.items.map((t) => t.status)), new Set(['NOT_STARTED', 'IN_PROGRESS', 'COMPLETED', 'OVERDUE']));
});

test('중복 status는 하나로, status= (빈 문자열)은 필터 없음', async () => {
  const me = await setupUser();
  const od = await insertTodo(me.user.id, me.catId, { start: '2026-11-01', end: '2026-11-05' });
  await insertTodo(me.user.id, me.catId, { start: '2026-11-12', end: '2026-11-14' });

  const dup = await list(me.accessToken, 'today=2026-11-13&status=OVERDUE,OVERDUE');
  assert.equal(dup.status, 200);
  assert.deepEqual(ids(dup), [od]);
  assert.equal(dup.body.total, 1);

  const empty = await list(me.accessToken, 'today=2026-11-13&status=');
  assert.equal(empty.status, 200);
  assert.equal(empty.body.total, 2);
});

test('PR-38: 잘못된 쿼리 파라미터 → 400 해당 fields', async () => {
  const me = await setupUser();
  const cases = [
    ['today=2026-02-30', 'today'],
    ['today=2026/11/13', 'today'],
    ['today=2026-11-13&status=OVERDUE,', 'status'],
    ['today=2026-11-13&status=OVERDUE,FOO', 'status'],
    ['today=2026-11-13&status=overdue', 'status'],
    ['today=2026-11-13&status=OVERDUE&status=COMPLETED', 'status'],
    ['today=2026-11-13&categoryId=abc', 'categoryId'],
    ['today=2026-11-13&categoryId=0', 'categoryId'],
    ['today=2026-11-13&page=0', 'page'],
    ['today=2026-11-13&page=-1', 'page'],
    ['today=2026-11-13&limit=0', 'limit'],
    ['today=2026-11-13&limit=abc', 'limit'],
  ];
  for (const [query, field] of cases) {
    const res = await list(me.accessToken, query);
    assert.equal(res.status, 400, query);
    assert.equal(res.body.error.code, 'VALIDATION_ERROR', query);
    assert.ok(res.body.error.fields[field], query);
  }
});

test('PR-38: 여러 오류를 한 번에 모아 응답', async () => {
  const me = await setupUser();
  const res = await list(me.accessToken, 'page=0&limit=x');
  assert.equal(res.status, 400);
  assert.deepEqual(Object.keys(res.body.error.fields).sort(), ['limit', 'page', 'today']);
});

test('범위를 넘은 페이지 → 200 빈 목록, total은 전체 건수', async () => {
  const me = await setupUser();
  for (let i = 0; i < 3; i += 1) await insertTodo(me.user.id, me.catId, { start: '2026-11-10', end: '2026-11-12' });
  const res = await list(me.accessToken, 'today=2026-11-13&page=2&limit=50');
  assert.equal(res.status, 200);
  assert.deepEqual(res.body.items, []);
  assert.equal(res.body.total, 3);
});

test('토큰 없이 목록 조회 401', async () => {
  assert.equal((await request(app).get('/api/todos?today=2026-11-13')).status, 401);
});

test('validateListQuery: 기본값과 정규화', () => {
  assert.deepEqual(validateListQuery({ today: '2026-11-13' }), {
    today: '2026-11-13', categoryId: null, statuses: [], page: 1, limit: 50,
  });
  assert.deepEqual(
    validateListQuery({ today: '2026-11-13', categoryId: '3', status: 'OVERDUE,COMPLETED,OVERDUE', page: '2', limit: '500' }),
    { today: '2026-11-13', categoryId: 3, statuses: ['OVERDUE', 'COMPLETED'], page: 2, limit: 100 },
  );
});
