import { test, beforeEach, after } from 'node:test';
import assert from 'node:assert/strict';
import request from 'supertest';
import { app } from '../src/app.js';
import { pool, resetDb, createUserAndToken, bearer } from './helpers.js';

beforeEach(resetDb);
after(async () => {
  await resetDb();
  await pool.end();
});

const VALID = { title: '보고서', startDate: '2026-11-10', endDate: '2026-11-12' };
const create = (token, body) => request(app).post('/api/todos').set(bearer(token)).send(body);
const put = (token, id, body) => request(app).put(`/api/todos/${id}`).set(bearer(token)).send(body);

async function defaultCategoryId(userId) {
  const { rows } = await pool.query('SELECT id FROM categories WHERE user_id = $1 AND is_default', [userId]);
  return rows[0].id;
}

async function addCategory(token, name) {
  return (await request(app).post('/api/categories').set(bearer(token)).send({ name })).body.id;
}

test("AC-01, BR-08: categoryId 없이 등록 → 201, 본인 '기본' 카테고리", async () => {
  const me = await createUserAndToken();
  const res = await create(me.accessToken, VALID);
  assert.equal(res.status, 201);
  assert.equal(res.body.categoryId, await defaultCategoryId(me.user.id));
  assert.deepEqual(Object.keys(res.body).sort(), [
    'categoryId', 'completedAt', 'createdAt', 'description', 'endDate', 'id', 'isCompleted', 'startDate', 'title', 'updatedAt',
  ]); // AQ-09: status 없음
  assert.equal(res.body.startDate, '2026-11-10');
  assert.equal(res.body.isCompleted, false);
  assert.equal(res.body.completedAt, null);
});

test('지정한 본인 카테고리로 등록, 제목은 trim 저장 (EQ-03)', async () => {
  const me = await createUserAndToken();
  const workId = await addCategory(me.accessToken, '업무');
  const res = await create(me.accessToken, { ...VALID, title: '  발표  ', categoryId: workId, description: '슬라이드' });
  assert.equal(res.status, 201);
  assert.equal(res.body.categoryId, workId);
  assert.equal(res.body.title, '발표');
  assert.equal(res.body.description, '슬라이드');
});

test('AC-02, BR-11: 시작 2026-11-12, 종료 2026-11-10 → 400 fields.endDate', async () => {
  const me = await createUserAndToken();
  const res = await create(me.accessToken, { title: 't', startDate: '2026-11-12', endDate: '2026-11-10' });
  assert.equal(res.status, 400);
  assert.equal(res.body.error.code, 'VALIDATION_ERROR');
  assert.deepEqual(Object.keys(res.body.error.fields), ['endDate']);
});

test('BR-11, BR-12: 하루짜리와 과거 날짜 등록 → 201', async () => {
  const me = await createUserAndToken();
  assert.equal((await create(me.accessToken, { title: '하루', startDate: '2026-11-13', endDate: '2026-11-13' })).status, 201);
  assert.equal((await create(me.accessToken, { title: '과거', startDate: '2020-01-01', endDate: '2020-01-03' })).status, 201);
});

test('BR-10: 제목·시작일자·종료일자 각각 누락 → 400 해당 fields', async () => {
  const me = await createUserAndToken();
  for (const field of ['title', 'startDate', 'endDate']) {
    const body = { ...VALID };
    delete body[field];
    const res = await create(me.accessToken, body);
    assert.equal(res.status, 400, field);
    assert.deepEqual(Object.keys(res.body.error.fields), [field]);
  }
  const blank = await create(me.accessToken, { ...VALID, title: '   ' });
  assert.ok(blank.body.error.fields.title);
});

test('NFR-13: 잘못된 날짜 형식(2026-13-01)·길이 초과·잘못된 categoryId → 400', async () => {
  const me = await createUserAndToken();
  const cases = [
    [{ ...VALID, startDate: '2026-13-01' }, 'startDate'],
    [{ ...VALID, endDate: '2026/11/12' }, 'endDate'],
    [{ ...VALID, title: 'a'.repeat(101) }, 'title'],
    [{ ...VALID, description: 'a'.repeat(1001) }, 'description'],
    [{ ...VALID, description: 5 }, 'description'],
    [{ ...VALID, categoryId: 'abc' }, 'categoryId'],
    [{ ...VALID, categoryId: -1 }, 'categoryId'],
  ];
  for (const [body, field] of cases) {
    const res = await create(me.accessToken, body);
    assert.equal(res.status, 400, JSON.stringify(body).slice(0, 80));
    assert.ok(res.body.error.fields[field], field);
  }
  assert.equal((await pool.query('SELECT COUNT(*) AS c FROM todos')).rows[0].c, 0);
});

test("BR-17, SC-07-A2: 수정 시 같은 검증, categoryId를 비우면 '기본'으로", async () => {
  const me = await createUserAndToken();
  const workId = await addCategory(me.accessToken, '업무');
  const { body: todo } = await create(me.accessToken, { ...VALID, categoryId: workId });

  const bad = await put(me.accessToken, todo.id, { title: 't', startDate: '2026-11-12', endDate: '2026-11-10' });
  assert.equal(bad.status, 400);
  assert.ok(bad.body.error.fields.endDate);
  const missing = await put(me.accessToken, todo.id, { startDate: '2026-11-12', endDate: '2026-11-12' });
  assert.ok(missing.body.error.fields.title);

  for (const categoryId of [null, undefined]) {
    const res = await put(me.accessToken, todo.id, { ...VALID, title: '수정', categoryId });
    assert.equal(res.status, 200);
    assert.equal(res.body.categoryId, await defaultCategoryId(me.user.id));
    assert.equal(res.body.title, '수정');
  }
});

test('SC-07-A1: 완료된 할일을 PUT으로 수정해도 isCompleted·completedAt 유지, updatedAt 변경', async () => {
  const me = await createUserAndToken();
  const { body: todo } = await create(me.accessToken, VALID);
  await pool.query(
    "UPDATE todos SET is_completed = true, completed_at = '2026-11-12T10:00:00Z', updated_at = '2026-11-12T10:00:00Z' WHERE id = $1",
    [todo.id],
  );
  const res = await put(me.accessToken, todo.id, { ...VALID, title: '수정됨' });
  assert.equal(res.status, 200);
  assert.equal(res.body.isCompleted, true);
  assert.equal(new Date(res.body.completedAt).toISOString(), '2026-11-12T10:00:00.000Z');
  assert.notEqual(new Date(res.body.updatedAt).toISOString(), '2026-11-12T10:00:00.000Z');
});

test('AQ-10: PUT·POST 본문에 isCompleted가 있으면 400', async () => {
  const me = await createUserAndToken();
  const { body: todo } = await create(me.accessToken, VALID);
  const res = await put(me.accessToken, todo.id, { ...VALID, isCompleted: true });
  assert.equal(res.status, 400);
  assert.ok(res.body.error.fields.isCompleted);
  assert.equal((await create(me.accessToken, { ...VALID, isCompleted: true })).status, 400);
});

test('GET /api/todos/:id 본인 할일 200 (status 없음)', async () => {
  const me = await createUserAndToken();
  const { body: todo } = await create(me.accessToken, VALID);
  const res = await request(app).get(`/api/todos/${todo.id}`).set(bearer(me.accessToken));
  assert.equal(res.status, 200);
  assert.deepEqual(res.body, todo);
});

test('BR-14, SC-08-E1: 삭제 → 204, 이후 같은 id GET·DELETE → 404', async () => {
  const me = await createUserAndToken();
  const { body: todo } = await create(me.accessToken, VALID);
  const path = `/api/todos/${todo.id}`;
  assert.equal((await request(app).delete(path).set(bearer(me.accessToken))).status, 204);
  assert.equal((await request(app).get(path).set(bearer(me.accessToken))).status, 404);
  assert.equal((await request(app).delete(path).set(bearer(me.accessToken))).status, 404);
  assert.equal((await put(me.accessToken, todo.id, VALID)).status, 404);
});

test(':id가 숫자가 아니면 400', async () => {
  const me = await createUserAndToken();
  for (const id of ['abc', '1.5', '0', '-1']) {
    for (const method of ['get', 'put', 'delete']) {
      const res = await request(app)[method](`/api/todos/${id}`).set(bearer(me.accessToken)).send(VALID);
      assert.equal(res.status, 400, `${method} ${id}`);
      assert.equal(res.body.error.code, 'VALIDATION_ERROR');
    }
  }
});

test('토큰 없이 할일 경로 401', async () => {
  assert.equal((await request(app).post('/api/todos').send(VALID)).status, 401);
  assert.equal((await request(app).get('/api/todos/1')).status, 401);
});
