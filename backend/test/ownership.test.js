// NFR-12, PR-10: 타 사용자 할일·카테고리 접근 케이스 모음 (이후 Task도 여기에 추가)
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

async function snapshot(id) {
  const { rows } = await pool.query('SELECT * FROM todos WHERE id = $1', [id]);
  return rows[0];
}

test('NFR-12: 다른 사용자 카테고리 id로 등록·수정 → 400 fields.categoryId, 행 변화 없음', async () => {
  const me = await createUserAndToken();
  const other = await createUserAndToken();
  const { body: otherCategory } = await request(app)
    .post('/api/categories')
    .set(bearer(other.accessToken))
    .send({ name: '남의 것' });

  const created = await request(app)
    .post('/api/todos')
    .set(bearer(me.accessToken))
    .send({ ...VALID, categoryId: otherCategory.id });
  assert.equal(created.status, 400);
  assert.ok(created.body.error.fields.categoryId);
  assert.equal((await pool.query('SELECT COUNT(*) AS c FROM todos')).rows[0].c, 0);

  const nonexistent = await request(app)
    .post('/api/todos')
    .set(bearer(me.accessToken))
    .send({ ...VALID, categoryId: 999999 });
  assert.equal(nonexistent.status, 400);
  assert.ok(nonexistent.body.error.fields.categoryId);

  const { body: mine } = await request(app).post('/api/todos').set(bearer(me.accessToken)).send(VALID);
  const before = await snapshot(mine.id);
  const updated = await request(app)
    .put(`/api/todos/${mine.id}`)
    .set(bearer(me.accessToken))
    .send({ ...VALID, categoryId: otherCategory.id });
  assert.equal(updated.status, 400);
  assert.ok(updated.body.error.fields.categoryId);
  assert.deepEqual(await snapshot(mine.id), before);
});

test('NFR-12, SC-00-E3: 다른 사용자 할일 GET·PUT·DELETE → 404, 대상 행 변화 없음', async () => {
  const owner = await createUserAndToken();
  const intruder = await createUserAndToken();
  const { body: todo } = await request(app).post('/api/todos').set(bearer(owner.accessToken)).send(VALID);
  const before = await snapshot(todo.id);
  const path = `/api/todos/${todo.id}`;

  const responses = [
    await request(app).get(path).set(bearer(intruder.accessToken)),
    await request(app).put(path).set(bearer(intruder.accessToken)).send({ ...VALID, title: '탈취' }),
    await request(app).patch(path).set(bearer(intruder.accessToken)).send({ isCompleted: true }), // BE-09
    await request(app).delete(path).set(bearer(intruder.accessToken)),
  ];
  for (const res of responses) {
    assert.equal(res.status, 404);
    assert.equal(res.body.error.code, 'NOT_FOUND');
  }
  assert.deepEqual(await snapshot(todo.id), before);
});

test('NFR-12: 다른 사용자 카테고리 PATCH·DELETE → 404, 대상 행 변화 없음', async () => {
  const owner = await createUserAndToken();
  const intruder = await createUserAndToken();
  const { body: category } = await request(app)
    .post('/api/categories')
    .set(bearer(owner.accessToken))
    .send({ name: '업무' });
  const row = async () =>
    (await pool.query('SELECT * FROM categories WHERE id = $1', [category.id])).rows[0];
  const before = await row();
  const path = `/api/categories/${category.id}`;

  const responses = [
    await request(app).patch(path).set(bearer(intruder.accessToken)).send({ name: '탈취' }),
    await request(app).delete(path).set(bearer(intruder.accessToken)),
  ];
  for (const res of responses) {
    assert.equal(res.status, 404);
    assert.equal(res.body.error.code, 'NOT_FOUND');
  }
  assert.deepEqual(await row(), before);
});
