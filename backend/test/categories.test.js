import { test, beforeEach, after } from 'node:test';
import assert from 'node:assert/strict';
import request from 'supertest';
import { app } from '../src/app.js';
import { findCategoryById, findDefaultCategory } from '../src/repositories/categoryRepository.js';
import { pool, resetDb, createUserAndToken, bearer } from './helpers.js';

beforeEach(resetDb);
after(async () => {
  await resetDb();
  await pool.end();
});

const post = (token, body) => request(app).post('/api/categories').set(bearer(token)).send(body);
const list = (token) => request(app).get('/api/categories').set(bearer(token));

test("BR-02: 목록은 본인 카테고리만, 첫 항목은 '기본'", async () => {
  const me = await createUserAndToken();
  const other = await createUserAndToken();
  await post(other.accessToken, { name: '남의 것' });
  await post(me.accessToken, { name: '가나다' });
  await post(me.accessToken, { name: 'Alpha' });

  const res = await list(me.accessToken);
  assert.equal(res.status, 200);
  assert.deepEqual(Object.keys(res.body), ['items']);
  const names = res.body.items.map((c) => c.name);
  assert.equal(names[0], '기본');
  assert.equal(res.body.items[0].isDefault, true);
  assert.equal(names.length, 3);
  assert.ok(!names.includes('남의 것'));
  assert.deepEqual(Object.keys(res.body.items[0]).sort(), ['id', 'isDefault', 'name']);
});

test('BR-07: POST {name: "  업무  "} → 201, 저장된 이름 "업무"', async () => {
  const me = await createUserAndToken();
  const res = await post(me.accessToken, { name: '  업무  ' });
  assert.equal(res.status, 201);
  assert.equal(res.body.name, '업무');
  assert.equal(res.body.isDefault, false);
  const { rows } = await pool.query('SELECT name FROM categories WHERE id = $1', [res.body.id]);
  assert.equal(rows[0].name, '업무');
});

test('SC-03-E1: 공백만·누락·비문자열·31자 이름 → 400 fields.name', async () => {
  const me = await createUserAndToken();
  for (const body of [{ name: '   ' }, {}, { name: 42 }, { name: 'a'.repeat(31) }]) {
    const res = await post(me.accessToken, body);
    assert.equal(res.status, 400, JSON.stringify(body));
    assert.equal(res.body.error.code, 'VALIDATION_ERROR');
    assert.ok(res.body.error.fields.name);
  }
});

test('SC-03-E2: " 업무 " 재등록과 "기본" 등록 → 409 fields.name', async () => {
  const me = await createUserAndToken();
  await post(me.accessToken, { name: '업무' });
  for (const name of [' 업무 ', '기본']) {
    const res = await post(me.accessToken, { name });
    assert.equal(res.status, 409, name);
    assert.equal(res.body.error.code, 'CONFLICT');
    assert.ok(res.body.error.fields.name);
  }
});

test('CN-06: 다른 사용자는 같은 이름 "업무"를 등록할 수 있다', async () => {
  const a = await createUserAndToken();
  const b = await createUserAndToken();
  assert.equal((await post(a.accessToken, { name: '업무' })).status, 201);
  assert.equal((await post(b.accessToken, { name: '업무' })).status, 201);
});

test("findDefaultCategory·findCategoryById: 본인 것만, 없으면 null", async () => {
  const me = await createUserAndToken();
  const other = await createUserAndToken();
  const mine = await findDefaultCategory(pool, me.user.id);
  assert.equal(mine.name, '기본');
  assert.deepEqual(await findCategoryById(pool, me.user.id, mine.id), mine);
  assert.equal(await findCategoryById(pool, other.user.id, mine.id), null); // PR-10
  assert.equal(await findDefaultCategory(pool, 999999), null);
});

test('BR-01: 토큰 없이 GET·POST 모두 401', async () => {
  assert.equal((await request(app).get('/api/categories')).status, 401);
  assert.equal((await request(app).post('/api/categories').send({ name: '업무' })).status, 401);
});

// ---------- 수정·삭제 (BE-12) ----------

const patch = (token, id, body) =>
  request(app).patch(`/api/categories/${id}`).set(bearer(token)).send(body);
const del = (token, id) => request(app).delete(`/api/categories/${id}`).set(bearer(token));
const categoryRow = async (id) =>
  (await pool.query('SELECT * FROM categories WHERE id = $1', [id])).rows[0];
const defaultId = async (userId) =>
  (await pool.query('SELECT id FROM categories WHERE user_id = $1 AND is_default', [userId]))
    .rows[0].id;

async function createTodos(token, categoryId, count) {
  const ids = [];
  for (let i = 0; i < count; i += 1) {
    const res = await request(app)
      .post('/api/todos')
      .set(bearer(token))
      .send({ title: `할일${i}`, startDate: '2026-11-10', endDate: '2026-11-12', categoryId });
    ids.push(res.body.id);
  }
  return ids;
}

const todoCategoryIds = async (ids) =>
  (
    await pool.query('SELECT category_id FROM todos WHERE id = ANY($1) ORDER BY id', [ids])
  ).rows.map((r) => r.category_id);

// 테스트 DB에 실패 트리거를 걸어 트랜잭션 롤백을 확인한다 (auth.test.js와 같은 방식, 이벤트만 파라미터)
// body 기본값은 예외, 'RETURN NULL'이면 행을 건너뛴다(조회 후 사라진 경합 재현)
async function withFailingTrigger(event, table, fn, body = "RAISE EXCEPTION 'injected'") {
  await pool.query(
    `CREATE FUNCTION inject_fail() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN ${body}; END $$`,
  );
  await pool.query(
    `CREATE TRIGGER inject_fail BEFORE ${event} ON ${table} FOR EACH ROW EXECUTE FUNCTION inject_fail()`,
  );
  try {
    await fn();
  } finally {
    await pool.query(`DROP TRIGGER inject_fail ON ${table}`);
    await pool.query('DROP FUNCTION inject_fail()');
  }
}

test('BR-07, SC-03-A1: PATCH 이름 trim 저장, 공백 400, 중복 409', async () => {
  const me = await createUserAndToken();
  const { body: work } = await post(me.accessToken, { name: '업무' });
  await post(me.accessToken, { name: '개인' });

  const res = await patch(me.accessToken, work.id, { name: '  회사  ' });
  assert.equal(res.status, 200);
  assert.deepEqual(res.body, { id: work.id, name: '회사', isDefault: false });
  assert.equal((await categoryRow(work.id)).name, '회사');

  for (const body of [{ name: '   ' }, { name: '' }]) {
    const blank = await patch(me.accessToken, work.id, body);
    assert.equal(blank.status, 400, JSON.stringify(body));
    assert.ok(blank.body.error.fields.name);
  }

  for (const name of [' 개인 ', '기본']) {
    const dup = await patch(me.accessToken, work.id, { name });
    assert.equal(dup.status, 409, name);
    assert.equal(dup.body.error.code, 'CONFLICT');
    assert.ok(dup.body.error.fields.name);
  }
  assert.equal((await categoryRow(work.id)).name, '회사');
});

test("BR-06, SC-03-E3: '기본' 카테고리 PATCH·DELETE → 400 FORBIDDEN_OPERATION, DB 불변", async () => {
  const me = await createUserAndToken();
  const id = await defaultId(me.user.id);
  const before = await categoryRow(id);

  for (const res of [
    await patch(me.accessToken, id, { name: '변경' }),
    await del(me.accessToken, id),
  ]) {
    assert.equal(res.status, 400);
    assert.equal(res.body.error.code, 'FORBIDDEN_OPERATION');
  }
  assert.deepEqual(await categoryRow(id), before);
});

test("BR-09: 할일 3건이 속한 카테고리 삭제 → 204, 3건 모두 '기본' 소속, 목록에서 빠짐", async () => {
  const me = await createUserAndToken();
  const { body: work } = await post(me.accessToken, { name: '업무' });
  const todoIds = await createTodos(me.accessToken, work.id, 3);
  const defaultCategoryId = await defaultId(me.user.id);

  const res = await del(me.accessToken, work.id);
  assert.equal(res.status, 204);
  assert.deepEqual(await todoCategoryIds(todoIds), Array(3).fill(defaultCategoryId));
  assert.equal(await categoryRow(work.id), undefined);
  const { body } = await list(me.accessToken);
  assert.ok(!body.items.some((c) => c.id === work.id));
});

test('PR-11: 카테고리 DELETE 실패 시 할일 이동도 롤백된다', async (t) => {
  t.mock.method(console, 'error', () => {});
  const me = await createUserAndToken();
  const { body: work } = await post(me.accessToken, { name: '업무' });
  const todoIds = await createTodos(me.accessToken, work.id, 3);

  await withFailingTrigger('DELETE', 'categories', async () => {
    const res = await del(me.accessToken, work.id);
    assert.equal(res.status, 500);
  });
  assert.deepEqual(await todoCategoryIds(todoIds), Array(3).fill(work.id));
  assert.ok(await categoryRow(work.id));
});

test('PATCH·DELETE: 없는 id 404, 형식 오류 400, 토큰 없음 401', async () => {
  const me = await createUserAndToken();
  for (const res of [
    await patch(me.accessToken, 999999, { name: '업무' }),
    await del(me.accessToken, 999999),
  ]) {
    assert.equal(res.status, 404);
    assert.equal(res.body.error.code, 'NOT_FOUND');
  }
  assert.equal((await patch(me.accessToken, 'abc', { name: '업무' })).status, 400);
  assert.equal((await del(me.accessToken, 'abc')).status, 400);
  assert.equal((await request(app).patch('/api/categories/1').send({ name: '업무' })).status, 401);
  assert.equal((await request(app).delete('/api/categories/1')).status, 401);
});

test('경합: 조회 후 수정·삭제 대상 행이 사라지면 404', async () => {
  const me = await createUserAndToken();
  const { body: work } = await request(app)
    .post('/api/categories')
    .set(bearer(me.accessToken))
    .send({ name: '업무' });
  await withFailingTrigger(
    'UPDATE',
    'categories',
    async () => assert.equal((await patch(me.accessToken, work.id, { name: '새이름' })).status, 404),
    'RETURN NULL',
  );
  await withFailingTrigger(
    'DELETE',
    'categories',
    async () => assert.equal((await del(me.accessToken, work.id)).status, 404),
    'RETURN NULL',
  );
});
