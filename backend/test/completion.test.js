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

const ISO_DATETIME = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d+)?Z$/;

async function createTodo(token, body = { title: '보고서', startDate: '2026-11-10', endDate: '2026-11-12' }) {
  return (await request(app).post('/api/todos').set(bearer(token)).send(body)).body;
}
const patch = (token, id, body) => request(app).patch(`/api/todos/${id}`).set(bearer(token)).send(body);

test('BR-13: isCompleted true → 200, completedAt이 ISO 일시', async () => {
  const me = await createUserAndToken();
  const todo = await createTodo(me.accessToken);
  const res = await patch(me.accessToken, todo.id, { isCompleted: true });
  assert.equal(res.status, 200);
  assert.equal(res.body.isCompleted, true);
  assert.match(res.body.completedAt, ISO_DATETIME);
  assert.equal(res.body.status, undefined); // AQ-09
  assert.notEqual(res.body.updatedAt, todo.updatedAt);
});

test('BR-13: isCompleted false → 200, completedAt null', async () => {
  const me = await createUserAndToken();
  const todo = await createTodo(me.accessToken);
  await patch(me.accessToken, todo.id, { isCompleted: true });
  const res = await patch(me.accessToken, todo.id, { isCompleted: false });
  assert.equal(res.status, 200);
  assert.equal(res.body.isCompleted, false);
  assert.equal(res.body.completedAt, null);
  const { rows } = await pool.query('SELECT is_completed, completed_at FROM todos WHERE id = $1', [todo.id]);
  assert.deepEqual(rows[0], { is_completed: false, completed_at: null });
});

test('SC-06-A2: 종료일자가 지난 할일을 완료 취소하면 목록에서 OVERDUE', async () => {
  const me = await createUserAndToken();
  const todo = await createTodo(me.accessToken); // 11/10~11/12
  await patch(me.accessToken, todo.id, { isCompleted: true });

  const done = await request(app).get('/api/todos?today=2026-11-13').set(bearer(me.accessToken));
  assert.equal(done.body.items[0].status, 'COMPLETED');

  await patch(me.accessToken, todo.id, { isCompleted: false });
  const res = await request(app).get('/api/todos?today=2026-11-13').set(bearer(me.accessToken));
  assert.equal(res.body.items[0].id, todo.id);
  assert.equal(res.body.items[0].status, 'OVERDUE');
});

test('AQ-10: isCompleted 외 필드 또는 boolean이 아닌 값 → 400, 행 변화 없음', async () => {
  const me = await createUserAndToken();
  const todo = await createTodo(me.accessToken);
  const cases = [
    [{ isCompleted: true, title: '바꾸기' }, 'title'],
    [{ isCompleted: 'true' }, 'isCompleted'],
    [{ isCompleted: 1 }, 'isCompleted'],
    [{ isCompleted: null }, 'isCompleted'],
    [{}, 'isCompleted'],
  ];
  for (const [body, field] of cases) {
    const res = await patch(me.accessToken, todo.id, body);
    assert.equal(res.status, 400, JSON.stringify(body));
    assert.equal(res.body.error.code, 'VALIDATION_ERROR');
    assert.ok(res.body.error.fields[field], JSON.stringify(body));
  }
  const { rows } = await pool.query('SELECT is_completed, title FROM todos WHERE id = $1', [todo.id]);
  assert.deepEqual(rows[0], { is_completed: false, title: '보고서' });
});

test('없는 할일 PATCH → 404, :id 형식 오류 → 400, 토큰 없음 → 401', async () => {
  const me = await createUserAndToken();
  assert.equal((await patch(me.accessToken, 999999, { isCompleted: true })).status, 404);
  assert.equal((await patch(me.accessToken, 'abc', { isCompleted: true })).status, 400);
  assert.equal((await request(app).patch('/api/todos/1').send({ isCompleted: true })).status, 401);
});
